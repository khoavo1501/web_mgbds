-- ===================================================================
-- Sample Data cho Testing
-- Hệ thống Quản lý Trung tâm Môi giới Bất động sản
-- ===================================================================

-- Lưu ý: Chạy script này sau khi Spring Boot đã tạo các bảng

-- ===================================================================
-- 1. Insert Users (Password: 123456 - đã mã hóa bằng BCrypt)
-- ===================================================================
-- BCrypt hash của "123456": $2a$10$3OMk3UmqnZTSCpS5wCaC2e6/Fgr.Yelj6YpPMukXX7kUf1h9u/uou

INSERT INTO users (email, password_hash, role, full_name, phone, is_active, created_at) VALUES
('admin@example.com', '$2a$10$3OMk3UmqnZTSCpS5wCaC2e6/Fgr.Yelj6YpPMukXX7kUf1h9u/uou', 'admin', 'Admin User', '0123456789', true, CURRENT_TIMESTAMP),
('broker1@example.com', '$2a$10$3OMk3UmqnZTSCpS5wCaC2e6/Fgr.Yelj6YpPMukXX7kUf1h9u/uou', 'broker', 'Nguyễn Văn A', '0987654321', true, CURRENT_TIMESTAMP),
('broker2@example.com', '$2a$10$3OMk3UmqnZTSCpS5wCaC2e6/Fgr.Yelj6YpPMukXX7kUf1h9u/uou', 'broker', 'Trần Thị B', '0912345678', true, CURRENT_TIMESTAMP),
('customer1@example.com', '$2a$10$3OMk3UmqnZTSCpS5wCaC2e6/Fgr.Yelj6YpPMukXX7kUf1h9u/uou', 'customer', 'Lê Văn C', '0909123456', true, CURRENT_TIMESTAMP),
('customer2@example.com', '$2a$10$3OMk3UmqnZTSCpS5wCaC2e6/Fgr.Yelj6YpPMukXX7kUf1h9u/uou', 'customer', 'Phạm Thị D', '0908765432', true, CURRENT_TIMESTAMP);

-- ===================================================================
-- 2. Insert Categories
-- ===================================================================

-- Property Types
INSERT INTO categories (category_type, category_name, parent_id) VALUES
('property_type', 'Căn hộ', NULL),
('property_type', 'Nhà riêng', NULL),
('property_type', 'Đất nền', NULL),
('property_type', 'Biệt thự', NULL),
('property_type', 'Shophouse', NULL);

-- Provinces
INSERT INTO categories (category_type, category_name, parent_id) VALUES
('province', 'Hà Nội', NULL),
('province', 'Hồ Chí Minh', NULL),
('province', 'Đà Nẵng', NULL),
('province', 'Hải Phòng', NULL),
('province', 'Cần Thơ', NULL);

-- Districts of Hà Nội (parent_id = 6)
INSERT INTO categories (category_type, category_name, parent_id) VALUES
('district', 'Cầu Giấy', 6),
('district', 'Đống Đa', 6),
('district', 'Hai Bà Trưng', 6),
('district', 'Hoàn Kiếm', 6),
('district', 'Thanh Xuân', 6);

-- Districts of Hồ Chí Minh (parent_id = 7)
INSERT INTO categories (category_type, category_name, parent_id) VALUES
('district', 'Quận 1', 7),
('district', 'Quận 2', 7),
('district', 'Quận 3', 7),
('district', 'Quận 7', 7),
('district', 'Thủ Đức', 7);

-- ===================================================================
-- 3. Insert Properties
-- ===================================================================

INSERT INTO properties (property_code, title, description, property_type, status, province, district, area, price, created_by, assigned_to, created_at) VALUES
('BDS-2024-0001', 'Căn hộ cao cấp 2PN tại Cầu Giấy', 'Căn hộ đẹp, view đẹp, nội thất đầy đủ, gần trường học, siêu thị', 'apartment', 'published', 'Hà Nội', 'Cầu Giấy', 75.5, 3500000000, 1, 2, CURRENT_TIMESTAMP),
('BDS-2024-0002', 'Nhà riêng 4 tầng Đống Đa', 'Nhà đẹp, ô tô đỗ cửa, kinh doanh tốt', 'house', 'published', 'Hà Nội', 'Đống Đa', 120.0, 8500000000, 1, 2, CURRENT_TIMESTAMP),
('BDS-2024-0003', 'Biệt thự Vinhomes Riverside', 'Biệt thự sang trọng, view sông, có hồ bơi riêng', 'villa', 'published', 'Hà Nội', 'Cầu Giấy', 250.0, 25000000000, 2, 2, CURRENT_TIMESTAMP),
('BDS-2024-0004', 'Căn hộ 3PN Quận 2', 'Căn hộ rộng rãi, view thành phố, nội thất cao cấp', 'apartment', 'published', 'Hồ Chí Minh', 'Quận 2', 95.0, 5500000000, 2, 3, CURRENT_TIMESTAMP),
('BDS-2024-0005', 'Đất nền KDC Thủ Đức', 'Đất nền đẹp, vị trí đắc địa, sổ hồng riêng', 'land', 'published', 'Hồ Chí Minh', 'Thủ Đức', 100.0, 4000000000, 1, 3, CURRENT_TIMESTAMP),
('BDS-2024-0006', 'Shophouse Thanh Xuân', 'Shophouse 5 tầng, mặt tiền rộng, kinh doanh sầm uất', 'shophouse', 'published', 'Hà Nội', 'Thanh Xuân', 80.0, 12000000000, 1, 2, CURRENT_TIMESTAMP),
('BDS-2024-0007', 'Căn hộ Studio Quận 1', 'Căn hộ mini, full nội thất, giá tốt cho sinh viên', 'apartment', 'published', 'Hồ Chí Minh', 'Quận 1', 35.0, 2000000000, 2, 3, CURRENT_TIMESTAMP),
('BDS-2024-0008', 'Nhà phố Hai Bà Trưng', 'Nhà đẹp, hẻm xe hơi, gần chợ, trường học', 'house', 'pending', 'Hà Nội', 'Hai Bà Trưng', 90.0, 7000000000, 1, 2, CURRENT_TIMESTAMP);

