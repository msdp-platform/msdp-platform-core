# Location Database

This database manages the geographic hierarchy and service availability across different regions.

## 📊 Database: `msdp_location_db`

### Geographic Hierarchy

#### `countries` → `regions` → `districts` → `cities`
- **4-level hierarchy** for precise location management
- **Timezone and currency** support per country
- **Activation status** for gradual rollout

### Service Management

#### `service_categories`
- Food & Dining, Grocery & Retail, Local Services, Healthcare, Automotive

#### `location_service_enablement`
- **Per-city service activation**
- **Delivery radius configuration**
- **Commission rates and minimum orders**

#### `delivery_zones`
- **Zone-based delivery** (standard, premium, express)
- **Dynamic pricing** based on distance and zone type
- **Estimated delivery times**

#### `local_regulations`
- **Compliance management** per location
- **Operating hours and restrictions**
- **Tax rates and local laws**

### Sample Data
- **Countries**: US, Singapore, UK, Australia
- **Active Cities**: San Francisco, Los Angeles, New York, Singapore
- **Enabled Services**: Food and grocery in major cities
- **Delivery Zones**: Multiple zones per city with different pricing

## 🔗 Connected Service
- **Service**: location-service (port 3001)
- **API Endpoints**: `/api/locations/*`
- **Frontend**: All apps use location data

