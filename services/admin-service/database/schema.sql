-- MSDP Admin Service Database Schema
-- ✅ ONLY contains admin-specific data (follows microservice principles)

-- Note: Database msdp_admin is created automatically by Docker
-- No need to create database or switch context in Docker init scripts

-- ✅ Admin Users (Admin Service owns this)
CREATE TABLE admin_users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'admin',
    permissions JSONB DEFAULT '[]',
    password_hash VARCHAR(255),
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ✅ Platform Settings (Admin Service owns this)
CREATE TABLE platform_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    description TEXT,
    updated_by INTEGER REFERENCES admin_users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ✅ Admin Audit Logs (Admin Service owns this)
CREATE TABLE admin_audit_logs (
    id SERIAL PRIMARY KEY,
    admin_user_id INTEGER REFERENCES admin_users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(100),
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ✅ Approval Workflows (Admin Service owns this)
CREATE TABLE approval_workflows (
    id SERIAL PRIMARY KEY,
    workflow_type VARCHAR(50) NOT NULL, -- 'merchant_approval', 'location_enablement'
    resource_id VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    requested_by VARCHAR(100),
    reviewed_by INTEGER REFERENCES admin_users(id),
    review_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP
);

-- ✅ Service Health Monitoring (Admin Service responsibility)
CREATE TABLE service_health_logs (
    id SERIAL PRIMARY KEY,
    service_name VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL, -- 'healthy', 'unhealthy', 'degraded'
    response_time INTEGER, -- in milliseconds
    error_message TEXT,
    checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_admin_users_email ON admin_users(email);
CREATE INDEX idx_admin_users_role ON admin_users(role);
CREATE INDEX idx_platform_settings_key ON platform_settings(setting_key);
CREATE INDEX idx_audit_logs_admin_user ON admin_audit_logs(admin_user_id);
CREATE INDEX idx_audit_logs_timestamp ON admin_audit_logs(timestamp);
CREATE INDEX idx_approval_workflows_type ON approval_workflows(workflow_type);
CREATE INDEX idx_approval_workflows_status ON approval_workflows(status);
CREATE INDEX idx_service_health_service ON service_health_logs(service_name);
CREATE INDEX idx_service_health_timestamp ON service_health_logs(checked_at);

-- ✅ Insert initial admin users
INSERT INTO admin_users (email, name, role, permissions) VALUES 
('admin@msdp.com', 'Super Admin', 'super_admin', '["all"]'),
('manager@msdp.com', 'Platform Manager', 'admin', '["merchant_approval", "location_management", "analytics"]'),
('analyst@msdp.com', 'Data Analyst', 'analyst', '["analytics", "reports"]');

-- ✅ Insert initial platform settings
INSERT INTO platform_settings (setting_key, setting_value, description) VALUES 
('platform_name', '"MSDP Platform"', 'Platform display name'),
('default_currency', '"USD"', 'Default platform currency'),
('merchant_approval_required', 'true', 'Whether merchant approval is required'),
('location_auto_enable', 'false', 'Whether location services are auto-enabled'),
('audit_retention_days', '365', 'Number of days to retain audit logs');

-- ✅ Insert sample approval workflows
INSERT INTO approval_workflows (workflow_type, resource_id, status, requested_by) VALUES 
('merchant_approval', 'merchant_001', 'pending', 'system'),
('location_enablement', 'location_usa_sf', 'pending', 'system');

-- Grant permissions to msdp_user
-- Note: These commands work in PostgreSQL runtime, linter may show warnings
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO msdp_user;
-- GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO msdp_user;
