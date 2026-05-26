# ✅ HỆ THỐNG ĐIỂM UY TÍN - HOÀN THÀNH

## 🎯 Tổng quan
Hệ thống điểm uy tín đã được tích hợp đầy đủ vào backend và frontend, tự động trừ/cộng điểm khi hủy/dời/hoàn thành lịch hẹn.

---

## ✅ ĐÃ HOÀN THÀNH

### Backend (100%)

#### 1. Database
- ✅ Bảng `reputation_history` - Lưu lịch sử thay đổi điểm
- ✅ Cột `reputation_score` trong bảng `users` - Điểm hiện tại (mặc định 100)

#### 2. Entity & Repository
- ✅ `ReputationHistory.java` - Entity lịch sử
- ✅ `ReputationHistoryRepository.java` - Repository
- ✅ Cập nhật `User.java` - Thêm field `reputationScore`

#### 3. Service Layer
- ✅ `ReputationService.java` - Logic xử lý điểm
  - `handleCancelAppointment()` - Trừ điểm khi hủy lịch confirmed
  - `handleRescheduleAppointment()` - Trừ điểm khi dời lịch confirmed
  - `handleCompleteAppointment()` - Cộng điểm khi hoàn thành
  - `handleNoShow()` - Trừ điểm khi không đến
  - `canBookAppointment()` - Kiểm tra có thể đặt lịch không
  - `getMyReputationScore()` - Lấy điểm hiện tại
  - `getMyReputationHistory()` - Lấy lịch sử

- ✅ `AppointmentService.java` - Tích hợp ReputationService
  - Kiểm tra điểm trước khi đặt lịch
  - Tự động trừ điểm khi hủy lịch confirmed
  - Tự động trừ điểm khi dời lịch confirmed

#### 4. Controller & API
- ✅ `ReputationController.java`
  - `GET /api/reputation/my-score` - Xem điểm
  - `GET /api/reputation/history` - Xem lịch sử đầy đủ
  - `GET /api/reputation/recent-history` - Xem 10 lịch sử gần nhất

#### 5. DTO
- ✅ `ReputationHistoryDTO.java`
- ✅ `ReputationScoreDTO.java`

---

### Frontend (100%)

#### 1. Context & State Management
- ✅ `ReputationContext.jsx` - Context quản lý điểm uy tín
  - Auto fetch khi user login
  - `refreshScore()` - Refresh điểm sau khi hủy/dời lịch
  - Shared state across components

#### 2. Components
- ✅ `ReputationBadge.jsx` - Badge hiển thị điểm với màu sắc
- ✅ `ReputationScore.jsx` - Component hiển thị điểm chi tiết (chưa dùng)

#### 3. Services
- ✅ `reputationService.js` - API calls

#### 4. Layout & Pages
- ✅ `PublicLayout.jsx` - Hiển thị badge điểm ở header
- ✅ `CancelAppointment.jsx` - Refresh điểm sau khi hủy
- ✅ `RescheduleAppointment.jsx` - Refresh điểm sau khi dời lịch
- ✅ `App.jsx` - Wrap với ReputationProvider

---

## 📊 QUY TẮC TÍNH ĐIỂM

### Điểm ban đầu: **100**

### Hành động tăng điểm:
| Hành động | Điểm | Khi nào |
|-----------|------|---------|
| ✅ Hoàn thành lịch hẹn | **+5** | Broker đánh dấu completed |

### Hành động trừ điểm:
| Hành động | Điểm | Điều kiện |
|-----------|------|-----------|
| ⚠️ Hủy lịch CONFIRMED (>24h) | **-10** | Đã confirmed, còn > 24h |
| 🔴 Hủy lịch CONFIRMED (<24h) | **-20** | Đã confirmed, còn < 24h |
| 🟡 Dời lịch CONFIRMED | **-5** | Đã confirmed, dời sang ngày khác |
| 🚫 Không đến (no-show) | **-30** | Broker báo cáo |
| ✅ Hủy lịch PENDING | **0** | Chưa confirmed, không trừ điểm |
| ✅ Dời lịch PENDING | **0** | Chưa confirmed, không trừ điểm |

---

