-- Shared Database Triggers for MSDP Platform

-- Triggers to automatically update updated_at timestamps

-- For merchant database tables
-- (Apply these after importing merchant schema)
/*
CREATE TRIGGER update_merchants_updated_at 
    BEFORE UPDATE ON merchants 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menu_items_updated_at 
    BEFORE UPDATE ON menu_items 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON orders 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
*/

-- For location database tables
-- (Apply these after importing location schema)
/*
CREATE TRIGGER update_countries_updated_at 
    BEFORE UPDATE ON countries 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_regions_updated_at 
    BEFORE UPDATE ON regions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cities_updated_at 
    BEFORE UPDATE ON cities 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
*/

-- For admin database tables
-- (Apply these after importing admin schema)
/*
CREATE TRIGGER update_admin_users_updated_at 
    BEFORE UPDATE ON admin_users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
*/

-- Usage Instructions:
-- 1. Import shared functions first: psql [database] -f databases/shared/functions.sql
-- 2. Import this file: psql [database] -f databases/shared/triggers.sql
-- 3. Uncomment and run the triggers for each specific database

