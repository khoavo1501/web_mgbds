-- =====================================================
-- DATABASE HOÀN CHỈNH - HỆ THỐNG QUẢN LÝ MÔI GIỚI BĐS
-- Tổng hợp từ cả 2 phiên bản (cũ + mới)
-- Chạy toàn bộ file này vào H2 Console: http://localhost:8080/h2-console
-- =====================================================


-- =====================================================
-- PHẦN 1: TẠO CÁC BẢNG
-- =====================================================

-- 1. Users
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,                      -- 'admin', 'broker', 'customer'
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Categories
CREATE TABLE categories (
    category_id SERIAL PRIMARY KEY,
    category_type VARCHAR(50) NOT NULL,             -- 'property_type', 'province', 'district'
    category_name VARCHAR(255) NOT NULL,
    parent_id INT REFERENCES categories(category_id)
);

-- 3. Properties
CREATE TABLE properties (
    property_id SERIAL PRIMARY KEY,
    property_code VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    property_type VARCHAR(50) NOT NULL,
    status VARCHAR(30) DEFAULT 'pending',           -- 'pending', 'published', 'in_transaction', 'sold'
    province VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    area NUMERIC(10, 2) NOT NULL,
    price NUMERIC(18, 2) NOT NULL,
    created_by INT REFERENCES users(user_id),
    assigned_to INT REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Thêm từ upgrade_v1 (phiên bản mới)
    is_locked BOOLEAN DEFAULT false,
    source_type VARCHAR(50) DEFAULT 'self_exploited',
    is_exclusive BOOLEAN DEFAULT false,
    exclusive_expired_at TIMESTAMP
);

-- 4. Property Images
CREATE TABLE property_images (
    image_id SERIAL PRIMARY KEY,
    property_id INT NOT NULL REFERENCES properties(property_id) ON DELETE CASCADE,
    url VARCHAR(500) NOT NULL,
    is_primary BOOLEAN DEFAULT false
);