## 🎨 PHÂN CẤP ĐIỂM & HẠN CHẾ

| Điểm | Cấp độ | Màu | Hạn chế | Có thể đặt lịch |
|------|--------|-----|---------|-----------------|
| **80-100** | 🟢 Xuất sắc | Xanh lá | Không | ✅ Không giới hạn |
| **60-79** | 🔵 Tốt | Xanh dương | Không | ✅ Không giới hạn |
| **40-59** | 🟡 Trung bình | Vàng | Max 2 lịch | ✅ Có |
| **20-39** | 🟠 Thấp | Cam | Max 1 lịch | ✅ Có |
| **0-19** | 🔴 Rất thấp | Đỏ | Khóa 7 ngày | ❌ Không |
| **< 0** | ⛔ Vi phạm | Đen | Khóa vĩnh viễn | ❌ Không |

---

## 🔄 LUỒNG HOẠT ĐỘNG

### 1. Khi đặt lịch mới:
```
User bấm "Đặt lịch xem nhà"
    ↓
AppointmentService.createAppointment()
    ↓
Kiểm tra: reputationService.canBookAppointment()
    ↓
Nếu điểm < 20 → ❌ Không cho đặt
Nếu điểm 20-39 → Kiểm tra số lịch active (max 1)
Nếu điểm 40-59 → Kiểm tra số lịch active (max 2)
Nếu điểm >= 60 → ✅ Cho đặt không giới hạn
    ↓
Tạo lịch hẹn với status = "pending"
```

### 2. Khi hủy lịch:
```
User bấm "Hủy lịch hẹn"
    ↓
AppointmentService.cancelAppointment()
    ↓
Kiểm tra status:
    ├─ PENDING → Không trừ điểm
    └─ CONFIRMED/SCHEDULED/VIEWED:
        ├─ Còn > 24h → Trừ 10 điểm
        └─ Còn < 24h → Trừ 20 điểm
    ↓
reputationService.handleCancelAppointment()
    ├─ Tính điểm mới
    ├─ Cập nhật users.reputation_score
    └─ Lưu vào reputation_history
    ↓
Frontend: refreshScore() → Cập nhật badge ở header
```

### 3. Khi dời lịch:
```
User bấm "Dời lịch"
    ↓
AppointmentService.updateAppointment()
    ↓
Kiểm tra status cũ:
    ├─ PENDING → Không trừ điểm
    └─ CONFIRMED/SCHEDULED/VIEWED → Trừ 5 điểm
    ↓
reputationService.handleRescheduleAppointment()
    ├─ Trừ 5 điểm
    ├─ Cập nhật users.reputation_score
    └─ Lưu vào reputation_history
    ↓
Reset status về "pending" (cần xác nhận lại)
    ↓
Frontend: refreshScore() → Cập nhật badge ở header
```

### 4. Khi hoàn thành lịch:
```
Broker đánh dấu "Hoàn thành"
    ↓
reputationService.handleCompleteAppointment()
    ├─ Cộng 5 điểm
    ├─ Cập nhật users.reputation_score
    └─ Lưu vào reputation_history
```

---

## 🎨 GIAO DIỆN

### Header (Navbar)
```
┌─────────────────────────────────────────────────┐
│  🏢 NhaDatPro    [Menu]    🔔  ┌──────────────┐ │
│                                │ 👤 Trần Thị Mỹ│ │
│                                │ 85 🟢 Xuất sắc│ │
│                                └──────────────┘ │
└─────────────────────────────────────────────────┘
```

- Badge hiển thị bên cạnh tên user
- Màu sắc thay đổi theo điểm
- Chỉ hiển thị cho **customer**
- Tự động cập nhật sau khi hủy/dời lịch

---

## 🚀 CÁCH TEST

### 1. Restart Backend
```bash
cd backend
mvn spring-boot:run
```

### 2. Login với tài khoản customer
```
Email: customer1@example.com
Password: 123456
```

### 3. Test các tình huống:

#### A. Đặt lịch mới
- ✅ Đặt lịch thành công
- ✅ Badge hiển thị điểm ở header

