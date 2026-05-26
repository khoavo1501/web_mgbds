-- =====================================================
-- MIGRATION: Thêm hệ thống điểm uy tín
-- Chạy script này sau khi đã có database bds.sql
-- =====================================================

-- 1. Thêm cột reputation_score vào bảng users
ALTER TABLE users ADD COLUMN IF NOT EXISTS reputation_score INT DEFAULT 100;

-- 2. Cập nhật điểm mặc định cho users hiện có (nếu có)
UPDATE users SET reputation_score = 100 WHERE reputation_score IS NULL;

-- 3. Tạo bảng reputation_history để lưu lịch sử thay đổi điểm
CREATE TABLE IF NOT EXISTS reputation_history (
    history_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL,           -- 'cancel_confirmed_within_24h', 'cancel_confirmed_after_24h', 'complete_appointment', 'no_show', 'manual_adjustment'
    points_change INT NOT NULL,                 -- +5, -10, -20, etc.
    previous_score INT NOT NULL,                -- Điểm trước khi thay đổi
    new_score INT NOT NULL,                     -- Điểm sau khi thay đổi
    reason TEXT,                                -- Lý do thay đổi (nếu có)
    appointment_id INT REFERENCES appointments(appointment_id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT REFERENCES users(user_id) ON DELETE SET NULL  -- NULL = tự động, có giá trị = admin điều chỉnh
);

-- 4. Thêm các cột còn thiếu vào bảng properties (nếu chưa có)
ALTER TABLE properties ADD COLUMN IF NOT EXISTS address VARCHAR(500);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS ward VARCHAR(100);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS bedrooms INT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS bathrooms INT;

-- 5. Tạo index để tăng tốc độ truy vấn
CREATE INDEX IF NOT EXISTS idx_reputation_history_user_id ON reputation_history(user_id);
CREATE INDEX IF NOT EXISTS idx_reputation_history_created_at ON reputation_history(created_at);
CREATE INDEX IF NOT EXISTS idx_users_reputation_score ON users(reputation_score);

-- 6. Cập nhật dữ liệu mẫu cho properties (thêm address, ward, bedrooms, bathrooms)
UPDATE properties SET 
    address = '123 Đường Cầu Giấy',
    ward = 'Dịch Vọng',
    bedrooms = 2,
    bathrooms = 2
WHERE property_id = 1;

UPDATE properties SET 
    address = '456 Đường Láng',
    ward = 'Láng Thượng',
    bedrooms = 4,
    bathrooms = 3
WHERE property_id = 2;

UPDATE properties SET 
    address = '789 Đường Hoa Lan',
    ward = 'Việt Hưng',
    bedrooms = 5,
    bathrooms = 4
WHERE property_id = 3;

UPDATE properties SET 
    address = '321 Đường Nguyễn Văn Hưởng',
    ward = 'Thảo Điền',
    bedrooms = 3,
    bathrooms = 2
WHERE property_id = 4;

UPDATE properties SET 
    address = '654 Đường Võ Văn Ngân',
    ward = 'Linh Chiểu',
    bedrooms = 0,
    bathrooms = 0
WHERE property_id = 5;

UPDATE properties SET 
    address = '987 Đường Nguyễn Trãi',
    ward = 'Nhân Chính',
    bedrooms = 0,
    bathrooms = 3
WHERE property_id = 6;

UPDATE properties SET 
    address = '147 Đường Lê Lợi',
    ward = 'Bến Nghé',
    bedrooms = 1,
    bathrooms = 1
WHERE property_id = 7;

UPDATE properties SET 
    address = '258 Đường Bà Triệu',
    ward = 'Phạm Đình Hổ',
    bedrooms = 3,
    bathrooms = 2
WHERE property_id = 8;

-- 7. Thêm dữ liệu mẫu cho reputation_history
INSERT INTO reputation_history (user_id, action_type, points_change, previous_score, new_score, reason, appointment_id, created_at) VALUES
(4, 'complete_appointment', 5, 100, 105, 'Hoàn thành lịch hẹn đúng giờ', 4, CURRENT_TIMESTAMP - INTERVAL '5 days'),
(4, 'complete_appointment', 5, 105, 110, 'Hoàn thành lịch hẹn đúng giờ', NULL, CURRENT_TIMESTAMP - INTERVAL '10 days');

-- Cập nhật điểm hiện tại cho user
UPDATE users SET reputation_score = 110 WHERE user_id = 4;

-- =====================================================
-- KIỂM TRA KẾT QUẢ
-- =====================================================

-- Kiểm tra cột reputation_score đã được thêm
SELECT user_id, email, full_name, role, reputation_score FROM users;

-- Kiểm tra bảng reputation_history
SELECT * FROM reputation_history ORDER BY created_at DESC;

-- Kiểm tra properties đã có đầy đủ thông tin
SELECT property_id, title, address, ward, bedrooms, bathrooms FROM properties;

-- Thống kê điểm uy tín
SELECT 
    CASE 
        WHEN reputation_score >= 80 THEN '🟢 Xuất sắc (80-100)'
        WHEN reputation_score >= 60 THEN '🔵 Tốt (60-79)'
        WHEN reputation_score >= 40 THEN '🟡 Trung bình (40-59)'
        WHEN reputation_score >= 20 THEN '🟠 Thấp (20-39)'
        WHEN reputation_score >= 0 THEN '🔴 Rất thấp (0-19)'
        ELSE '⛔ Vi phạm (< 0)'
    END as level,
    COUNT(*) as count
FROM users
WHERE role = 'customer'
GROUP BY level;