-- 5. Property Documents (phiên bản mới)
CREATE TABLE property_documents (
    document_id SERIAL PRIMARY KEY,
    property_id INT NOT NULL REFERENCES properties(property_id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    status VARCHAR(30) DEFAULT 'pending_review',
    reject_reason TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    uploaded_by INT REFERENCES users(user_id)
);

-- 6. Customers
CREATE TABLE customers (
    customer_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL UNIQUE REFERENCES users(user_id),
    customer_type VARCHAR(20),                      -- 'buyer', 'seller'
    address VARCHAR(500),
    budget_max NUMERIC(18, 2)
);

-- 7. Leads
CREATE TABLE leads (
    lead_id SERIAL PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    property_id INT REFERENCES properties(property_id),
    assigned_to INT REFERENCES users(user_id),
    status VARCHAR(30) DEFAULT 'new',               -- 'new', 'contacted'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Transactions
CREATE TABLE transactions (
    transaction_id SERIAL PRIMARY KEY,
    transaction_code VARCHAR(50) UNIQUE NOT NULL,
    property_id INT NOT NULL REFERENCES properties(property_id),
    customer_id INT NOT NULL REFERENCES users(user_id),
    broker_id INT NOT NULL REFERENCES users(user_id),
    appointment_id INT,                             -- FK soft (tránh circular dep với appointments)
    total_price NUMERIC(18, 2) NOT NULL,
    deposit_amount NUMERIC(18, 2) DEFAULT 0,
    status VARCHAR(30) DEFAULT 'pending',           -- 'pending', 'customer_confirmed', 'documents_submitted',
                                                    -- 'documents_verified', 'payment_submitted', 'deposit_confirmed',
                                                    -- 'commitment_signed', 'deal_scheduled', 'broker_confirmed',
                                                    -- 'refund_requested', 'refunded', 'completed', 'cancelled'
    transaction_date DATE DEFAULT CURRENT_DATE,
    deal_schedule_at TIMESTAMP,
    expired_at TIMESTAMP                            -- Thêm từ upgrade_v1
);

-- 9. Transaction Payments
CREATE TABLE transaction_payments (
    payment_id SERIAL PRIMARY KEY,
    transaction_id INT NOT NULL REFERENCES transactions(transaction_id),
    amount NUMERIC(18, 2) NOT NULL,
    payment_method VARCHAR(30),                     -- 'cash', 'transfer'
    payment_status VARCHAR(30) DEFAULT 'pending',   -- 'pending', 'submitted', 'confirmed', 'refund_requested', 'refunded'
    payment_date DATE DEFAULT CURRENT_DATE,
    confirmed_by INT REFERENCES users(user_id)
);

-- 10. Transaction Documents (phiên bản mới)
CREATE TABLE transaction_documents (
    document_id SERIAL PRIMARY KEY,
    transaction_id INT NOT NULL REFERENCES transactions(transaction_id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    status VARCHAR(30) DEFAULT 'pending_review',
    reject_reason TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    uploaded_by INT REFERENCES users(user_id)
);

-- 11. Contracts
CREATE TABLE contracts (
    contract_id SERIAL PRIMARY KEY,
    transaction_id INT NOT NULL REFERENCES transactions(transaction_id),
    contract_type VARCHAR(30),                      -- 'deposit', 'sale'
    price NUMERIC(18, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. Appointments (Lịch hẹn) — tổng hợp đầy đủ cả 2 phiên bản
CREATE TABLE appointments (
    appointment_id SERIAL PRIMARY KEY,
    property_id INT NOT NULL REFERENCES properties(property_id),
    customer_id INT NOT NULL REFERENCES users(user_id),
    broker_id INT NOT NULL REFERENCES users(user_id),
    scheduled_at TIMESTAMP NOT NULL,
    status VARCHAR(30) DEFAULT 'pending',           -- 'pending', 'confirmed', 'completed', 'cancelled', 'rejected'
    note TEXT,
    -- Thêm từ UPDATE_APPOINTMENTS (phiên bản cũ)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cancellation_reason TEXT,
    contact_name VARCHAR(100),
    contact_phone VARCHAR(20),
    contact_email VARCHAR(100)
);

-- 13. Commissions
CREATE TABLE commissions (
    commission_id SERIAL PRIMARY KEY,
    transaction_id INT NOT NULL REFERENCES transactions(transaction_id),
    user_id INT NOT NULL REFERENCES users(user_id),
    amount NUMERIC(18, 2) NOT NULL,
    status VARCHAR(30) DEFAULT 'pending'            -- 'pending', 'paid'
);

-- 14. Notifications
CREATE TABLE notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id),
    title VARCHAR(255) NOT NULL,
    content TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 15. Audit Log
CREATE TABLE audit_log (
    audit_id SERIAL PRIMARY KEY,
    action_type VARCHAR(50),                        -- 'UPDATE_PROPERTY', 'CREATE_TRANSACTION', ...
    user_id INT REFERENCES users(user_id),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 16. Sessions
CREATE TABLE sessions (
    session_id VARCHAR(255) PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =====================================================
-- PHẦN 2: DỮ LIỆU MẪU (SAMPLE DATA)
-- Password mặc định tất cả tài khoản: 123456
-- BCrypt hash: $2a$10$y2eKNgXjR.QNbmgp7vUmI./9SUwMZ79iN/CN/v4MxMUn5rgpBbENa
-- =====================================================

-- 1. Users
INSERT INTO users (email, password_hash, role, full_name, phone, is_active, created_at) VALUES
('admin@example.com',     '$2a$10$y2eKNgXjR.QNbmgp7vUmI./9SUwMZ79iN/CN/v4MxMUn5rgpBbENa', 'admin',    'Admin User',    '0123456789', true, CURRENT_TIMESTAMP),
('broker1@example.com',   '$2a$10$y2eKNgXjR.QNbmgp7vUmI./9SUwMZ79iN/CN/v4MxMUn5rgpBbENa', 'broker',   'Nguyễn Văn A',  '0987654321', true, CURRENT_TIMESTAMP),
('broker2@example.com',   '$2a$10$y2eKNgXjR.QNbmgp7vUmI./9SUwMZ79iN/CN/v4MxMUn5rgpBbENa', 'broker',   'Trần Thị B',    '0912345678', true, CURRENT_TIMESTAMP),
('customer1@example.com', '$2a$10$y2eKNgXjR.QNbmgp7vUmI./9SUwMZ79iN/CN/v4MxMUn5rgpBbENa', 'customer', 'Lê Văn C',      '0909123456', true, CURRENT_TIMESTAMP),
('customer2@example.com', '$2a$10$y2eKNgXjR.QNbmgp7vUmI./9SUwMZ79iN/CN/v4MxMUn5rgpBbENa', 'customer', 'Phạm Thị D',    '0908765432', true, CURRENT_TIMESTAMP);

-- 2. Categories — Loại BDS
INSERT INTO categories (category_type, category_name, parent_id) VALUES
('property_type', 'Căn hộ',   NULL),
('property_type', 'Nhà riêng', NULL),
('property_type', 'Đất nền',   NULL),
('property_type', 'Biệt thự',  NULL),
('property_type', 'Shophouse', NULL);

-- Categories — Tỉnh thành
INSERT INTO categories (category_type, category_name, parent_id) VALUES
('province', 'Hà Nội',      NULL),
('province', 'Hồ Chí Minh', NULL),
('province', 'Đà Nẵng',     NULL),
('province', 'Hải Phòng',   NULL),
('province', 'Cần Thơ',     NULL);

-- Categories — Quận/Huyện Hà Nội (parent_id = 6)
INSERT INTO categories (category_type, category_name, parent_id) VALUES
('district', 'Cầu Giấy',      6),
('district', 'Đống Đa',       6),
('district', 'Hai Bà Trưng',  6),
('district', 'Hoàn Kiếm',     6),
('district', 'Thanh Xuân',    6);

-- Categories — Quận/Huyện Hồ Chí Minh (parent_id = 7)
INSERT INTO categories (category_type, category_name, parent_id) VALUES
('district', 'Quận 1',  7),
('district', 'Quận 2',  7),
('district', 'Quận 3',  7),
('district', 'Quận 7',  7),
('district', 'Thủ Đức', 7);

-- 3. Properties
INSERT INTO properties (property_code, title, description, property_type, status, province, district, area, price, created_by, assigned_to, created_at) VALUES
('BDS-2024-0001', 'Căn hộ cao cấp 2PN tại Cầu Giấy',  'Căn hộ đẹp, view đẹp, nội thất đầy đủ, gần trường học, siêu thị', 'apartment', 'in_transaction', 'Hà Nội',      'Cầu Giấy',     75.5,  3500000000,  1, 2, CURRENT_TIMESTAMP),
('BDS-2024-0002', 'Nhà riêng 4 tầng Đống Đa',          'Nhà đẹp, ô tô đỗ cửa, kinh doanh tốt',                            'house',     'published',     'Hà Nội',      'Đống Đa',     120.0,  8500000000,  1, 2, CURRENT_TIMESTAMP),
('BDS-2024-0003', 'Biệt thự Vinhomes Riverside',        'Biệt thự sang trọng, view sông, có hồ bơi riêng',                 'villa',     'published',     'Hà Nội',      'Cầu Giấy',   250.0, 25000000000,  2, 2, CURRENT_TIMESTAMP),
('BDS-2024-0004', 'Căn hộ 3PN Quận 2',                  'Căn hộ rộng rãi, view thành phố, nội thất cao cấp',               'apartment', 'published',     'Hồ Chí Minh', 'Quận 2',      95.0,  5500000000,  2, 3, CURRENT_TIMESTAMP),
('BDS-2024-0005', 'Đất nền KDC Thủ Đức',                'Đất nền đẹp, vị trí đắc địa, sổ hồng riêng',                     'land',      'published',     'Hồ Chí Minh', 'Thủ Đức',    100.0,  4000000000,  1, 3, CURRENT_TIMESTAMP),
('BDS-2024-0006', 'Shophouse Thanh Xuân',                'Shophouse 5 tầng, mặt tiền rộng, kinh doanh sầm uất',            'shophouse', 'published',     'Hà Nội',      'Thanh Xuân',  80.0, 12000000000,  1, 2, CURRENT_TIMESTAMP),
('BDS-2024-0007', 'Căn hộ Studio Quận 1',                'Căn hộ mini, full nội thất, giá tốt cho sinh viên',              'apartment', 'published',     'Hồ Chí Minh', 'Quận 1',      35.0,  2000000000,  2, 3, CURRENT_TIMESTAMP),
('BDS-2024-0008', 'Nhà phố Hai Bà Trưng',               'Nhà đẹp, hẻm xe hơi, gần chợ, trường học',                       'house',     'pending',       'Hà Nội',      'Hai Bà Trưng', 90.0, 7000000000,  1, 2, CURRENT_TIMESTAMP);

-- 4. Property Images
INSERT INTO property_images (property_id, url, is_primary) VALUES
(1, 'https://picsum.photos/800/600?random=1',  true),
(1, 'https://picsum.photos/800/600?random=2',  false),
(1, 'https://picsum.photos/800/600?random=3',  false),
(2, 'https://picsum.photos/800/600?random=4',  true),
(2, 'https://picsum.photos/800/600?random=5',  false),
(3, 'https://picsum.photos/800/600?random=6',  true),
(3, 'https://picsum.photos/800/600?random=7',  false),
(3, 'https://picsum.photos/800/600?random=8',  false),
(3, 'https://picsum.photos/800/600?random=9',  false),
(4, 'https://picsum.photos/800/600?random=10', true),
(4, 'https://picsum.photos/800/600?random=11', false),
(5, 'https://picsum.photos/800/600?random=12', true),
(6, 'https://picsum.photos/800/600?random=13', true),
(6, 'https://picsum.photos/800/600?random=14', false),
(7, 'https://picsum.photos/800/600?random=15', true),
(8, 'https://picsum.photos/800/600?random=16', true),
(8, 'https://picsum.photos/800/600?random=17', false);

-- 5. Customers
INSERT INTO customers (user_id, customer_type, address, budget_max) VALUES
(4, 'buyer', '123 Đường ABC, Quận 1, TP.HCM',       5000000000),
(5, 'buyer', '456 Đường XYZ, Cầu Giấy, Hà Nội',    8000000000);

-- 6. Leads
INSERT INTO leads (customer_name, customer_phone, property_id, assigned_to, status, created_at) VALUES
('Nguyễn Văn E', '0901234567', 1, 2, 'new',       CURRENT_TIMESTAMP),
('Trần Thị F',   '0902345678', 2, 2, 'contacted',  CURRENT_TIMESTAMP),
('Lê Văn G',     '0903456789', 3, 2, 'new',        CURRENT_TIMESTAMP),
('Phạm Thị H',   '0904567890', 4, 3, 'contacted',  CURRENT_TIMESTAMP);

-- 7. Appointments — status 'pending' (đúng với frontend mới)
INSERT INTO appointments (property_id, customer_id, broker_id, scheduled_at, status, note, contact_name, contact_phone, contact_email, created_at) VALUES
(1, 4, 2, CURRENT_TIMESTAMP + INTERVAL '2 days', 'pending',   'Khách muốn xem vào buổi sáng',       'Lê Văn C',   '0909123456', 'customer1@example.com', CURRENT_TIMESTAMP),
(2, 5, 2, CURRENT_TIMESTAMP + INTERVAL '3 days', 'pending',   'Khách quan tâm đến vị trí',           'Phạm Thị D', '0908765432', 'customer2@example.com', CURRENT_TIMESTAMP),
(4, 4, 3, CURRENT_TIMESTAMP + INTERVAL '1 day',  'confirmed', 'Khách muốn xem nội thất',             'Lê Văn C',   '0909123456', 'customer1@example.com', CURRENT_TIMESTAMP),
(1, 4, 2, CURRENT_TIMESTAMP - INTERVAL '5 days', 'completed', 'Môi giới đã dẫn khách đi xem nhà',   'Lê Văn C',   '0909123456', 'customer1@example.com', CURRENT_TIMESTAMP - INTERVAL '5 days');

-- 8. Transactions
INSERT INTO transactions (transaction_code, property_id, customer_id, broker_id, total_price, deposit_amount, status, transaction_date) VALUES
('GD2024-001', 1, 4, 2, 3500000000, 350000000, 'pending', CURRENT_DATE);

INSERT INTO transaction_payments (transaction_id, amount, payment_method, payment_status, payment_date, confirmed_by) VALUES
(1, 350000000, 'transfer', 'pending', CURRENT_DATE, NULL);

INSERT INTO commissions (transaction_id, user_id, amount, status) VALUES
(1, 2, 42000000, 'pending');

-- 9. Notifications
INSERT INTO notifications (user_id, title, content, is_read, created_at) VALUES
(2, 'Lịch hẹn mới',          'Bạn có lịch hẹn mới với khách hàng Lê Văn C',           false, CURRENT_TIMESTAMP),
(2, 'BDS mới được gán',       'Bạn được gán phụ trách BDS BDS-2024-0001',               true,  CURRENT_TIMESTAMP),
(4, 'Lịch hẹn được xác nhận','Lịch hẹn xem BDS BDS-2024-0004 đã được xác nhận',        false, CURRENT_TIMESTAMP),
(4, 'Lịch hẹn hoàn thành',   'Lịch hẹn xem BDS BDS-2024-0001 đã hoàn thành',           true,  CURRENT_TIMESTAMP - INTERVAL '5 days');


-- =====================================================
-- PHẦN 3: KIỂM TRA DỮ LIỆU
-- =====================================================

SELECT 'users'                AS bang, COUNT(*) AS so_luong FROM users
UNION ALL
SELECT 'categories',                   COUNT(*) FROM categories
UNION ALL
SELECT 'properties',                   COUNT(*) FROM properties
UNION ALL
SELECT 'property_images',              COUNT(*) FROM property_images
UNION ALL
SELECT 'property_documents',           COUNT(*) FROM property_documents
UNION ALL
SELECT 'customers',                    COUNT(*) FROM customers
UNION ALL
SELECT 'leads',                        COUNT(*) FROM leads
UNION ALL
SELECT 'appointments',                 COUNT(*) FROM appointments
UNION ALL
SELECT 'transactions',                 COUNT(*) FROM transactions
UNION ALL
SELECT 'transaction_payments',         COUNT(*) FROM transaction_payments
UNION ALL
SELECT 'transaction_documents',        COUNT(*) FROM transaction_documents
UNION ALL
SELECT 'commissions',                  COUNT(*) FROM commissions
UNION ALL
SELECT 'notifications',                COUNT(*) FROM notifications
UNION ALL
SELECT 'audit_log',                    COUNT(*) FROM audit_log
UNION ALL
SELECT 'sessions',                     COUNT(*) FROM sessions;