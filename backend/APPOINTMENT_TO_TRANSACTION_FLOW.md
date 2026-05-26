# 🔄 Quy trình Tự động từ Lịch Hẹn sang Giao Dịch

## 📋 Tổng quan

Hệ thống tự động tạo giao dịch khi môi giới xác nhận hoàn thành xem nhà, với thời hạn 24h để khách hàng đặt cọc.

---

## 🎯 Luồng hoạt động

### 1️⃣ Khách hàng đặt lịch xem nhà
- **Endpoint**: `POST /api/appointments`
- **Validation mới**:
  - ✅ Kiểm tra điểm uy tín
  - ✅ Kiểm tra lịch hẹn trùng
  - 🆕 **Kiểm tra có giao dịch `pending_deposit` chưa hết hạn không**
    - Nếu có → Không cho đặt lịch mới
    - Phải đợi 24h hoặc hoàn tất đặt cọc

### 2️⃣ Môi giới xác nhận "completed" (đã xem xong)
- **Endpoint**: `PATCH /api/appointments/{id}`
- **Body**: `{ "status": "completed" }`
- **Hành động tự động**:
  1. ✅ Tạo giao dịch mới với status `pending_deposit`
  2. ✅ Set `expiredAt` = hiện tại + 24h
  3. ✅ Tính tiền cọc = 10% giá BĐS
  4. ✅ Tạo commission record cho broker (pending)
  5. ✅ Đổi status BĐS sang `in_transaction`
  6. ✅ Gửi thông báo cho khách hàng

**Code**: `AppointmentService.updateAppointment()` → `TransactionService.createTransactionFromCompletedAppointment()`

### 3️⃣ Khách hàng đặt cọc (trong vòng 24h)
- **Endpoint**: `POST /api/transactions/{id}/submit-deposit`
- **Hành động**:
  1. ✅ Tạo `TransactionPayment` với status `submitted`
  2. ✅ Đổi transaction status: `pending_deposit` → `payment_submitted`
  3. ✅ Xóa `expiredAt` (không còn deadline)
  4. ✅ Gửi thông báo cho broker và admin

### 4️⃣ Nếu KHÔNG đặt cọc sau 24h
- **Job tự động**: `TransactionTimeoutJob` (chạy mỗi phút)
- **Hành động**:
  1. ✅ Đổi transaction status → `cancelled`
  2. ✅ Đổi BĐS status: `in_transaction` → `published`
  3. ✅ Unlock BĐS (`isLocked = false`)
  4. ✅ Khách hàng có thể đặt lịch xem lại

---

## 🗂️ Các file đã thay đổi

### Backend

1. **AppointmentService.java**
   - ✅ Thêm `@Autowired TransactionService`
   - ✅ Thêm `@Autowired TransactionRepository`
   - ✅ Logic tự động tạo giao dịch khi status = "completed"
   - ✅ Validation không cho đặt lịch nếu có `pending_deposit` chưa hết hạn

2. **TransactionService.java**
   - ✅ Method mới: `createTransactionFromCompletedAppointment()`
   - ✅ Method mới: `submitDepositPayment()`

3. **TransactionController.java**
   - ✅ Endpoint mới: `POST /api/transactions/{id}/submit-deposit`

4. **TransactionTimeoutJob.java**
   - ✅ Thêm `"pending_deposit"` vào danh sách status cần check timeout

5. **Transaction.java** (Entity)
   - Status mới: `pending_deposit` (chờ đặt cọc)

---

## 📊 Trạng thái giao dịch mới

| Status | Mô tả | Timeout | Ai có thể thao tác |
|--------|-------|---------|-------------------|
| `pending_deposit` | Chờ khách đặt cọc sau khi xem nhà | 24h | Customer: submit deposit |
| `payment_submitted` | Đã nộp cọc, chờ admin xác nhận | Không | Admin: confirm/reject |

---

## 🔔 Thông báo

