-- Migration: Thêm thông tin liên hệ vào appointments
-- Tự động chạy khi start backend

ALTER TABLE appointments ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS contact_name VARCHAR(100);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(20);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS contact_email VARCHAR(100);

UPDATE appointments SET status = 'pending' WHERE status = 'scheduled';

UPDATE appointments a
SET 
    contact_name = (SELECT u.full_name FROM users u WHERE u.user_id = a.customer_id),
    contact_phone = (SELECT u.phone FROM users u WHERE u.user_id = a.customer_id),
    contact_email = (SELECT u.email FROM users u WHERE u.user_id = a.customer_id)
WHERE a.contact_name IS NULL;

UPDATE appointments SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL;
