# Tính Năng: Môi Giới Dời Lịch Hẹn - Yêu Cầu Khách Hàng Xác Nhận

## Tổng Quan
Khi môi giới dời lịch hẹn, hệ thống sẽ:
1. ✅ Thay đổi trạng thái lịch hẹn về **"pending"** (chờ xác nhận)
2. 📢 Gửi thông báo đến khách hàng
3. 👤 Yêu cầu khách hàng xác nhận lại lịch hẹn mới

## Luồng Hoạt Động

### 1. Môi Giới Dời Lịch
```
Môi giới → Click "Dời lịch" → Chọn ngày giờ mới → Nhập lý do → Xác nhận
```

### 2. Hệ Thống Xử Lý
- ✅ Kiểm tra khung giờ mới có trống không
- ✅ Kiểm tra khách hàng có lịch trùng không
- ✅ Cập nhật ngày giờ mới
- ✅ **Đổi trạng thái về "pending"**
- ✅ **Gửi thông báo đến khách hàng**
- ✅ Hiển thị thông báo thành công cho môi giới

### 3. Khách Hàng Nhận Thông Báo
```
Khách hàng → Nhận thông báo → Xem chi tiết → Xác nhận hoặc Hủy
```

## Thay Đổi Backend

### File: `AppointmentService.java`

#### 1. Thêm NotificationService
```java
@Autowired
private NotificationService notificationService;
```

#### 2. Cập Nhật Logic Dời Lịch
```java
if (request.getScheduledAt() != null && !request.getScheduledAt().equals(appointment.getScheduledAt())) {
    boolean isBrokerRescheduling = "broker".equalsIgnoreCase(currentUser.getRole());
    
    // ... validations ...
    
    // Nếu môi giới dời lịch, gửi thông báo cho khách hàng
    if (isBrokerRescheduling) {
        String notificationMessage = String.format(
            "Môi giới %s đã đề xuất dời lịch hẹn xem '%s' sang %s. Vui lòng xác nhận lại lịch hẹn mới.",
            appointment.getBroker().getFullName(),
            appointment.getProperty().getTitle(),
            newDateTime
        );
        
        notificationService.createNotification(
            appointment.getCustomer(),
            "appointment_rescheduled",
            "Lịch hẹn được đề xuất dời",
            notificationMessage,
            "customer"
        );
    }
    
    appointment.setScheduledAt(request.getScheduledAt());
    appointment.setStatus("pending"); // Reset to pending - customer needs to confirm
}
```

## Thay Đổi Frontend

### File: `BrokerAppointmentDetail.jsx`

#### Cập Nhật Thông Báo Thành Công
```javascript
if (response.data.success) {
    alert('✅ Đã dời lịch hẹn thành công!\n\n📢 Thông báo đã được gửi đến khách hàng.\n👤 Khách hàng cần xác nhận lại lịch hẹn mới.\n\n⏳ Trạng thái: Chờ xác nhận');
    setShowRescheduleModal(false);
    fetchAppointmentDetail();
}
```

## Trạng Thái Lịch Hẹn

### Trước Khi Dời Lịch
- **confirmed** / **scheduled** / **viewed**

### Sau Khi Môi Giới Dời Lịch
- **pending** (chờ khách hàng xác nhận)

### Sau Khi Khách Hàng Xác Nhận
- **confirmed** (lịch hẹn được xác nhận lại)

## Thông Báo

### Loại Thông Báo
- **Type**: `appointment_rescheduled`
- **Title**: "Lịch hẹn được đề xuất dời"
- **Target Role**: `customer`

### Nội Dung Thông Báo
```
Môi giới [Tên Môi Giới] đã đề xuất dời lịch hẹn xem '[Tên BĐS]' sang [Ngày Giờ Mới]. 
Vui lòng xác nhận lại lịch hẹn mới.
```

### Ví Dụ
```
Môi giới Nguyễn Văn A đã đề xuất dời lịch hẹn xem 'Nhà riêng 4 tầng Đống Đa' sang 2026-05-27T16:52:00. 
Vui lòng xác nhận lại lịch hẹn mới.
```

## Giao Diện Người Dùng

### Môi Giới
1. **Modal Dời Lịch**:
   - Input ngày mới
   - Input giờ mới
   - Textarea lý do (tùy chọn)
   - Nút "Hủy" và "Xác nhận"

2. **Thông Báo Thành Công**:
   ```
   ✅ Đã dời lịch hẹn thành công!
   
   📢 Thông báo đã được gửi đến khách hàng.
   👤 Khách hàng cần xác nhận lại lịch hẹn mới.
   
   ⏳ Trạng thái: Chờ xác nhận
   ```

