// Multi-Country API Client Package
export {
  default as CountryAPIClient,
  GlobalAPI,
  IndiaAPI,
  SingaporeAPI,
  UKAPI,
  USAAPI,
  createCountryAPI,
} from "./country-api.js";

// React hooks for country-specific API calls
export {
  useCountryAPI,
  useCountryConfig,
  useRestaurants,
} from "./react-hooks.js";

