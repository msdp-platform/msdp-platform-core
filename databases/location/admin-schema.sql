-- Location & Service Enablement Database Schema
-- This schema supports the geographic hierarchy and service enablement

-- Geographic Hierarchy Tables
CREATE TABLE IF NOT EXISTS countries (
    id SERIAL PRIMARY KEY,
    country_code VARCHAR(3) UNIQUE NOT NULL,
    country_name VARCHAR(100) NOT NULL,
    currency_code VARCHAR(3) DEFAULT 'USD',
    timezone VARCHAR(50) DEFAULT 'UTC',
    is_active BOOLEAN DEFAULT false,
    enabled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS regions (
    id SERIAL PRIMARY KEY,
    country_id INTEGER REFERENCES countries(id),
    region_code VARCHAR(10) NOT NULL,
    region_name VARCHAR(100) NOT NULL,
    region_type VARCHAR(50) DEFAULT 'state', -- state, province, territory
    is_active BOOLEAN DEFAULT false,
    enabled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(country_id, region_code)
);

CREATE TABLE IF NOT EXISTS districts (
    id SERIAL PRIMARY KEY,
    region_id INTEGER REFERENCES regions(id),
    district_code VARCHAR(10) NOT NULL,
    district_name VARCHAR(100) NOT NULL,
    district_type VARCHAR(50) DEFAULT 'county', -- county, district, area
    is_active BOOLEAN DEFAULT false,
    enabled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(region_id, district_code)
);

CREATE TABLE IF NOT EXISTS cities (
    id SERIAL PRIMARY KEY,
    district_id INTEGER REFERENCES districts(id),
    city_code VARCHAR(20) NOT NULL,
    city_name VARCHAR(100) NOT NULL,
    city_type VARCHAR(50) DEFAULT 'city', -- city, town, municipality
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    population INTEGER,
    is_active BOOLEAN DEFAULT false,
    enabled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(district_id, city_code)
);

-- Service Categories
CREATE TABLE IF NOT EXISTS service_categories (
    id SERIAL PRIMARY KEY,
    category_code VARCHAR(20) UNIQUE NOT NULL,
    category_name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Service Category Enablement per Location
CREATE TABLE IF NOT EXISTS location_service_enablement (
    id SERIAL PRIMARY KEY,
    city_id INTEGER REFERENCES cities(id),
    service_category_id INTEGER REFERENCES service_categories(id),
    is_enabled BOOLEAN DEFAULT false,
    enabled_at TIMESTAMP,
    enabled_by INTEGER, -- admin user who enabled it
    delivery_radius_km DECIMAL(5,2) DEFAULT 10.0,
    min_order_amount DECIMAL(10,2) DEFAULT 0.0,
    commission_rate DECIMAL(5,2) DEFAULT 5.0, -- percentage
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(city_id, service_category_id)
);

-- Delivery Zones
CREATE TABLE IF NOT EXISTS delivery_zones (
    id SERIAL PRIMARY KEY,
    city_id INTEGER REFERENCES cities(id),
    zone_name VARCHAR(100) NOT NULL,
    zone_type VARCHAR(50) DEFAULT 'standard', -- standard, premium, express
    delivery_radius_km DECIMAL(5,2) NOT NULL,
    delivery_fee DECIMAL(10,2) DEFAULT 0.0,
    min_order_amount DECIMAL(10,2) DEFAULT 0.0,
    estimated_delivery_time_minutes INTEGER DEFAULT 30,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Local Regulations and Compliance
CREATE TABLE IF NOT EXISTS local_regulations (
    id SERIAL PRIMARY KEY,
    city_id INTEGER REFERENCES cities(id),
    regulation_type VARCHAR(50) NOT NULL, -- operating_hours, delivery_restrictions, tax_rates
    regulation_key VARCHAR(100) NOT NULL,
    regulation_value TEXT NOT NULL,
    effective_from DATE NOT NULL,
    effective_until DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(city_id, regulation_type, regulation_key, effective_from)
);

-- Insert sample data
INSERT INTO countries (country_code, country_name, currency_code, timezone, is_active, enabled_at) VALUES 
('US', 'United States', 'USD', 'America/New_York', true, CURRENT_TIMESTAMP),
('SG', 'Singapore', 'SGD', 'Asia/Singapore', true, CURRENT_TIMESTAMP),
('GB', 'United Kingdom', 'GBP', 'Europe/London', false, NULL),
('AU', 'Australia', 'AUD', 'Australia/Sydney', false, NULL);

INSERT INTO regions (country_id, region_code, region_name, region_type, is_active, enabled_at) VALUES 
(1, 'CA', 'California', 'state', true, CURRENT_TIMESTAMP),
(1, 'NY', 'New York', 'state', true, CURRENT_TIMESTAMP),
(2, 'SG', 'Singapore', 'city-state', true, CURRENT_TIMESTAMP);

INSERT INTO districts (region_id, district_code, district_name, district_type, is_active, enabled_at) VALUES 
(1, 'SF', 'San Francisco', 'county', true, CURRENT_TIMESTAMP),
(1, 'LA', 'Los Angeles', 'county', true, CURRENT_TIMESTAMP),
(2, 'NYC', 'New York City', 'county', true, CURRENT_TIMESTAMP),
(3, 'SG', 'Singapore', 'district', true, CURRENT_TIMESTAMP);

INSERT INTO cities (district_id, city_code, city_name, city_type, latitude, longitude, population, is_active, enabled_at) VALUES 
(1, 'san-francisco', 'San Francisco', 'city', 37.7749, -122.4194, 873965, true, CURRENT_TIMESTAMP),
(2, 'los-angeles', 'Los Angeles', 'city', 34.0522, -118.2437, 3971883, true, CURRENT_TIMESTAMP),
(3, 'new-york', 'New York City', 'city', 40.7128, -74.0060, 8336817, true, CURRENT_TIMESTAMP),
(4, 'singapore', 'Singapore', 'city', 1.3521, 103.8198, 5453600, true, CURRENT_TIMESTAMP);

INSERT INTO service_categories (category_code, category_name, description, icon, is_active) VALUES 
('food', 'Food & Dining', 'Restaurants, cafes, street food, catering services', '🍔', true),
('grocery', 'Grocery & Retail', 'Supermarkets, convenience stores, pharmacies', '🛒', true),
('services', 'Local Services', 'Laundry, cleaning, repairs, beauty services', '🔧', true),
('healthcare', 'Healthcare', 'Pharmacy, medical supplies, health services', '💊', true),
('automotive', 'Automotive', 'Car services, fuel, auto parts', '🚗', true);

-- Enable food and grocery services in San Francisco
INSERT INTO location_service_enablement (city_id, service_category_id, is_enabled, enabled_at, delivery_radius_km, min_order_amount, commission_rate) VALUES 
(1, 1, true, CURRENT_TIMESTAMP, 15.0, 10.0, 5.0), -- Food in SF
(1, 2, true, CURRENT_TIMESTAMP, 10.0, 15.0, 4.0), -- Grocery in SF
(1, 3, true, CURRENT_TIMESTAMP, 20.0, 25.0, 6.0); -- Services in SF

-- Enable all services in Singapore
INSERT INTO location_service_enablement (city_id, service_category_id, is_enabled, enabled_at, delivery_radius_km, min_order_amount, commission_rate) VALUES 
(4, 1, true, CURRENT_TIMESTAMP, 12.0, 8.0, 4.5), -- Food in Singapore
(4, 2, true, CURRENT_TIMESTAMP, 8.0, 12.0, 3.5), -- Grocery in Singapore
(4, 3, true, CURRENT_TIMESTAMP, 15.0, 20.0, 5.5), -- Services in Singapore
(4, 4, true, CURRENT_TIMESTAMP, 10.0, 5.0, 4.0); -- Healthcare in Singapore

-- Create delivery zones
INSERT INTO delivery_zones (city_id, zone_name, zone_type, delivery_radius_km, delivery_fee, min_order_amount, estimated_delivery_time_minutes) VALUES 
(1, 'SF Downtown', 'standard', 5.0, 2.99, 15.0, 25),
(1, 'SF Metro', 'standard', 10.0, 4.99, 20.0, 35),
(1, 'SF Extended', 'premium', 15.0, 7.99, 30.0, 45),
(4, 'Singapore Central', 'standard', 8.0, 1.99, 10.0, 20),
(4, 'Singapore Island', 'standard', 12.0, 3.99, 15.0, 30);

-- Add local regulations
INSERT INTO local_regulations (city_id, regulation_type, regulation_key, regulation_value, effective_from) VALUES 
(1, 'operating_hours', 'delivery_hours', '06:00-23:00', CURRENT_DATE),
(1, 'delivery_restrictions', 'alcohol_delivery', '21+ only, valid ID required', CURRENT_DATE),
(1, 'tax_rates', 'sales_tax', '8.5', CURRENT_DATE),
(4, 'operating_hours', 'delivery_hours', '07:00-22:00', CURRENT_DATE),
(4, 'delivery_restrictions', 'alcohol_delivery', '18+ only, valid ID required', CURRENT_DATE),
(4, 'tax_rates', 'gst_rate', '7', CURRENT_DATE);