### Khi broker xác nhận "completed"
```
Tiêu đề: "Lịch xem nhà hoàn tất - Vui lòng đặt cọc"
Nội dung: "Bạn đã xem xong bất động sản '{title}'. 
          Một giao dịch đã được tạo tự động. 
          Vui lòng đặt cọc trong vòng 24 giờ để giữ quyền mua. 
          Nếu không đặt cọc, bạn cần đặt lịch xem nhà lại để mua BĐS này."
```

### Khi khách submit deposit
```
Tiêu đề: "Khách hàng đã đặt cọc"
Nội dung: "Khách hàng {name} đã nộp tiền cọc cho giao dịch {code}. 
          Vui lòng theo dõi."
Gửi đến: Broker + Admin
```

---

## 🧪 Test Cases

### Test 1: Đặt cọc thành công
1. Customer đặt lịch xem nhà
2. Broker xác nhận "completed"
3. Kiểm tra: Transaction được tạo với status `pending_deposit`
4. Customer gọi `POST /api/transactions/{id}/submit-deposit`
5. Kiểm tra: Status → `payment_submitted`, expiredAt = null

### Test 2: Hết hạn 24h
1. Customer đặt lịch xem nhà
2. Broker xác nhận "completed"
3. Đợi 24h (hoặc mock time)
4. Job chạy → Transaction status = `cancelled`
5. Kiểm tra: BĐS status = `published`, có thể đặt lịch lại

### Test 3: Không cho đặt lịch khi có pending_deposit
1. Customer đặt lịch xem nhà
2. Broker xác nhận "completed"
3. Customer thử đặt lịch lại cho cùng BĐS
4. Kiểm tra: API trả về lỗi "Bạn đã xem BĐS này và có giao dịch đang chờ đặt cọc..."

---

## 🚀 API Endpoints mới

### Submit Deposit Payment
```http
POST /api/transactions/{id}/submit-deposit
Authorization: Bearer {customer_token}

Response:
{
  "success": true,
  "message": "Đã nộp tiền cọc thành công, chờ admin xác nhận",
  "data": { ... transaction details ... }
}
```

---

## ⚙️ Cấu hình

### Thời gian timeout
- **Mặc định**: 24 giờ
- **Có thể thay đổi**: Sửa trong `TransactionService.createTransactionFromCompletedAppointment()`
  ```java
  transaction.setExpiredAt(java.time.LocalDateTime.now().plusHours(24));
  ```

### Tỷ lệ cọc
- **Mặc định**: 10% giá BĐS
- **Có thể thay đổi**: Sửa trong `TransactionService`
  ```java
  java.math.BigDecimal depositAmount = property.getPrice().multiply(new java.math.BigDecimal("0.10"));
  ```

---

## 📝 Notes

- ✅ Circular dependency được tránh bằng cách inject `TransactionService` vào `AppointmentService`
- ✅ Job timeout chạy mỗi phút, đủ nhanh để xử lý kịp thời
- ✅ Validation chặt chẽ để tránh race condition
- ✅ Audit log đầy đủ cho mọi thao tác
- ✅ Notification cho tất cả các bên liên quan

---

## 🎨 Frontend cần làm

1. **Hiển thị countdown 24h** trên giao dịch `pending_deposit`
2. **Button "Đặt cọc"** gọi API `POST /api/transactions/{id}/submit-deposit`
3. **Thông báo** khi giao dịch hết hạn
4. **Disable nút đặt lịch** nếu có `pending_deposit` chưa hết hạn (hiển thị lý do)

---

## ✅ Checklist triển khai

- [x] Tạo method `createTransactionFromCompletedAppointment()`
- [x] Tạo method `submitDepositPayment()`
- [x] Thêm logic tự động trong `updateAppointment()`
- [x] Thêm validation trong `createAppointment()`
- [x] Cập nhật `TransactionTimeoutJob`
- [x] Thêm API endpoint mới
- [x] Thêm thông báo
- [ ] Test toàn bộ flow
- [ ] Cập nhật frontend
- [ ] Cập nhật API documentation

---

**Tạo bởi**: Kiro AI Assistant  
**Ngày**: 2026-05-26
