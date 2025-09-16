-- PostgreSQL-specific permission grants for Payment Service
-- This file contains the actual GRANT statements that work in PostgreSQL runtime

GRANT ALL ON ALL TABLES IN SCHEMA public TO msdp_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO msdp_user;
GRANT USAGE ON SCHEMA public TO msdp_user;
