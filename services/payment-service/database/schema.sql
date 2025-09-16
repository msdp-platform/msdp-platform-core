-- MSDP Payment Service Database Schema
-- ✅ ONLY contains payment and financial data (follows microservice principles)
-- ✅ Database folder outside src/ (operations team management)

-- ✅ Payment Methods (Payment Service owns this)
CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL, -- Reference to User Service (no FK across services)
    method_type VARCHAR(20) NOT NULL, -- credit_card, debit_card, digital_wallet, bank_transfer
    provider VARCHAR(50) NOT NULL, -- stripe, paypal, razorpay, etc.
    
    -- Card Information (encrypted/tokenized in production)
    card_last_four VARCHAR(4),
    card_brand VARCHAR(20), -- visa, mastercard, amex
    card_exp_month INTEGER,
    card_exp_year INTEGER,
    
    -- Digital Wallet Information
    wallet_type VARCHAR(20), -- apple_pay, google_pay, paypal
    wallet_email VARCHAR(255),
    
    -- Bank Information
    bank_name VARCHAR(100),
    account_type VARCHAR(20), -- checking, savings
    
    -- Provider Tokens (for secure payment processing)
    provider_token VARCHAR(255), -- Stripe customer ID, PayPal token, etc.
    provider_payment_method_id VARCHAR(255),
    
    -- Metadata
    is_default BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    country_code VARCHAR(3) NOT NULL,
    currency_code VARCHAR(3) NOT NULL DEFAULT 'USD',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ✅ Transactions (Payment Service owns this)
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_number VARCHAR(30) UNIQUE NOT NULL, -- Human-readable transaction ID
    
    -- Order Information
    order_id UUID NOT NULL, -- Reference to Order Service
    user_id UUID NOT NULL, -- Reference to User Service
    merchant_id UUID NOT NULL, -- Reference to Merchant Service
    
    -- Payment Information
    payment_method_id UUID REFERENCES payment_methods(id),
    payment_provider VARCHAR(50) NOT NULL,
    provider_transaction_id VARCHAR(255), -- Stripe payment intent ID, etc.
    
    -- Transaction Details
    transaction_type VARCHAR(20) NOT NULL, -- payment, refund, chargeback
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed, cancelled
    
    -- Amounts
    amount DECIMAL(10,2) NOT NULL,
    currency_code VARCHAR(3) NOT NULL DEFAULT 'USD',
    exchange_rate DECIMAL(10,6) DEFAULT 1.000000,
    
    -- Fees
    processing_fee DECIMAL(10,2) DEFAULT 0.00,
    platform_fee DECIMAL(10,2) DEFAULT 0.00,
    
    -- Provider Response
    provider_response JSONB,
    failure_reason TEXT,
    
    -- Metadata
    country_code VARCHAR(3) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ✅ Refunds (Payment Service owns this)
CREATE TABLE refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    refund_number VARCHAR(30) UNIQUE NOT NULL,
    transaction_id UUID NOT NULL REFERENCES transactions(id),
    order_id UUID NOT NULL, -- Reference to Order Service
    
    -- Refund Details
    refund_type VARCHAR(20) NOT NULL, -- full, partial, processing_fee
    amount DECIMAL(10,2) NOT NULL,
    currency_code VARCHAR(3) NOT NULL,
    reason VARCHAR(100) NOT NULL,
    notes TEXT,
    
    -- Provider Information
    provider_refund_id VARCHAR(255),
    provider_response JSONB,
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
    
    -- Metadata
    initiated_by VARCHAR(50), -- customer, merchant, admin, system
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ✅ Tax Calculations (Payment Service owns this)
CREATE TABLE tax_calculations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL, -- Reference to Order Service
    country_code VARCHAR(3) NOT NULL,
    region_code VARCHAR(10),
    city_code VARCHAR(20),
    
    -- Tax Breakdown
    subtotal DECIMAL(10,2) NOT NULL,
    tax_rate DECIMAL(5,4) NOT NULL, -- e.g., 0.0875 for 8.75%
    tax_amount DECIMAL(10,2) NOT NULL,
    
    -- Tax Details
    tax_type VARCHAR(50), -- sales_tax, vat, gst
    tax_jurisdiction VARCHAR(100),
    tax_rules JSONB, -- Detailed tax calculation rules
    
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ✅ Discount Applications (Payment Service owns this)
CREATE TABLE discount_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL, -- Reference to Order Service
    user_id UUID NOT NULL, -- Reference to User Service
    
    -- Discount Details
    discount_code VARCHAR(50),
    discount_type VARCHAR(20) NOT NULL, -- percentage, fixed_amount, free_delivery
    discount_value DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) NOT NULL, -- Actual amount discounted
    
    -- Metadata
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_payment_methods_user ON payment_methods(user_id);
CREATE INDEX idx_payment_methods_default ON payment_methods(user_id, is_default);
CREATE INDEX idx_payment_methods_provider ON payment_methods(provider, provider_payment_method_id);

CREATE INDEX idx_transactions_order ON transactions(order_id);
CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_provider ON transactions(payment_provider, provider_transaction_id);
CREATE INDEX idx_transactions_created ON transactions(created_at);
CREATE INDEX idx_transactions_number ON transactions(transaction_number);

CREATE INDEX idx_refunds_transaction ON refunds(transaction_id);
CREATE INDEX idx_refunds_order ON refunds(order_id);
CREATE INDEX idx_refunds_status ON refunds(status);
CREATE INDEX idx_refunds_number ON refunds(refund_number);

CREATE INDEX idx_tax_calculations_order ON tax_calculations(order_id);
CREATE INDEX idx_tax_calculations_country ON tax_calculations(country_code);

CREATE INDEX idx_discount_applications_order ON discount_applications(order_id);
CREATE INDEX idx_discount_applications_user ON discount_applications(user_id);
CREATE INDEX idx_discount_applications_code ON discount_applications(discount_code);

-- ✅ Insert sample payment methods for testing
INSERT INTO payment_methods (user_id, method_type, provider, card_last_four, card_brand, 
                            is_default, country_code, currency_code) VALUES 
(gen_random_uuid(), 'credit_card', 'stripe', '4242', 'visa', true, 'US', 'USD'),
(gen_random_uuid(), 'digital_wallet', 'apple_pay', NULL, NULL, false, 'US', 'USD');

-- ✅ Insert sample transactions for testing
INSERT INTO transactions (transaction_number, order_id, user_id, merchant_id, 
                         payment_provider, transaction_type, status, amount, currency_code, country_code) VALUES 
('TXN-001', gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), 
 'stripe', 'payment', 'completed', 28.50, 'USD', 'US'),
('TXN-002', gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), 
 'stripe', 'payment', 'completed', 21.75, 'USD', 'US');

-- Grant permissions to msdp_user
-- Note: These commands work in PostgreSQL runtime, linter may show warnings
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO msdp_user;
-- GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO msdp_user;
