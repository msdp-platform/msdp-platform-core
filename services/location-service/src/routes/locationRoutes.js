const express = require("express");
const router = express.Router();
const { requireRole } = require("../middleware/auth");
const locationController = require("../controllers/locationController");

// Countries
router.get("/countries", locationController.getCountries);
router.post(
  "/countries",
  requireRole(["admin", "super_admin"]),
  locationController.createCountry
);
router.put(
  "/countries/:id",
  requireRole(["admin", "super_admin"]),
  locationController.updateCountry
);
router.delete(
  "/countries/:id",
  requireRole(["super_admin"]),
  locationController.deleteCountry
);

// Regions
router.get("/countries/:countryId/regions", locationController.getRegions);
router.post(
  "/regions",
  requireRole(["admin", "super_admin"]),
  locationController.createRegion
);
router.put(
  "/regions/:id",
  requireRole(["admin", "super_admin"]),
  locationController.updateRegion
);
router.delete(
  "/regions/:id",
  requireRole(["super_admin"]),
  locationController.deleteRegion
);

// Districts
router.get("/regions/:regionId/districts", locationController.getDistricts);
router.post(
  "/districts",
  requireRole(["admin", "super_admin"]),
  locationController.createDistrict
);
router.put(
  "/districts/:id",
  requireRole(["admin", "super_admin"]),
  locationController.updateDistrict
);
router.delete(
  "/districts/:id",
  requireRole(["super_admin"]),
  locationController.deleteDistrict
);

// Cities
router.get("/districts/:districtId/cities", locationController.getCities);
router.get("/cities", locationController.getAllCities);
router.post(
  "/cities",
  requireRole(["admin", "super_admin"]),
  locationController.createCity
);
router.put(
  "/cities/:id",
  requireRole(["admin", "super_admin"]),
  locationController.updateCity
);
router.delete(
  "/cities/:id",
  requireRole(["super_admin"]),
  locationController.deleteCity
);

// Location Service Enablement
router.get("/cities/:cityId/services", locationController.getCityServices);
router.post(
  "/cities/:cityId/services/:serviceId/enable",
  requireRole(["admin", "super_admin"]),
  locationController.enableServiceInCity
);
router.delete(
  "/cities/:cityId/services/:serviceId/disable",
  requireRole(["admin", "super_admin"]),
  locationController.disableServiceInCity
);

// Delivery Zones
router.get(
  "/cities/:cityId/delivery-zones",
  locationController.getDeliveryZones
);
router.post(
  "/cities/:cityId/delivery-zones",
  requireRole(["admin", "super_admin"]),
  locationController.createDeliveryZone
);
router.put(
  "/delivery-zones/:id",
  requireRole(["admin", "super_admin"]),
  locationController.updateDeliveryZone
);
router.delete(
  "/delivery-zones/:id",
  requireRole(["super_admin"]),
  locationController.deleteDeliveryZone
);

// Local Regulations
router.get(
  "/cities/:cityId/regulations",
  locationController.getLocalRegulations
);
router.post(
  "/cities/:cityId/regulations",
  requireRole(["admin", "super_admin"]),
  locationController.createLocalRegulation
);
router.put(
  "/regulations/:id",
  requireRole(["admin", "super_admin"]),
  locationController.updateLocalRegulation
);
router.delete(
  "/regulations/:id",
  requireRole(["super_admin"]),
  locationController.deleteLocalRegulation
);

module.exports = router;