3. **Trạng thái Card**:
   - Badge chuyển về "Chờ xác nhận" (vàng cam)
   - Hiển thị ngày giờ mới
   - Nút "Xác nhận lịch hẹn" xuất hiện lại

### Khách Hàng
1. **Thông Báo**:
   - Icon chuông có badge đỏ
   - Click vào xem chi tiết thông báo
   - Nội dung: Môi giới đề xuất dời lịch

2. **Trang Lịch Hẹn**:
   - Badge "Chờ xác nhận"
   - Hiển thị ngày giờ mới
   - Nút "Xác nhận" và "Hủy"

3. **Hành Động**:
   - **Xác nhận**: Trạng thái → "confirmed"
   - **Hủy**: Trạng thái → "cancelled"

## Validation

### Khi Môi Giới Dời Lịch
1. ✅ Kiểm tra khung giờ mới có người khác đặt chưa
2. ✅ Kiểm tra khách hàng có lịch trùng giờ ở BĐS khác không
3. ✅ Không trừ điểm uy tín khách hàng (vì môi giới dời)

### Khi Khách Hàng Xác Nhận
1. ✅ Kiểm tra lại khung giờ vẫn còn trống
2. ✅ Cập nhật trạng thái về "confirmed"

## Điểm Uy Tín

### Môi Giới Dời Lịch
- ❌ **KHÔNG** trừ điểm uy tín khách hàng
- ✅ Lý do: Môi giới là người đề xuất dời

### Khách Hàng Dời Lịch
- ✅ **CÓ** trừ điểm uy tín (nếu đã confirmed)
- Pending > 24h: -5 điểm
- Pending < 24h: -10 điểm

## Testing Checklist

### Backend
- [ ] Môi giới dời lịch → Trạng thái chuyển về "pending"
- [ ] Thông báo được tạo và gửi đến khách hàng
- [ ] Validation khung giờ mới hoạt động
- [ ] Không trừ điểm uy tín khách hàng
- [ ] Lưu lý do dời lịch vào note

### Frontend - Môi Giới
- [ ] Modal dời lịch hiển thị đúng
- [ ] Chọn ngày giờ mới hoạt động
- [ ] Thông báo thành công hiển thị đầy đủ thông tin
- [ ] Card cập nhật trạng thái về "Chờ xác nhận"
- [ ] Ngày giờ mới hiển thị đúng

### Frontend - Khách Hàng
- [ ] Nhận được thông báo
- [ ] Thông báo hiển thị đúng nội dung
- [ ] Badge chuông có số đếm
- [ ] Trang lịch hẹn hiển thị trạng thái "Chờ xác nhận"
- [ ] Nút "Xác nhận" và "Hủy" hoạt động

### Integration
- [ ] Môi giới dời → Khách hàng nhận thông báo
- [ ] Khách hàng xác nhận → Trạng thái "confirmed"
- [ ] Khách hàng hủy → Trạng thái "cancelled"
- [ ] Refresh trang cập nhật đúng trạng thái

## Lưu Ý Quan Trọng

### 1. Trạng Thái "Pending"
- Khi môi giới dời lịch, trạng thái **BẮT BUỘC** phải về "pending"
- Khách hàng **PHẢI** xác nhận lại
- Không tự động confirmed

### 2. Thông Báo
- Thông báo được gửi **NGAY LẬP TỨC** khi môi giới dời lịch
- Khách hàng nhận thông báo qua hệ thống notification
- Có thể mở rộng: Email, SMS (tùy chọn)

### 3. Điểm Uy Tín
- Môi giới dời lịch: **KHÔNG** trừ điểm khách hàng
- Khách hàng dời lịch: **CÓ** trừ điểm (nếu đã confirmed)

### 4. Validation
- Luôn kiểm tra khung giờ mới có trống không
- Kiểm tra khách hàng có lịch trùng không
- Hiển thị lỗi rõ ràng nếu không hợp lệ

## Kết Luận
Tính năng này đảm bảo:
- ✅ Môi giới có thể dời lịch linh hoạt
- ✅ Khách hàng được thông báo và xác nhận
- ✅ Không ảnh hưởng điểm uy tín khách hàng
- ✅ Quy trình rõ ràng, minh bạch
- ✅ Trải nghiệm người dùng tốt

## Files Modified
1. `backend/src/main/java/com/realestate/management/service/AppointmentService.java`
2. `frontend/src/pages/broker/BrokerAppointmentDetail.jsx`

## Next Steps
1. ✅ Restart backend để áp dụng thay đổi
2. ✅ Test flow dời lịch từ môi giới
3. ✅ Kiểm tra thông báo đến khách hàng
4. ✅ Test khách hàng xác nhận lại
5. ✅ Verify không trừ điểm uy tín
