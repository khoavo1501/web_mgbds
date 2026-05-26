# Debug: Lỗi Xác Nhận Lịch Hẹn

## Vấn đề
Khách hàng không thể xác nhận lịch hẹn mới khi môi giới dời lịch. Lỗi: "Bạn không có quyền truy cập tài nguyên này"

## Nguyên nhân có thể
1. **Backend chưa được khởi động lại** sau khi cập nhật code
2. Token đăng nhập hết hạn hoặc không hợp lệ
3. User chưa đăng nhập đúng vai trò (customer)
4. Lỗi logic kiểm tra quyền trong backend

## Giải pháp đã thực hiện

### 1. Thêm logging chi tiết vào Backend
File: `backend/src/main/java/com/realestate/management/service/AppointmentService.java`

Đã thêm log để debug:
- Current User ID, Email, Role
- Appointment Customer ID, Broker ID
- Request Status và ScheduledAt

### 2. Cải thiện error handling ở Frontend
File: `frontend/src/pages/customer/MyAppointments.jsx`

Đã thêm:
- Log chi tiết về token, appointment ID, request body
- Log response status và data
- Thông báo lỗi chi tiết hơn với hướng dẫn kiểm tra

## Các bước để fix

### Bước 1: Khởi động lại Backend (BẮT BUỘC)
```bash
cd backend
mvn spring-boot:run
```

**Lưu ý**: Phải chờ backend khởi động hoàn toàn (thấy dòng "Started Application in X seconds")

### Bước 2: Kiểm tra Frontend
1. Mở trình duyệt và vào trang khách hàng
2. Mở Developer Console (F12)
3. Vào tab Console để xem logs
4. Thử xác nhận lịch hẹn pending

### Bước 3: Phân tích logs

#### Logs ở Frontend Console:
```
Token exists: true/false
Appointment ID: <số>
Request body: { status: 'confirmed' }
Response status: <mã HTTP>
Response data: <dữ liệu trả về>
```

#### Logs ở Backend Terminal:
```
=== UPDATE APPOINTMENT DEBUG ===
Current User ID: <số>
Current User Email: <email>
Current User Role: <vai trò>
Appointment Customer ID: <số>
Appointment Broker ID: <số>
Request Status: confirmed
Request ScheduledAt: null
================================
```

### Bước 4: Xác định vấn đề

#### Nếu "Token exists: false"
→ User chưa đăng nhập, cần đăng nhập lại

#### Nếu "Response status: 401"
→ Token hết hạn, cần đăng nhập lại

#### Nếu "Response status: 403"
→ Không có quyền, kiểm tra:
- User có phải là customer của appointment này không?
- Backend logs có hiển thị đúng User ID không?

#### Nếu "PERMISSION DENIED" trong backend logs
→ Kiểm tra:
- Current User ID có khớp với Appointment Customer ID không?
- Nếu không khớp → User đang đăng nhập sai tài khoản

## Logic hiện tại

### Backend Permission Check
```java
// Chỉ customer, broker của appointment này, hoặc admin mới được update
if (!appointment.getCustomer().getUserId().equals(currentUser.getUserId()) &&
    !appointment.getBroker().getUserId().equals(currentUser.getUserId()) &&
    !"admin".equalsIgnoreCase(currentUser.getRole())) {
    throw new RuntimeException("Không có quyền thay đổi lịch hẹn này");
}
```

### Frontend Confirm Request
```javascript
{
  method: 'PUT',
  url: '/api/appointments/{id}',
  body: { status: 'confirmed' },
  headers: { Authorization: 'Bearer <token>' }
}
```

## Kết quả mong đợi

Sau khi khởi động lại backend và thử lại:
1. Frontend logs hiển thị token exists = true
2. Backend logs hiển thị Current User ID = Appointment Customer ID
3. Response status = 200
4. Response data.success = true
5. Alert hiển thị "✅ Đã xác nhận lịch hẹn thành công!"
6. Appointment status chuyển từ "pending" → "confirmed"
7. Banner cảnh báo biến mất
8. Nút "Xác nhận lịch hẹn mới" biến mất

## Nếu vẫn lỗi

Gửi cho tôi:
1. Screenshot của Frontend Console logs
2. Copy/paste Backend Terminal logs (phần "=== UPDATE APPOINTMENT DEBUG ===")
3. Screenshot của lỗi hiển thị trên UI

Tôi sẽ phân tích và fix tiếp!
