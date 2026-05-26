# Tổng Hợp: Xác Nhận Lịch Hẹn Đã Dời

## Vấn Đề Hiện Tại
❌ Lỗi: "Bạn không có quyền truy cập tài nguyên này"

## Nguyên Nhân Có Thể

### 1. Token Hết Hạn
- Token JWT đã expire
- Cần login lại

### 2. Role Không Đúng
- API yêu cầu role "customer"
- User hiện tại có role khác

### 3. Appointment Không Thuộc Về User
- Appointment thuộc về customer khác
- Validation trong backend block request

## Cách Debug

### Bước 1: Kiểm Tra Console
```javascript
// Mở DevTools (F12) → Console
// Xem log khi click "Xác nhận lịch hẹn mới"
```

### Bước 2: Kiểm Tra Network Tab
```
1. Mở DevTools (F12) → Network
2. Click "Xác nhận lịch hẹn mới"
3. Tìm request PUT /api/appointments/{id}
4. Xem Response:
   - Status code: 403? 401? 500?
   - Response body: message gì?
```

### Bước 3: Kiểm Tra Token
```javascript
// Trong Console, chạy:
console.log(localStorage.getItem('token'));

// Decode token tại: https://jwt.io
// Kiểm tra:
// - exp (expiration time)
// - role
// - email
```

### Bước 4: Kiểm Tra Backend Log
```bash
# Xem log backend khi request
# Tìm dòng có "Không có quyền"
```

## Solution

### Solution 1: Login Lại
```
1. Logout
2. Login lại với tài khoản customer
3. Thử xác nhận lại
```

### Solution 2: Kiểm Tra Appointment ID
```javascript
// Trong MyAppointments.jsx, thêm log:
console.log('Appointment ID:', appointment.appointmentId);
console.log('Appointment Status:', appointment.status);
console.log('Customer ID:', appointment.customerId);
```

### Solution 3: Sửa Backend Logic
Có thể cần update logic trong `AppointmentService.java`:

```java
// Hiện tại:
if (!appointment.getCustomer().getUserId().equals(currentUser.getUserId()) &&
    !appointment.getBroker().getUserId().equals(currentUser.getUserId()) &&
    !"admin".equalsIgnoreCase(currentUser.getRole())) {
    throw new RuntimeException("Không có quyền thay đổi lịch hẹn này");
}

// Có thể cần thêm log:
System.out.println("Current User ID: " + currentUser.getUserId());
System.out.println("Current User Role: " + currentUser.getRole());
System.out.println("Appointment Customer ID: " + appointment.getCustomer().getUserId());
System.out.println("Appointment Broker ID: " + appointment.getBroker().getUserId());
```

## Code Hiện Tại

### Frontend: MyAppointments.jsx
```javascript
{appointment.status === 'pending' && (
  <button
    onClick={async () => {
      try {
        const response = await fetch(`http://localhost:8080/api/appointments/${appointment.appointmentId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ status: 'confirmed' })
        });
        
        const data = await response.json();
        console.log('Response:', data);
        
        if (response.ok && data.success) {
          alert('✅ Đã xác nhận lịch hẹn thành công!');
          fetchAppointments();
        } else {
          const errorMsg = data.message || 'Không thể xác nhận lịch hẹn';
          console.error('Error:', errorMsg);
          alert('❌ ' + errorMsg);
        }
      } catch (error) {
        console.error('Error confirming appointment:', error);
        alert('❌ Có lỗi xảy ra: ' + error.message);
      }
    }}
  >
    Xác nhận lịch hẹn mới
  </button>
)}
```

### Backend: AppointmentService.java
```java
@Transactional
public AppointmentDTO updateAppointment(Long id, AppointmentRequest request) {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    String email = authentication.getName();
    User currentUser = userRepository.findByEmail(email)
        .orElseThrow(() -> new RuntimeException("User not found"));

    Appointment appointment = appointmentRepository.findById(id)
        .orElseThrow(() -> new RuntimeException("Appointment not found"));

    // Permission check
    if (!appointment.getCustomer().getUserId().equals(currentUser.getUserId()) &&
        !appointment.getBroker().getUserId().equals(currentUser.getUserId()) &&
        !"admin".equalsIgnoreCase(currentUser.getRole())) {
        throw new RuntimeException("Không có quyền thay đổi lịch hẹn này");
    }

    // Update status first (if provided)
    if (request.getStatus() != null) {
        appointment.setStatus(request.getStatus());
    }

    // Update note (if provided)
    if (request.getNote() != null) {
        appointment.setNote(request.getNote());
    }

    // Only run reschedule logic if scheduledAt is actually being changed
    if (request.getScheduledAt() != null && !request.getScheduledAt().equals(appointment.getScheduledAt())) {
        // ... reschedule logic ...
    }

    return convertToDTO(appointmentRepository.save(appointment));
}
```

## Testing Steps

### 1. Verify User
```sql
-- Kiểm tra user trong database
SELECT user_id, email, role FROM users WHERE email = 'customer@example.com';
```

### 2. Verify Appointment
```sql
-- Kiểm tra appointment
SELECT appointment_id, customer_id, broker_id, status, scheduled_at 
FROM appointments 
WHERE appointment_id = [ID];
```

### 3. Verify Token
```javascript
// Decode token
const token = localStorage.getItem('token');
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('Token Payload:', payload);
```

## Expected Flow

### Khi Môi Giới Dời Lịch
```
1. Broker dời lịch
2. Status → "pending"
3. Notification gửi đến customer
4. Customer nhận thông báo
```

### Khi Customer Xác Nhận
```
1. Customer click "Xác nhận lịch hẹn mới"
2. PUT /api/appointments/{id} với body: { status: "confirmed" }
3. Backend check permission:
   - Customer ID match? ✅
   - Broker ID match? ❌ (không cần)
   - Admin? ❌ (không cần)
4. Update status → "confirmed"
5. Return success
6. Frontend refresh list
7. Banner biến mất
8. Badge chuyển sang "Đã xác nhận"
```

## Troubleshooting Checklist

- [ ] Backend đã restart chưa?
- [ ] Token còn valid không?
- [ ] User đang login là customer không?
- [ ] Appointment ID đúng không?
- [ ] Appointment thuộc về customer này không?
- [ ] Console có log gì?
- [ ] Network tab có request nào?
- [ ] Backend log có error gì?

## Quick Fix

Nếu vẫn lỗi, thử cách này:

### Tạm thời bỏ permission check (CHỈ ĐỂ TEST)
```java
// Comment out permission check
// if (!appointment.getCustomer().getUserId().equals(currentUser.getUserId()) &&
//     !appointment.getBroker().getUserId().equals(currentUser.getUserId()) &&
//     !"admin".equalsIgnoreCase(currentUser.getRole())) {
//     throw new RuntimeException("Không có quyền thay đổi lịch hẹn này");
// }
```

Nếu sau khi comment out mà vẫn work → Vấn đề là permission check
Nếu vẫn lỗi → Vấn đề ở chỗ khác

## Next Steps

1. **Kiểm tra Console & Network** → Xem lỗi cụ thể
2. **Gửi screenshot** của:
   - Console log
   - Network request/response
   - Backend log
3. **Verify data**:
   - User ID
   - Appointment ID
   - Token payload

Sau khi có thông tin này, tôi sẽ fix chính xác vấn đề!