#### B. Hủy lịch PENDING
- ✅ Hủy thành công
- ✅ Điểm KHÔNG thay đổi
- ✅ Badge vẫn giữ nguyên

#### C. Hủy lịch CONFIRMED (>24h)
1. Đặt lịch mới
2. Broker xác nhận (status = confirmed)
3. Customer hủy lịch (còn > 24h)
- ✅ Hủy thành công
- ✅ Điểm trừ 10
- ✅ Badge cập nhật ngay lập tức

#### D. Hủy lịch CONFIRMED (<24h)
1. Đặt lịch vào ngày mai
2. Broker xác nhận
3. Customer hủy lịch (còn < 24h)
- ✅ Hủy thành công
- ✅ Điểm trừ 20
- ✅ Badge cập nhật ngay lập tức
- ✅ Màu badge có thể thay đổi (nếu điểm giảm xuống mức khác)

#### E. Dời lịch CONFIRMED
1. Đặt lịch mới
2. Broker xác nhận
3. Customer dời lịch sang ngày khác
- ✅ Dời thành công
- ✅ Điểm trừ 5
- ✅ Badge cập nhật ngay lập tức
- ✅ Status reset về "pending"

#### F. Kiểm tra giới hạn đặt lịch
1. Hủy nhiều lịch để điểm xuống < 40
2. Thử đặt 3 lịch cùng lúc
- ✅ Chỉ cho đặt tối đa 2 lịch
- ✅ Lịch thứ 3 bị từ chối với thông báo rõ ràng

---

## 📝 DATABASE QUERIES HỮU ÍCH

### Xem điểm của tất cả customer:
```sql
SELECT user_id, full_name, email, reputation_score 
FROM users 
WHERE role = 'customer' 
ORDER BY reputation_score DESC;
```

### Xem lịch sử thay đổi điểm:
```sql
SELECT 
    h.history_id,
    u.full_name,
    h.action_type,
    h.points_change,
    h.previous_score,
    h.new_score,
    h.reason,
    h.created_at
FROM reputation_history h
JOIN users u ON h.user_id = u.user_id
ORDER BY h.created_at DESC
LIMIT 20;
```

### Thống kê phân bố điểm:
```sql
SELECT 
    CASE 
        WHEN reputation_score >= 80 THEN '🟢 Xuất sắc (80-100)'
        WHEN reputation_score >= 60 THEN '🔵 Tốt (60-79)'
        WHEN reputation_score >= 40 THEN '🟡 Trung bình (40-59)'
        WHEN reputation_score >= 20 THEN '🟠 Thấp (20-39)'
        WHEN reputation_score >= 0 THEN '🔴 Rất thấp (0-19)'
        ELSE '⛔ Vi phạm (< 0)'
    END as level,
    COUNT(*) as count,
    AVG(reputation_score) as avg_score
FROM users
WHERE role = 'customer'
GROUP BY level
ORDER BY avg_score DESC;
```

---

## 🐛 TROUBLESHOOTING

### Vấn đề: Badge không hiển thị
- ✅ Kiểm tra user.role === 'customer'
- ✅ Kiểm tra API `/api/reputation/my-score` có trả về data không
- ✅ Kiểm tra console có lỗi không

### Vấn đề: Điểm không cập nhật sau khi hủy lịch
- ✅ Kiểm tra backend có log lỗi không
- ✅ Kiểm tra status của lịch hẹn (phải là confirmed mới trừ điểm)
- ✅ Kiểm tra `refreshScore()` có được gọi không

### Vấn đề: Không thể đặt lịch
- ✅ Kiểm tra điểm hiện tại (< 20 sẽ bị khóa)
- ✅ Kiểm tra số lịch hẹn active hiện tại
- ✅ Xem thông báo lỗi từ backend

---

## 🎉 KẾT LUẬN

Hệ thống điểm uy tín đã được tích hợp hoàn chỉnh:
- ✅ Backend tự động tính điểm
- ✅ Frontend tự động cập nhật badge
- ✅ Validation đầy đủ
- ✅ UI/UX đẹp và chuyên nghiệp
- ✅ Responsive trên mọi thiết bị

Hệ thống sẵn sàng để sử dụng! 🚀
