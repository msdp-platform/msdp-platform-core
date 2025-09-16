-- MSDP User Service Database Schema
-- ✅ ONLY contains customer user data (follows microservice principles)

-- ✅ Customer Users (User Service owns this)
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    country_code VARCHAR(3) NOT NULL DEFAULT 'US',
    preferences JSONB DEFAULT '{}',
    email_verified BOOLEAN DEFAULT false,
    phone_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ✅ User Locations (User Service owns this)
CREATE TABLE user_locations (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    country_code VARCHAR(3) NOT NULL,
    city VARCHAR(100),
    postal_code VARCHAR(20),
    coordinates JSONB, -- {lat: number, lng: number}
    address TEXT,
    is_default BOOLEAN DEFAULT true,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ✅ User Sessions (User Service owns this)
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    refresh_token VARCHAR(255) UNIQUE NOT NULL,
    device_info JSONB,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ✅ User Preferences (User Service owns this)
CREATE TABLE user_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    dietary_restrictions JSONB DEFAULT '[]', -- ["vegan", "gluten-free"]
    cuisine_preferences JSONB DEFAULT '[]', -- ["italian", "indian"]
    delivery_preferences JSONB DEFAULT '{}', -- {contactless: true, leaveAtDoor: false}
    notification_preferences JSONB DEFAULT '{}', -- {email: true, push: true, sms: false}
    payment_preferences JSONB DEFAULT '{}', -- {defaultMethod: "card", autoTip: 18}
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ✅ Email Verification (User Service owns this)
CREATE TABLE email_verifications (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    verification_code VARCHAR(10) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ✅ Password Resets (User Service owns this)
CREATE TABLE password_resets (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reset_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_country ON users(country_code);
CREATE INDEX idx_users_active ON users(is_active);
CREATE INDEX idx_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at);
CREATE INDEX idx_locations_user ON user_locations(user_id);
CREATE INDEX idx_locations_country ON user_locations(country_code);
CREATE INDEX idx_email_verifications_user ON email_verifications(user_id);
CREATE INDEX idx_email_verifications_code ON email_verifications(verification_code);
CREATE INDEX idx_password_resets_token ON password_resets(reset_token);

-- ✅ Insert sample customer users
INSERT INTO users (id, email, password_hash, name, phone, country_code, email_verified) VALUES 
(gen_random_uuid(), 'john@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/SJmr6.oAm', 'John Doe', '+1234567890', 'US', true),
(gen_random_uuid(), 'jane@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/SJmr6.oAm', 'Jane Smith', '+0987654321', 'US', true),
(gen_random_uuid(), 'raj@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/SJmr6.oAm', 'Raj Patel', '+919876543210', 'IN', true),
(gen_random_uuid(), 'sarah@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/SJmr6.oAm', 'Sarah Wilson', '+447123456789', 'GB', true);

-- Note: Password for all demo users is 'password123'

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO msdp_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO msdp_user;
