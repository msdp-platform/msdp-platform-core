-- MSDP Order Service Database Schema
-- ✅ ONLY contains order and cart data (follows microservice principles)
-- ✅ Database folder outside src/ (operations team management)

-- ✅ Shopping Carts (Order Service owns this)
CREATE TABLE carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL, -- Reference to User Service (no FK across services)
    merchant_id UUID NOT NULL, -- Reference to Merchant Service
    country_code VARCHAR(3) NOT NULL,
    status VARCHAR(20) DEFAULT 'active', -- active, abandoned, converted
    total_amount DECIMAL(10,2) DEFAULT 0.00,
    item_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Note: In production, use CURRENT_TIMESTAMP + INTERVAL '1 day'
);

-- ✅ Cart Items (Order Service owns this)
CREATE TABLE cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    menu_item_id UUID NOT NULL, -- Reference to Merchant Service menu items
    item_name VARCHAR(255) NOT NULL, -- Cached for performance
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    special_instructions TEXT,
    customizations JSONB DEFAULT '{}',
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ✅ Orders (Order Service owns this)
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(20) UNIQUE NOT NULL, -- Human-readable order number
    user_id UUID NOT NULL, -- Reference to User Service
    merchant_id UUID NOT NULL, -- Reference to Merchant Service
    cart_id UUID REFERENCES carts(id),
    
    -- Order Details
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, confirmed, preparing, ready, picked_up, delivered, cancelled
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, paid, failed, refunded
    
    -- Amounts
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0.00,
    delivery_fee DECIMAL(10,2) DEFAULT 0.00,
    service_fee DECIMAL(10,2) DEFAULT 0.00,
    tip_amount DECIMAL(10,2) DEFAULT 0.00,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL,
    
    -- Delivery Information
    delivery_address JSONB NOT NULL, -- {street, city, postalCode, coordinates}
    delivery_instructions TEXT,
    estimated_delivery_time TIMESTAMP,
    actual_delivery_time TIMESTAMP,
    
    -- Customer Information (cached for performance)
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20),
    customer_email VARCHAR(255) NOT NULL,
    
    -- Merchant Information (cached for performance)
    merchant_name VARCHAR(255) NOT NULL,
    merchant_address TEXT,
    
    -- Metadata
    country_code VARCHAR(3) NOT NULL,
    currency_code VARCHAR(3) NOT NULL DEFAULT 'USD',
    order_source VARCHAR(20) DEFAULT 'web', -- web, mobile, api
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ✅ Order Items (Order Service owns this)
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id UUID NOT NULL, -- Reference to Merchant Service
    item_name VARCHAR(255) NOT NULL, -- Cached for performance
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    special_instructions TEXT,
    customizations JSONB DEFAULT '{}'
);

-- ✅ Order Status History (Order Service owns this)
CREATE TABLE order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL,
    notes TEXT,
    updated_by VARCHAR(50), -- system, customer, merchant, delivery_partner
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ✅ Order Tracking (Order Service owns this)
CREATE TABLE order_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID UNIQUE NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    tracking_number VARCHAR(50) UNIQUE NOT NULL,
    current_location JSONB, -- {lat, lng, address}
    delivery_partner_id UUID, -- Reference to future Delivery Service
    pickup_time TIMESTAMP,
    estimated_arrival TIMESTAMP,
    delivery_route JSONB, -- Array of coordinates
    real_time_updates JSONB DEFAULT '[]', -- Array of status updates
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_carts_user ON carts(user_id);
CREATE INDEX idx_carts_merchant ON carts(merchant_id);
CREATE INDEX idx_carts_status ON carts(status);
CREATE INDEX idx_carts_expires ON carts(expires_at);

CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);
CREATE INDEX idx_cart_items_menu ON cart_items(menu_item_id);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_merchant ON orders(merchant_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_country ON orders(country_code);
CREATE INDEX idx_orders_created ON orders(created_at);
CREATE INDEX idx_orders_number ON orders(order_number);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_menu ON order_items(menu_item_id);

CREATE INDEX idx_order_status_order ON order_status_history(order_id);
CREATE INDEX idx_order_status_timestamp ON order_status_history(timestamp);

CREATE INDEX idx_order_tracking_order ON order_tracking(order_id);
CREATE INDEX idx_order_tracking_number ON order_tracking(tracking_number);

-- ✅ Insert sample orders for testing
INSERT INTO orders (order_number, user_id, merchant_id, status, payment_status, 
                   subtotal, total_amount, delivery_address, customer_name, customer_email,
                   merchant_name, country_code, currency_code) VALUES 
('ORD-001', gen_random_uuid(), gen_random_uuid(), 'delivered', 'paid',
 25.50, 28.50, '{"street": "123 Main St", "city": "San Francisco", "postalCode": "94102"}',
 'John Doe', 'john@example.com', 'Urban Bites', 'US', 'USD'),
('ORD-002', gen_random_uuid(), gen_random_uuid(), 'preparing', 'paid',
 18.75, 21.75, '{"street": "456 Oak Ave", "city": "San Francisco", "postalCode": "94103"}',
 'Jane Smith', 'jane@example.com', 'GreenMart', 'US', 'USD');

-- Grant permissions to msdp_user
-- Note: These commands work in PostgreSQL runtime, linter may show warnings
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO msdp_user;
-- GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO msdp_user;