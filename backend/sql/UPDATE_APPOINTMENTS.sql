-- =====================================================
-- COPY TOÀN BỘ VÀ PASTE VÀO H2 CONSOLE
-- URL: http://localhost:8080/h2-console
-- =====================================================

-- 1. Thêm cột created_at
ALTER TABLE appointments ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 2. Thêm cột cancellation_reason
ALTER TABLE appointments ADD COLUMN cancellation_reason TEXT;

-- 3. Thêm cột contact_name
ALTER TABLE appointments ADD COLUMN contact_name VARCHAR(100);

-- 4. Thêm cột contact_phone
ALTER TABLE appointments ADD COLUMN contact_phone VARCHAR(20);

-- 5. Thêm cột contact_email
ALTER TABLE appointments ADD COLUMN contact_email VARCHAR(100);

-- 6. Cập nhật status từ 'scheduled' sang 'pending'
UPDATE appointments SET status = 'pending' WHERE status = 'scheduled';

-- 7. Copy thông tin từ users vào contact fields
UPDATE appointments a
SET 
    contact_name = (SELECT u.full_name FROM users u WHERE u.user_id = a.customer_id),
    contact_phone = (SELECT u.phone FROM users u WHERE u.user_id = a.customer_id),
    contact_email = (SELECT u.email FROM users u WHERE u.user_id = a.customer_id)
WHERE a.contact_name IS NULL;

-- 8. Set created_at cho records cũ
UPDATE appointments SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL;

-- DONE! Kiểm tra kết quả:
SELECT * FROM appointments;
