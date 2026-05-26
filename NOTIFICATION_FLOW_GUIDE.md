# Hướng Dẫn Luồng Thông Báo Dời Lịch Hẹn

## Tổng Quan
Khi môi giới dời lịch hẹn, hệ thống tự động gửi thông báo đến khách hàng qua component NotificationDropdown (icon chuông ở header).

## Luồng Hoạt Động Đầy Đủ

### 1. Môi Giới Dời Lịch
```
Môi giới → Trang chi tiết lịch hẹn → Click "Dời lịch" → Nhập ngày giờ mới → Xác nhận
```

### 2. Backend Xử Lý
**File**: `AppointmentService.java`

```java
// Khi môi giới dời lịch
if (isBrokerRescheduling) {
    // Tạo thông báo
    notificationService.createNotification(
        appointment.getCustomer(),           // Gửi đến khách hàng
        "appointment_rescheduled",           // Loại thông báo
        "Lịch hẹn được đề xuất dời",        // Tiêu đề
        notificationMessage,                 // Nội dung
        "customer"                           // Target role
    );
    
    // Đổi trạng thái về pending
    appointment.setStatus("pending");
}
```

### 3. Thông Báo Được Lưu Vào Database
**Table**: `notifications`

| Column | Value |
|--------|-------|
| user_id | ID khách hàng |
| type | "appointment_rescheduled" |
| title | "Lịch hẹn được đề xuất dời" |
| message | "Môi giới [Tên] đã đề xuất dời lịch hẹn xem '[BĐS]' sang [Ngày giờ]. Vui lòng xác nhận lại." |
| target_role | "customer" |
| is_read | false |
| created_at | Timestamp hiện tại |

### 4. Khách Hàng Nhận Thông Báo
**Component**: `NotificationDropdown.jsx`

#### Vị Trí Hiển Thị
```
Header → Icon chuông (Bell) → Badge đỏ với số lượng thông báo chưa đọc
```

#### Khi Click Vào Icon Chuông
```
Dropdown mở ra → Hiển thị danh sách thông báo
```

#### Giao Diện Thông Báo
```
┌─────────────────────────────────────┐
│ Thông báo          [Đánh dấu đã đọc]│
├─────────────────────────────────────┤
│ ⏰ Lịch hẹn được đề xuất dời    ●   │
│    Môi giới Nguyễn Văn A đã đề      │
│    xuất dời lịch hẹn xem 'Nhà       │
│    riêng 4 tầng' sang 27/05/2026... │
│    🕐 27/05/2026 16:52              │
├─────────────────────────────────────┤
│ [Các thông báo khác...]             │
├─────────────────────────────────────┤
│              [Đóng]                 │
└─────────────────────────────────────┘
```

### 5. Khách Hàng Xem Chi Tiết
```
Click vào thông báo → Đánh dấu đã đọc → Đi đến trang lịch hẹn
```

### 6. Khách Hàng Xác Nhận
```
Trang lịch hẹn → Xem lịch hẹn với trạng thái "Chờ xác nhận" → Click "Xác nhận"
```

## Chi Tiết Component

### NotificationDropdown.jsx

#### Features
1. **Icon Chuông với Badge**
   - Badge đỏ hiển thị số thông báo chưa đọc
   - Animation scale khi có thông báo mới
   - Hover effect

2. **Dropdown Menu**
   - Width: 320px (mobile) / 384px (desktop)
   - Max height: 384px với scroll
   - Shadow và border đẹp
   - Animation slideDown

3. **Header**
   - Tiêu đề "Thông báo"
   - Nút "Đánh dấu đã đọc" (nếu có unread)

4. **Notification Items**
   - Icon theo loại thông báo
   - Title (bold nếu chưa đọc)
   - Message (line-clamp-2)
   - Timestamp
   - Dot xanh nếu chưa đọc
   - Background xanh nhạt nếu chưa đọc
   - Hover effect

5. **Footer**
   - Nút "Đóng"

#### Icon Mapping
```javascript
const getIconForType = (type) => {
  switch (type) {
    case 'appointment_rescheduled':
      return <Clock className="w-5 h-5 text-amber-500" />;
    case 'APPOINTMENT_APPROVED':
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    case 'DOCUMENT_REJECTED':
      return <XCircle className="w-5 h-5 text-red-500" />;
    default:
      return <Bell className="w-5 h-5 text-blue-500" />;
  }
};
```

#### API Endpoints
1. **GET /api/notifications**
   - Lấy danh sách thông báo
   - Response: `{ success: true, data: { notifications: [], unreadCount: 0 } }`

2. **PATCH /api/notifications/:id/read**
   - Đánh dấu 1 thông báo đã đọc

3. **PATCH /api/notifications/read-all**
   - Đánh dấu tất cả đã đọc

## Màu Sắc & Icons

### Loại Thông Báo
| Type | Icon | Color | Ý Nghĩa |
|------|------|-------|---------|
| appointment_rescheduled | Clock | Amber (vàng) | Dời lịch |
| APPOINTMENT_APPROVED | CheckCircle | Green | Xác nhận |
| DOCUMENT_REJECTED | XCircle | Red | Từ chối |
| Default | Bell | Blue | Thông báo chung |

### Trạng Thái
| State | Background | Font Weight | Dot |
|-------|-----------|-------------|-----|
| Unread | bg-blue-50/30 | font-semibold | Blue dot |
| Read | bg-white | font-normal | No dot |

