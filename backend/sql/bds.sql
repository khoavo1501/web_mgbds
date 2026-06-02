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
    reputation_score INT DEFAULT 100,
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
    exclusive_expired_at TIMESTAMP,
    -- Giấy tờ pháp lý
    red_book_url VARCHAR(500),
    household_registration_url VARCHAR(500),
    owner_id_url VARCHAR(500),
    -- Hợp đồng độc quyền
    contract_status VARCHAR(30),
    owner_name VARCHAR(100),
    owner_phone VARCHAR(20),
    exclusive_duration VARCHAR(100),
    brokerage_fee NUMERIC(5, 2),
    owner_desired_price NUMERIC(18, 2),
    commission_terms TEXT,
    brokerage_contract_url VARCHAR(500),
    -- Điểm uy tín / Vị trí chi tiết / Số phòng
    address VARCHAR(500),
    ward VARCHAR(100),
    bedrooms INT,
    bathrooms INT
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
    type VARCHAR(50),
    title VARCHAR(255) NOT NULL,
    message TEXT,
    is_read BOOLEAN DEFAULT false,
    target_role VARCHAR(50),
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

-- 17. Reputation History (Điểm uy tín)
CREATE TABLE reputation_history (
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

-- Indexes cho điểm uy tín
CREATE INDEX idx_reputation_history_user_id ON reputation_history(user_id);
CREATE INDEX idx_reputation_history_created_at ON reputation_history(created_at);
CREATE INDEX idx_users_reputation_score ON users(reputation_score);


-- =====================================================
-- PHẦN 2: DỮ LIỆU MẪU (SAMPLE DATA)
-- Password mặc định tất cả tài khoản: 123456
-- BCrypt hash: $2a$10$y2eKNgXjR.QNbmgp7vUmI./9SUwMZ79iN/CN/v4MxMUn5rgpBbENa
-- =====================================================

-- 1. Users
INSERT INTO users (email, password_hash, role, full_name, phone, is_active, reputation_score, created_at) VALUES
('admin@example.com',     '$2a$10$y2eKNgXjR.QNbmgp7vUmI./9SUwMZ79iN/CN/v4MxMUn5rgpBbENa', 'admin',    'Admin User',    '0123456789', true, 100, CURRENT_TIMESTAMP),
('broker1@example.com',   '$2a$10$y2eKNgXjR.QNbmgp7vUmI./9SUwMZ79iN/CN/v4MxMUn5rgpBbENa', 'broker',   'Nguyễn Văn A',  '0987654321', true, 100, CURRENT_TIMESTAMP),
('broker2@example.com',   '$2a$10$y2eKNgXjR.QNbmgp7vUmI./9SUwMZ79iN/CN/v4MxMUn5rgpBbENa', 'broker',   'Trần Thị B',    '0912345678', true, 100, CURRENT_TIMESTAMP),
('customer1@example.com', '$2a$10$y2eKNgXjR.QNbmgp7vUmI./9SUwMZ79iN/CN/v4MxMUn5rgpBbENa', 'customer', 'Lê Văn C',      '0909123456', true, 110, CURRENT_TIMESTAMP),
('customer2@example.com', '$2a$10$y2eKNgXjR.QNbmgp7vUmI./9SUwMZ79iN/CN/v4MxMUn5rgpBbENa', 'customer', 'Phạm Thị D',    '0908765432', true, 100, CURRENT_TIMESTAMP);

-- 2. Categories — Loại BDS
INSERT INTO categories (category_type, category_name, parent_id) VALUES
('property_type', 'Căn hộ',   NULL),
('property_type', 'Nhà riêng', NULL),
('property_type', 'Đất nền',   NULL),
('property_type', 'Biệt thự',  NULL),
('property_type', 'Shophouse', NULL);

-- Categories — Tỉnh thành
INSERT INTO categories (category_type, category_name, parent_id) VALUES
('province', 'Đà Nẵng', NULL);

-- Categories — Đơn vị hành chính cấp xã/phường/đặc khu của Đà Nẵng mới (parent_id = 6)
-- Theo Nghị quyết 202/2025/QH15 và 1659/NQ-UBTVQH15, hoạt động từ 01/07/2025.
INSERT INTO categories (category_type, category_name, parent_id) VALUES
('district', 'Phường Hải Châu',        6),
('district', 'Phường Hòa Cường',       6),
('district', 'Phường Thanh Khê',       6),
('district', 'Phường An Khê',          6),
('district', 'Phường An Hải',          6),
('district', 'Phường Sơn Trà',         6),
('district', 'Phường Ngũ Hành Sơn',    6),
('district', 'Phường Hòa Khánh',       6),
('district', 'Phường Hải Vân',         6),
('district', 'Phường Liên Chiểu',      6),
('district', 'Phường Cẩm Lệ',          6),
('district', 'Phường Hòa Xuân',        6),
('district', 'Xã Hòa Vang',            6),
('district', 'Xã Hòa Tiến',            6),
('district', 'Xã Bà Nà',               6),
('district', 'Xã Núi Thành',           6),
('district', 'Xã Tam Mỹ',              6),
('district', 'Xã Tam Anh',             6),
('district', 'Xã Đức Phú',             6),
('district', 'Xã Tam Xuân',            6),
('district', 'Xã Tam Hải',             6),
('district', 'Phường Tam Kỳ',          6),
('district', 'Phường Quảng Phú',       6),
('district', 'Phường Hương Trà',       6),
('district', 'Phường Bàn Thạch',       6),
('district', 'Xã Tây Hồ',              6),
('district', 'Xã Chiên Đàn',           6),
('district', 'Xã Phú Ninh',            6),
('district', 'Xã Lãnh Ngọc',           6),
('district', 'Xã Tiên Phước',          6),
('district', 'Xã Thạnh Bình',          6),
('district', 'Xã Sơn Cẩm Hà',          6),
('district', 'Xã Trà Liên',            6),
('district', 'Xã Trà Giáp',            6),
('district', 'Xã Trà Tân',             6),
('district', 'Xã Trà Đốc',             6),
('district', 'Xã Trà My',              6),
('district', 'Xã Nam Trà My',          6),
('district', 'Xã Trà Tập',             6),
('district', 'Xã Trà Vân',             6),
('district', 'Xã Trà Linh',            6),
('district', 'Xã Trà Leng',            6),
('district', 'Xã Thăng Bình',          6),
('district', 'Xã Thăng An',            6),
('district', 'Xã Thăng Trường',        6),
('district', 'Xã Thăng Điền',          6),
('district', 'Xã Thăng Phú',           6),
('district', 'Xã Đồng Dương',          6),
('district', 'Xã Quế Sơn Trung',       6),
('district', 'Xã Quế Sơn',             6),
('district', 'Xã Xuân Phú',            6),
('district', 'Xã Nông Sơn',            6),
('district', 'Xã Quế Phước',           6),
('district', 'Xã Duy Nghĩa',           6),
('district', 'Xã Nam Phước',           6),
('district', 'Xã Duy Xuyên',           6),
('district', 'Xã Thu Bồn',             6),
('district', 'Phường Điện Bàn',        6),
('district', 'Phường Điện Bàn Đông',   6),
('district', 'Phường An Thắng',        6),
('district', 'Phường Điện Bàn Bắc',    6),
('district', 'Xã Điện Bàn Tây',        6),
('district', 'Xã Gò Nổi',              6),
('district', 'Phường Hội An',          6),
('district', 'Phường Hội An Đông',     6),
('district', 'Phường Hội An Tây',      6),
('district', 'Xã Tân Hiệp',            6),
('district', 'Xã Đại Lộc',             6),
('district', 'Xã Hà Nha',              6),
('district', 'Xã Thượng Đức',          6),
('district', 'Xã Vu Gia',              6),
('district', 'Xã Phú Thuận',           6),
('district', 'Xã Thạnh Mỹ',            6),
('district', 'Xã Bến Giằng',           6),
('district', 'Xã Nam Giang',           6),
('district', 'Xã Đắc Pring',           6),
('district', 'Xã La Dêê',              6),
('district', 'Xã La Êê',               6),
('district', 'Xã Sông Vàng',           6),
('district', 'Xã Sông Kôn',            6),
('district', 'Xã Đông Giang',          6),
('district', 'Xã Bến Hiên',            6),
('district', 'Xã Avương',              6),
('district', 'Xã Tây Giang',           6),
('district', 'Xã Hùng Sơn',            6),
('district', 'Xã Hiệp Đức',            6),
('district', 'Xã Việt An',             6),
('district', 'Xã Phước Trà',           6),
('district', 'Xã Khâm Đức',            6),
('district', 'Xã Phước Năng',          6),
('district', 'Xã Phước Chánh',         6),
('district', 'Xã Phước Thành',         6),
('district', 'Xã Phước Hiệp',          6),
('district', 'Đặc khu Hoàng Sa',       6);

-- 3. Properties
INSERT INTO properties (property_code, title, description, property_type, status, province, district, area, price, created_by, assigned_to, red_book_url, household_registration_url, owner_id_url, address, ward, bedrooms, bathrooms, created_at) VALUES
('BDS-2024-0001', 'Căn hộ cao cấp 2PN ven sông Hàn',        'Căn hộ đẹp, view sông Hàn, nội thất đầy đủ, gần trường học và siêu thị',    'apartment', 'approved', 'Đà Nẵng', 'Phường Hải Châu',      75.5,  3500000000,  2, 2, 'https://res.cloudinary.com/dcd2tgvhv/image/upload/v1779845809/8.1_cnu5or.jpg', 'https://res.cloudinary.com/dcd2tgvhv/image/upload/v1779845808/8.2_u4ay2k.jpg', 'https://res.cloudinary.com/dcd2tgvhv/image/upload/v1779845809/8.1_cnu5or.jpg', '123 Đường Cầu Giấy', 'Dịch Vọng', 2, 2, CURRENT_TIMESTAMP),
('BDS-2024-0002', 'Nhà riêng 4 tầng trung tâm Thanh Khê',   'Nhà đẹp, ô tô đỗ cửa, thuận tiện kinh doanh và di chuyển vào trung tâm',     'house',     'approved',      'Đà Nẵng', 'Phường Thanh Khê',     120.0,  8500000000,  2, 2, 'https://res.cloudinary.com/dcd2tgvhv/image/upload/v1779845809/8.1_cnu5or.jpg', 'https://res.cloudinary.com/dcd2tgvhv/image/upload/v1779845808/8.2_u4ay2k.jpg', 'https://res.cloudinary.com/dcd2tgvhv/image/upload/v1779845809/8.1_cnu5or.jpg', '456 Đường Láng', 'Láng Thượng', 4, 3, CURRENT_TIMESTAMP),
('BDS-2024-0003', 'Biệt thự biển Sơn Trà',                  'Biệt thự sang trọng, gần biển, có hồ bơi riêng và không gian sân vườn',      'villa',     'approved',      'Đà Nẵng', 'Phường Sơn Trà',       250.0, 25000000000,  2, 2, 'https://res.cloudinary.com/dcd2tgvhv/image/upload/v1779845809/8.1_cnu5or.jpg', 'https://res.cloudinary.com/dcd2tgvhv/image/upload/v1779845808/8.2_u4ay2k.jpg', 'https://res.cloudinary.com/dcd2tgvhv/image/upload/v1779845809/8.1_cnu5or.jpg', '789 Đường Hoa Lan', 'Việt Hưng', 5, 4, CURRENT_TIMESTAMP),
('BDS-2024-0004', 'Căn hộ 3PN Ngũ Hành Sơn',                'Căn hộ rộng rãi, view thành phố, gần biển Mỹ Khê, nội thất cao cấp',         'apartment', 'approved',      'Đà Nẵng', 'Phường Ngũ Hành Sơn',  95.0,  5500000000,  2, 3, 'https://res.cloudinary.com/dcd2tgvhv/image/upload/v1779845809/8.1_cnu5or.jpg', 'https://res.cloudinary.com/dcd2tgvhv/image/upload/v1779845808/8.2_u4ay2k.jpg', 'https://res.cloudinary.com/dcd2tgvhv/image/upload/v1779845809/8.1_cnu5or.jpg', '321 Đường Nguyễn Văn Hưởng', 'Thảo Điền', 3, 2, CURRENT_TIMESTAMP),
('BDS-2024-0005', 'Đất nền khu đô thị Cẩm Lệ',              'Đất nền đẹp, vị trí kết nối thuận tiện, pháp lý rõ ràng, sổ riêng',          'land',      'approved',      'Đà Nẵng', 'Phường Cẩm Lệ',        100.0,  4000000000,  3, 3, 'https://res.cloudinary.com/dcd2tgvhv/image/upload/v1779845809/8.1_cnu5or.jpg', 'https://res.cloudinary.com/dcd2tgvhv/image/upload/v1779845808/8.2_u4ay2k.jpg', 'https://res.cloudinary.com/dcd2tgvhv/image/upload/v1779845809/8.1_cnu5or.jpg', '654 Đường Võ Văn Ngân', 'Linh Chiểu', 0, 0, CURRENT_TIMESTAMP),
('BDS-2024-0006', 'Shophouse mặt tiền Liên Chiểu',          'Shophouse 5 tầng, mặt tiền rộng, phù hợp kinh doanh và cho thuê',            'shophouse', 'approved',      'Đà Nẵng', 'Phường Liên Chiểu',    80.0, 12000000000,  2, 2, 'https://res.cloudinary.com/dcd2tgvhv/image/upload/v1779845809/8.1_cnu5or.jpg', 'https://res.cloudinary.com/dcd2tgvhv/image/upload/v1779845808/8.2_u4ay2k.jpg', 'https://res.cloudinary.com/dcd2tgvhv/image/upload/v1779845809/8.1_cnu5or.jpg', '987 Đường Nguyễn Trãi', 'Nhân Chính', 0, 3, CURRENT_TIMESTAMP),
('BDS-2024-0007', 'Căn hộ Studio gần đại học Đà Nẵng',      'Căn hộ mini, đầy đủ nội thất, giá tốt cho sinh viên và chuyên gia trẻ',      'apartment', 'approved',      'Đà Nẵng', 'Phường Hải Châu',      35.0,  2000000000,  2, 3, 'https://res.cloudinary.com/dcd2tgvhv/image/upload/v1779845809/8.1_cnu5or.jpg', 'https://res.cloudinary.com/dcd2tgvhv/image/upload/v1779845808/8.2_u4ay2k.jpg', 'https://res.cloudinary.com/dcd2tgvhv/image/upload/v1779845809/8.1_cnu5or.jpg', '147 Đường Lê Lợi', 'Bến Nghé', 1, 1, CURRENT_TIMESTAMP),
('BDS-2024-0008', 'Nhà vườn Hòa Vang',                      'Nhà đẹp, khu dân cư yên tĩnh, gần chợ và trường học, không gian thoáng',     'house',     'pending_review', 'Đà Nẵng', 'Xã Hòa Vang',          90.0, 7000000000,  2, 2, 'https://res.cloudinary.com/dcd2tgvhv/image/upload/v1779845809/8.1_cnu5or.jpg', 'https://res.cloudinary.com/dcd2tgvhv/image/upload/v1779845808/8.2_u4ay2k.jpg', 'https://res.cloudinary.com/dcd2tgvhv/image/upload/v1779845809/8.1_cnu5or.jpg', '258 Đường Bà Triệu', 'Phạm Đình Hổ', 3, 2, CURRENT_TIMESTAMP);

-- 4. Property Images
INSERT INTO property_images (property_id, url, is_primary) VALUES
(1, 'https://res.cloudinary.com/dcd2tgvhv/image/upload/v1779804022/3_y3eafz.jpg',  true),
(1, 'https://picsum.photos/800/600?random=2',  false),
(1, 'https://picsum.photos/800/600?random=3',  false),
(2, 'https://res.cloudinary.com/dcd2tgvhv/image/upload/v1779804022/2_tn5nkr.jpg',  true),
(2, 'https://picsum.photos/800/600?random=5',  false),
(3, 'https://res.cloudinary.com/dcd2tgvhv/image/upload/v1779845929/3.1_si4skg.jpg',  true),
(3, 'https://res.cloudinary.com/dcd2tgvhv/image/upload/v1779845929/3.2_a6dw5d.jpg',  false),
(3, 'https://picsum.photos/800/600?random=8',  false),
(3, 'https://picsum.photos/800/600?random=9',  false),
(4, 'https://res.cloudinary.com/dcd2tgvhv/image/upload/v1779845172/5.2_hflvgu.jpg', true),
(4, 'https://res.cloudinary.com/dcd2tgvhv/image/upload/v1779845175/5.3_gstnra.jpg', false),
(5, 'https://res.cloudinary.com/dcd2tgvhv/image/upload/v1779845808/6_vdma1x.jpg', true),
(6, 'https://res.cloudinary.com/dcd2tgvhv/image/upload/v1779845806/6.1_j5om5x.jpg', true),
(6, 'https://res.cloudinary.com/dcd2tgvhv/image/upload/v1779845806/6.2_ca2mtu.jpg', false),
(7, 'https://res.cloudinary.com/dcd2tgvhv/image/upload/v1779845807/6.3_rjvzwx.jpg', true),
(8, 'https://res.cloudinary.com/dcd2tgvhv/image/upload/v1779845809/8.1_cnu5or.jpg', true),
(8, 'https://res.cloudinary.com/dcd2tgvhv/image/upload/v1779845808/8.2_u4ay2k.jpg', false);

-- 5. Customers
INSERT INTO customers (user_id, customer_type, address, budget_max) VALUES
(4, 'buyer', '123 Đường Bạch Đằng, phường Hải Châu, Đà Nẵng', 5000000000),
(5, 'buyer', '456 Đường Nguyễn Văn Linh, phường Thanh Khê, Đà Nẵng', 8000000000);

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
(1, 4, 2, '2026-06-01 10:00:00', 'confirmed', 'Lịch hẹn đã xác nhận, chưa hoàn thành xem nhà',   'Lê Văn C',   '0909123456', 'customer1@example.com', '2026-06-01 08:00:00');

-- 8. Transactions
INSERT INTO transactions (transaction_code, property_id, customer_id, broker_id, total_price, deposit_amount, status, transaction_date) VALUES
('GD2024-001', 1, 4, 2, 3500000000, 350000000, 'completed', '2026-06-01');

INSERT INTO transaction_payments (transaction_id, amount, payment_method, payment_status, payment_date, confirmed_by) VALUES
(1, 350000000, 'transfer', 'completed', '2026-06-01', 2);

INSERT INTO commissions (transaction_id, user_id, amount, status) VALUES
(1, 2, 42000000, 'paid');

-- 9. Notifications
INSERT INTO notifications (user_id, type, title, message, is_read, created_at) VALUES
(2, 'appointment_created',   'Lịch hẹn mới',          'Bạn có lịch hẹn mới với khách hàng Lê Văn C',           false, CURRENT_TIMESTAMP),
(2, 'property_approved',    'BDS mới được gán',       'Bạn được gán phụ trách BDS BDS-2024-0001',               true,  CURRENT_TIMESTAMP),
(3, 'appointment_created',   'Yêu cầu tư vấn mới',    'Khách hàng Lê Văn C muốn hẹn xem nhà vườn Hòa Vang',     false, CURRENT_TIMESTAMP),
(3, 'property_approved',    'Bản tin đã được duyệt',  'Bất động sản BDS-2024-0008 của bạn đã được phê duyệt',    true,  CURRENT_TIMESTAMP),
(3, 'appointment_confirmed', 'Lịch hẹn xác nhận',     'Lịch hẹn xem Biệt thự biển Đà Nẵng đã được xác nhận',     false, CURRENT_TIMESTAMP),
(4, 'appointment_confirmed', 'Lịch hẹn được xác nhận','Lịch hẹn xem BDS BDS-2024-0004 đã được xác nhận',        false, CURRENT_TIMESTAMP),
(4, 'appointment_completed', 'Lịch hẹn hoàn thành',   'Lịch hẹn xem BDS BDS-2024-0001 đã hoàn thành',           true,  CURRENT_TIMESTAMP - INTERVAL '5 days');

-- 10. Reputation History (Lịch sử điểm uy tín)
INSERT INTO reputation_history (user_id, action_type, points_change, previous_score, new_score, reason, appointment_id, created_at) VALUES
(4, 'complete_appointment', 5, 100, 105, 'Hoàn thành lịch hẹn đúng giờ', 4, CURRENT_TIMESTAMP - INTERVAL '5 days'),
(4, 'complete_appointment', 5, 105, 110, 'Hoàn thành lịch hẹn đúng giờ', NULL, CURRENT_TIMESTAMP - INTERVAL '10 days');


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
SELECT 'sessions',                     COUNT(*) FROM sessions
UNION ALL
SELECT 'reputation_history',           COUNT(*) FROM reputation_history;