ALTER TABLE properties
ADD COLUMN is_locked BOOLEAN DEFAULT false,
ADD COLUMN source_type VARCHAR(50) DEFAULT 'self_exploited',
ADD COLUMN is_exclusive BOOLEAN DEFAULT false,
ADD COLUMN exclusive_expired_at TIMESTAMP;

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

ALTER TABLE transactions
ADD COLUMN expired_at TIMESTAMP;