## Testing

### Backend Testing
```bash
# 1. Restart backend
cd backend
mvn spring-boot:run

# 2. Test API
curl -X GET http://localhost:8080/api/notifications \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Frontend Testing
1. **Login as Customer**
   - Email: customer@example.com
   - Password: password

2. **Check Notification Icon**
   - Icon chuông ở header
   - Badge đỏ với số thông báo

3. **Click Icon**
   - Dropdown mở ra
   - Hiển thị thông báo dời lịch

4. **Click Notification**
   - Đánh dấu đã đọc
   - Badge giảm số

5. **Click "Đánh dấu đã đọc"**
   - Tất cả thông báo đánh dấu đã đọc
   - Badge biến mất

### Integration Testing
1. **Môi giới dời lịch**
   - Login as broker
   - Dời lịch hẹn
   - Kiểm tra thông báo được tạo

2. **Khách hàng nhận thông báo**
   - Login as customer
   - Kiểm tra badge chuông
   - Click xem thông báo
   - Verify nội dung đúng

3. **Khách hàng xác nhận**
   - Click vào thông báo
   - Đi đến trang lịch hẹn
   - Xác nhận lịch mới

## Troubleshooting

### Không Nhận Được Thông Báo
1. ✅ Kiểm tra backend đã restart chưa
2. ✅ Kiểm tra database có record mới không
3. ✅ Kiểm tra API `/api/notifications` trả về gì
4. ✅ Kiểm tra token còn valid không
5. ✅ Check console log có lỗi không

### Badge Không Hiển Thị
1. ✅ Kiểm tra `unreadCount` từ API
2. ✅ Kiểm tra state `unreadCount` trong component
3. ✅ Refresh trang
4. ✅ Clear cache

### Thông Báo Không Đánh Dấu Đã Đọc
1. ✅ Kiểm tra API endpoint `/notifications/:id/read`
2. ✅ Kiểm tra token authorization
3. ✅ Check network tab trong DevTools
4. ✅ Verify database `is_read` column

## Mở Rộng

### 1. Real-time Notifications
Sử dụng WebSocket hoặc Server-Sent Events:
```javascript
// WebSocket example
const ws = new WebSocket('ws://localhost:8080/notifications');
ws.onmessage = (event) => {
  const notification = JSON.parse(event.data);
  setNotifications(prev => [notification, ...prev]);
  setUnreadCount(prev => prev + 1);
};
```

### 2. Push Notifications
Sử dụng Web Push API:
```javascript
// Request permission
Notification.requestPermission().then(permission => {
  if (permission === 'granted') {
    // Subscribe to push notifications
  }
});
```

### 3. Email Notifications
Backend gửi email khi tạo thông báo:
```java
@Autowired
private EmailService emailService;

// Sau khi tạo notification
emailService.sendEmail(
    customer.getEmail(),
    "Lịch hẹn được đề xuất dời",
    emailTemplate
);
```

### 4. SMS Notifications
Tích hợp SMS gateway:
```java
@Autowired
private SmsService smsService;

// Gửi SMS
smsService.sendSms(
    customer.getPhone(),
    "Môi giới đã dời lịch hẹn. Vui lòng xác nhận."
);
```

## Best Practices

### 1. Performance
- ✅ Pagination cho danh sách thông báo
- ✅ Lazy loading
- ✅ Cache notifications
- ✅ Debounce API calls

### 2. UX
- ✅ Animation mượt mà
- ✅ Loading states
- ✅ Error handling
- ✅ Empty states
- ✅ Responsive design

### 3. Security
- ✅ Validate token
- ✅ Check permissions
- ✅ Sanitize input
- ✅ Rate limiting

### 4. Accessibility
- ✅ Keyboard navigation
- ✅ Screen reader support
- ✅ ARIA labels
- ✅ Focus management

## Summary

### Luồng Đầy Đủ
```
Môi giới dời lịch
    ↓
Backend tạo notification
    ↓
Lưu vào database
    ↓
Khách hàng login
    ↓
Fetch notifications
    ↓
Badge hiển thị số unread
    ↓
Click icon chuông
    ↓
Dropdown hiển thị
    ↓
Click notification
    ↓
Đánh dấu đã đọc
    ↓
Đi đến trang lịch hẹn
    ↓
Xác nhận lịch mới
```

### Files Liên Quan
1. **Backend**
   - `AppointmentService.java` - Tạo notification
   - `NotificationService.java` - Service xử lý
   - `NotificationController.java` - API endpoints
   - `Notification.java` - Entity

2. **Frontend**
   - `NotificationDropdown.jsx` - Component hiển thị
   - `PublicLayout.jsx` - Chứa NotificationDropdown
   - `MyAppointments.jsx` - Trang lịch hẹn

### Kết Luận
Hệ thống thông báo hoạt động hoàn chỉnh:
- ✅ Backend tạo và lưu thông báo
- ✅ Frontend hiển thị real-time
- ✅ Icon chuông với badge
- ✅ Dropdown đẹp với animations
- ✅ Đánh dấu đã đọc
- ✅ Responsive và accessible

Khách hàng sẽ nhận được thông báo ngay khi môi giới dời lịch và có thể xác nhận lại lịch hẹn mới!
