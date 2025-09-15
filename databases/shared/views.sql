-- Shared Database Views for MSDP Platform

-- View for merchant performance analytics
CREATE OR REPLACE VIEW merchant_performance AS
SELECT 
    m.id,
    m.name,
    m.business_type,
    COUNT(DISTINCT mi.id) as total_menu_items,
    COUNT(DISTINCT o.id) as total_orders,
    COALESCE(SUM(o.total_amount), 0) as total_revenue,
    AVG(CASE WHEN o.status = 'completed' THEN o.total_amount END) as avg_order_value,
    COUNT(CASE WHEN o.created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as orders_last_30_days
FROM merchants m
LEFT JOIN menu_items mi ON m.id = mi.merchant_id
LEFT JOIN orders o ON m.id = o.merchant_id
GROUP BY m.id, m.name, m.business_type;

-- View for popular menu items across merchants
CREATE OR REPLACE VIEW popular_menu_items AS
SELECT 
    mi.id,
    mi.name,
    mi.category,
    mi.price,
    m.name as merchant_name,
    COUNT(o.id) as order_count,
    SUM(o.total_amount) as total_revenue
FROM menu_items mi
JOIN merchants m ON mi.merchant_id = m.id
LEFT JOIN orders o ON o.items::jsonb @> jsonb_build_array(jsonb_build_object('menu_item_id', mi.id))
GROUP BY mi.id, mi.name, mi.category, mi.price, m.name
ORDER BY order_count DESC;

-- View for city service availability
CREATE OR REPLACE VIEW city_services AS
SELECT 
    c.city_name,
    c.city_code,
    r.region_name,
    co.country_name,
    sc.category_name,
    lse.is_enabled,
    lse.delivery_radius_km,
    lse.min_order_amount,
    lse.commission_rate
FROM cities c
JOIN districts d ON c.district_id = d.id
JOIN regions r ON d.region_id = r.id
JOIN countries co ON r.country_id = co.id
JOIN location_service_enablement lse ON c.id = lse.city_id
JOIN service_categories sc ON lse.service_category_id = sc.id
WHERE c.is_active = true;

-- View for delivery zone coverage
CREATE OR REPLACE VIEW delivery_coverage AS
SELECT 
    c.city_name,
    dz.zone_name,
    dz.zone_type,
    dz.delivery_radius_km,
    dz.delivery_fee,
    dz.min_order_amount,
    dz.estimated_delivery_time_minutes
FROM delivery_zones dz
JOIN cities c ON dz.city_id = c.id
WHERE dz.is_active = true
ORDER BY c.city_name, dz.delivery_radius_km;

