--CREATE DATABASE realestate_db
-- 1. Bảng Users (Bỏ mã hóa mật khẩu phức tạp ở DB, xử lý ở backend bằng BCrypt)
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL, -- 'admin', 'broker', 'customer'
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Bảng Categories (Danh mục tỉnh thành, loại BDS)
CREATE TABLE categories (
    category_id SERIAL PRIMARY KEY,
    category_type VARCHAR(50) NOT NULL, -- 'property_type', 'province'
    category_name VARCHAR(255) NOT NULL,
    parent_id INT REFERENCES categories(category_id)
);

-- 3. Bảng Properties (BDS - Bỏ các trường lat/long, chủ sở hữu mã hóa)
CREATE TABLE properties (
    property_id SERIAL PRIMARY KEY,
    property_code VARCHAR(50) UNIQUE NOT NULL, -- Xử lý sinh mã ở Java
    title VARCHAR(500) NOT NULL,
    description TEXT,
    property_type VARCHAR(50) NOT NULL,
    status VARCHAR(30) DEFAULT 'pending', -- 'pending', 'published', 'in_transaction', 'sold'
    province VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    area NUMERIC(10, 2) NOT NULL,
    price NUMERIC(18, 2) NOT NULL,
    created_by INT REFERENCES users(user_id),
    assigned_to INT REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Bảng Property Images
CREATE TABLE property_images (
    image_id SERIAL PRIMARY KEY,
    property_id INT NOT NULL REFERENCES properties(property_id) ON DELETE CASCADE,
    url VARCHAR(500) NOT NULL,
    is_primary BOOLEAN DEFAULT false
);

-- 5. Bảng Customers (Hồ sơ khách hàng mở rộng)
CREATE TABLE customers (
    customer_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL UNIQUE REFERENCES users(user_id),
    customer_type VARCHAR(20), -- 'buyer', 'seller'
    address VARCHAR(500),
    budget_max NUMERIC(18, 2)
);

-- 6. Bảng Leads (Khách tiềm năng)
CREATE TABLE leads (
    lead_id SERIAL PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    property_id INT REFERENCES properties(property_id),
    assigned_to INT REFERENCES users(user_id),
    status VARCHAR(30) DEFAULT 'new', -- 'new', 'contacted'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Bảng Transactions (Giao dịch)
CREATE TABLE transactions (
    transaction_id SERIAL PRIMARY KEY,
    transaction_code VARCHAR(50) UNIQUE NOT NULL,
    property_id INT NOT NULL REFERENCES properties(property_id),
    customer_id INT NOT NULL REFERENCES users(user_id),
    broker_id INT NOT NULL REFERENCES users(user_id),
    appointment_id INT REFERENCES appointments(appointment_id),
    total_price NUMERIC(18, 2) NOT NULL,
    deposit_amount NUMERIC(18, 2) DEFAULT 0,
    status VARCHAR(30) DEFAULT 'pending', -- 'pending', 'customer_confirmed', 'documents_submitted', 'documents_verified', 'payment_submitted', 'deposit_confirmed', 'commitment_signed', 'deal_scheduled', 'broker_confirmed', 'refund_requested', 'refunded', 'completed', 'cancelled'
    transaction_date DATE DEFAULT CURRENT_DATE,
    deal_schedule_at TIMESTAMP
);

-- 8. Bảng Transaction Payments (Thanh toán - Rút gọn các file chứng từ phức tạp)
CREATE TABLE transaction_payments (
    payment_id SERIAL PRIMARY KEY,
    transaction_id INT NOT NULL REFERENCES transactions(transaction_id),
    amount NUMERIC(18, 2) NOT NULL,
    payment_method VARCHAR(30), -- 'cash', 'transfer'
    payment_status VARCHAR(30) DEFAULT 'pending', -- 'pending', 'submitted', 'confirmed', 'refund_requested', 'refunded'
    payment_date DATE DEFAULT CURRENT_DATE,
    confirmed_by INT REFERENCES users(user_id)
);

-- 9. Bảng Contracts (Hợp đồng)
CREATE TABLE transaction_documents (
    document_id SERIAL PRIMARY KEY,
    transaction_id INT NOT NULL REFERENCES transactions(transaction_id),
    document_type VARCHAR(50) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE contracts (
    contract_id SERIAL PRIMARY KEY,
    transaction_id INT NOT NULL REFERENCES transactions(transaction_id),
    contract_type VARCHAR(30), -- 'deposit', 'sale'
    price NUMERIC(18, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Bảng Appointments (Lịch hẹn)
CREATE TABLE appointments (
    appointment_id SERIAL PRIMARY KEY,
    property_id INT NOT NULL REFERENCES properties(property_id),
    customer_id INT NOT NULL REFERENCES users(user_id),
    broker_id INT NOT NULL REFERENCES users(user_id),
    scheduled_at TIMESTAMP NOT NULL,
    status VARCHAR(30) DEFAULT 'scheduled', -- 'scheduled', 'completed', 'cancelled'
    note TEXT
);

-- 11. Bảng Commissions (Hoa hồng)
CREATE TABLE commissions (
    commission_id SERIAL PRIMARY KEY,
    transaction_id INT NOT NULL REFERENCES transactions(transaction_id),
    user_id INT NOT NULL REFERENCES users(user_id),
    amount NUMERIC(18, 2) NOT NULL,
    status VARCHAR(30) DEFAULT 'pending' -- 'pending', 'paid'
);

-- 12. Bảng Notifications (Thông báo)
CREATE TABLE notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id),
    title VARCHAR(255) NOT NULL,
    content TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. Bảng Audit Log (Rút gọn tối đa, dùng để lưu log cơ bản thay vì Trigger phức tạp)
CREATE TABLE audit_log (
    audit_id SERIAL PRIMARY KEY,
    action_type VARCHAR(50), -- VD: 'UPDATE_PROPERTY', 'CREATE_TRANSACTION'
    user_id INT REFERENCES users(user_id),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 14. Bảng Sessions (Rút gọn)
CREATE TABLE sessions (
    session_id VARCHAR(255) PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
