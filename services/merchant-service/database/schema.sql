-- Create database
CREATE DATABASE msdp_merchant;

-- Use the database
\c msdp_merchant;

-- Create merchants table
CREATE TABLE merchants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    business_type VARCHAR(50) DEFAULT 'restaurant',
    description TEXT,
    logo_url VARCHAR(500),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create menu_items table
CREATE TABLE menu_items (
    id SERIAL PRIMARY KEY,
    merchant_id INTEGER REFERENCES merchants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'active', -- active, inactive, out_of_stock
    stock INTEGER DEFAULT 0,
    preparation_time INTEGER, -- in minutes
    is_vegetarian BOOLEAN DEFAULT FALSE,
    is_vegan BOOLEAN DEFAULT FALSE,
    is_gluten_free BOOLEAN DEFAULT FALSE,
    calories INTEGER,
    serving_size VARCHAR(50),
    ingredients JSONB DEFAULT '[]',
    allergens JSONB DEFAULT '[]',
    tags JSONB DEFAULT '[]',
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create orders table (for tracking merchant orders)
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    merchant_id INTEGER REFERENCES merchants(id) ON DELETE CASCADE,
    customer_id INTEGER,
    customer_name VARCHAR(100),
    customer_email VARCHAR(255),
    customer_phone VARCHAR(20),
    items JSONB NOT NULL, -- array of menu items with quantities
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, confirmed, preparing, ready, completed, cancelled
    delivery_address TEXT,
    delivery_type VARCHAR(20) DEFAULT 'delivery', -- delivery, pickup
    payment_status VARCHAR(20) DEFAULT 'pending', -- pending, paid, failed, refunded
    payment_method VARCHAR(20),
    notes TEXT,
    estimated_delivery_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_menu_items_merchant_id ON menu_items(merchant_id);
CREATE INDEX idx_menu_items_category ON menu_items(category);
CREATE INDEX idx_menu_items_status ON menu_items(status);
CREATE INDEX idx_orders_merchant_id ON orders(merchant_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- Insert sample merchant data
INSERT INTO merchants (name, email, password_hash, phone, address, business_type, description) VALUES 
('Demo Restaurant', 'demo@restaurant.com', '$2a$10$8Wv5Kx.Y5YZy5KzGQ7ZKX.tqQQvY9wFt8QyY5QzY5Y5Y5Y5Y5Y5Y5.', '+1-555-0123', '123 Main St, City, State 12345', 'restaurant', 'A delicious family restaurant serving fresh, local cuisine');

-- Get the merchant ID for sample data
DO $$ 
DECLARE 
    merchant_id INTEGER;
BEGIN
    SELECT id INTO merchant_id FROM merchants WHERE email = 'demo@restaurant.com';
    
    -- Insert sample menu items
    INSERT INTO menu_items (merchant_id, name, description, price, category, status, stock, preparation_time, is_vegetarian, is_vegan, is_gluten_free, calories, serving_size, ingredients, allergens, tags) VALUES 
    (merchant_id, 'Margherita Pizza', 'Classic pizza with tomato sauce, mozzarella, and fresh basil', 15.99, 'Pizza', 'active', 25, 15, true, false, false, 320, '12 inch', '["Tomato sauce", "Mozzarella cheese", "Fresh basil", "Olive oil"]', '["Dairy", "Gluten"]', '["popular", "classic", "vegetarian"]'),
    (merchant_id, 'Chicken Burger', 'Grilled chicken breast with lettuce, tomato, and mayo', 12.50, 'Burgers', 'active', 18, 12, false, false, false, 450, '1 burger', '["Chicken breast", "Lettuce", "Tomato", "Mayo", "Bun"]', '["Eggs", "Gluten"]', '["grilled", "protein"]'),
    (merchant_id, 'Caesar Salad', 'Fresh romaine lettuce with parmesan cheese and croutons', 9.99, 'Salads', 'out_of_stock', 0, 8, true, false, false, 280, 'Large bowl', '["Romaine lettuce", "Parmesan cheese", "Croutons", "Caesar dressing"]', '["Dairy", "Gluten", "Eggs"]', '["healthy", "fresh"]'),
    (merchant_id, 'Spaghetti Carbonara', 'Creamy pasta with eggs, cheese, and crispy bacon', 14.99, 'Pasta', 'active', 15, 18, false, false, false, 520, 'Large plate', '["Spaghetti", "Eggs", "Parmesan cheese", "Bacon", "Black pepper"]', '["Dairy", "Gluten", "Eggs"]', '["creamy", "comfort"]'),
    (merchant_id, 'Chocolate Lava Cake', 'Warm chocolate cake with molten center, served with vanilla ice cream', 8.99, 'Desserts', 'active', 12, 10, true, false, false, 380, '1 cake', '["Dark chocolate", "Butter", "Eggs", "Sugar", "Flour", "Vanilla ice cream"]', '["Dairy", "Gluten", "Eggs"]', '["chocolate", "warm", "indulgent"]);
END $$;