-- ===================================================================
-- 4. Insert Property Images
-- ===================================================================

-- Images cho BDS-2024-0001
INSERT INTO property_images (property_id, url, is_primary) VALUES
(1, 'https://picsum.photos/800/600?random=1', true),
(1, 'https://picsum.photos/800/600?random=2', false),
(1, 'https://picsum.photos/800/600?random=3', false);

-- Images cho BDS-2024-0002
INSERT INTO property_images (property_id, url, is_primary) VALUES
(2, 'https://picsum.photos/800/600?random=4', true),
(2, 'https://picsum.photos/800/600?random=5', false);

-- Images cho BDS-2024-0003
INSERT INTO property_images (property_id, url, is_primary) VALUES
(3, 'https://picsum.photos/800/600?random=6', true),
(3, 'https://picsum.photos/800/600?random=7', false),
(3, 'https://picsum.photos/800/600?random=8', false),
(3, 'https://picsum.photos/800/600?random=9', false);

-- Images cho BDS-2024-0004
INSERT INTO property_images (property_id, url, is_primary) VALUES
(4, 'https://picsum.photos/800/600?random=10', true),
(4, 'https://picsum.photos/800/600?random=11', false);

-- Images cho BDS-2024-0005
INSERT INTO property_images (property_id, url, is_primary) VALUES
(5, 'https://picsum.photos/800/600?random=12', true);

-- Images cho BDS-2024-0006
INSERT INTO property_images (property_id, url, is_primary) VALUES
(6, 'https://picsum.photos/800/600?random=13', true),
(6, 'https://picsum.photos/800/600?random=14', false);

-- Images cho BDS-2024-0007
INSERT INTO property_images (property_id, url, is_primary) VALUES
(7, 'https://picsum.photos/800/600?random=15', true);

-- Images cho BDS-2024-0008
INSERT INTO property_images (property_id, url, is_primary) VALUES
(8, 'https://picsum.photos/800/600?random=16', true),
(8, 'https://picsum.photos/800/600?random=17', false);

-- ===================================================================
-- 5. Insert Customers (Extended profile)
-- ===================================================================

INSERT INTO customers (user_id, customer_type, address, budget_max) VALUES
(4, 'buyer', '123 Đường ABC, Quận 1, TP.HCM', 5000000000),
(5, 'buyer', '456 Đường XYZ, Cầu Giấy, Hà Nội', 8000000000);

-- ===================================================================
-- 6. Insert Leads (Khách hàng tiềm năng)
-- ===================================================================

INSERT INTO leads (customer_name, customer_phone, property_id, assigned_to, status, created_at) VALUES
('Nguyễn Văn E', '0901234567', 1, 2, 'new', CURRENT_TIMESTAMP),
('Trần Thị F', '0902345678', 2, 2, 'contacted', CURRENT_TIMESTAMP),
('Lê Văn G', '0903456789', 3, 2, 'new', CURRENT_TIMESTAMP),
('Phạm Thị H', '0904567890', 4, 3, 'contacted', CURRENT_TIMESTAMP);

-- ===================================================================
-- 7. Insert Appointments (Lịch hẹn)
-- ===================================================================

INSERT INTO appointments (property_id, customer_id, broker_id, scheduled_at, status, note) VALUES
(1, 4, 2, CURRENT_TIMESTAMP + INTERVAL '2 days', 'scheduled', 'Khách muốn xem vào buổi sáng'),
(2, 5, 2, CURRENT_TIMESTAMP + INTERVAL '3 days', 'scheduled', 'Khách quan tâm đến vị trí'),
(4, 4, 3, CURRENT_TIMESTAMP + INTERVAL '1 day', 'scheduled', 'Khách muốn xem nội thất');

-- ===================================================================
-- 8. Insert Notifications
-- ===================================================================

INSERT INTO notifications (user_id, title, content, is_read, created_at) VALUES
(2, 'Lịch hẹn mới', 'Bạn có lịch hẹn mới với khách hàng Lê Văn C', false, CURRENT_TIMESTAMP),
(2, 'BDS mới được gán', 'Bạn được gán phụ trách BDS BDS-2024-0001', true, CURRENT_TIMESTAMP),
(4, 'Lịch hẹn được xác nhận', 'Lịch hẹn xem BDS BDS-2024-0001 đã được xác nhận', false, CURRENT_TIMESTAMP);

-- ===================================================================
-- Kết thúc
-- ===================================================================

-- Kiểm tra dữ liệu
SELECT 'Users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'Categories', COUNT(*) FROM categories
UNION ALL
SELECT 'Properties', COUNT(*) FROM properties
UNION ALL
SELECT 'Property Images', COUNT(*) FROM property_images
UNION ALL
SELECT 'Customers', COUNT(*) FROM customers
UNION ALL
SELECT 'Leads', COUNT(*) FROM leads
UNION ALL
SELECT 'Appointments', COUNT(*) FROM appointments
UNION ALL
SELECT 'Notifications', COUNT(*) FROM notifications;
