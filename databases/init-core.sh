#!/bin/bash
echo "🗄️  Setting up core platform databases..."

# Location service database
if [ -f "location/schema.sql" ]; then
    echo "Setting up location service database..."
    createdb msdp_location_db 2>/dev/null || true
    psql msdp_location_db -f location/schema.sql
fi

# Merchant service database  
if [ -f "merchant/schema.sql" ]; then
    echo "Setting up merchant service database..."
    createdb msdp_merchant 2>/dev/null || true
    psql msdp_merchant -f merchant/schema.sql
fi

echo "✅ Core platform databases setup complete"
