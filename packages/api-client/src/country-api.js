// Multi-Country API Client
// Provides country-specific API endpoints and data isolation

class CountryAPIClient {
  constructor(countryCode, baseURL = "http://localhost:3000") {
    this.countryCode = countryCode;
    this.baseURL = baseURL;
    this.apiPrefix = `/api/${countryCode}`;
  }

  // Helper method for making requests with country context
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const defaultHeaders = {
      "Content-Type": "application/json",
      "X-Country": this.countryCode,
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers: defaultHeaders,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error [${this.countryCode}]:`, error);
      throw error;
    }
  }

  // Country Configuration
  async getCountryConfig() {
    return this.request(`/api/countries/${this.countryCode}`);
  }

  async getAllCountries() {
    return this.request("/api/countries");
  }

  // Location Services
  async getLocations(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`${this.apiPrefix}/locations?${queryString}`);
  }

  async searchRestaurants(query, filters = {}) {
    return this.request(`${this.apiPrefix}/locations/restaurants/search`, {
      method: "POST",
      body: JSON.stringify({ query, filters, country: this.countryCode }),
    });
  }

  async getRestaurantsByCategory(category) {
    return this.request(
      `${this.apiPrefix}/locations/restaurants/category/${category}`
    );
  }

  async getRestaurantDetails(restaurantId) {
    return this.request(
      `${this.apiPrefix}/locations/restaurants/${restaurantId}`
    );
  }

  // Merchant Services
  async getMerchants(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`${this.apiPrefix}/merchants?${queryString}`);
  }

  async getMerchantProfile(merchantId) {
    return this.request(`${this.apiPrefix}/merchants/${merchantId}`);
  }

  async updateMerchantProfile(merchantId, data) {
    return this.request(`${this.apiPrefix}/merchants/${merchantId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async getMerchantMenu(merchantId) {
    return this.request(`${this.apiPrefix}/merchants/${merchantId}/menu`);
  }

  async updateMerchantMenu(merchantId, menuData) {
    return this.request(`${this.apiPrefix}/merchants/${merchantId}/menu`, {
      method: "PUT",
      body: JSON.stringify(menuData),
    });
  }

  // Country-specific features
  async getPaymentMethods() {
    const config = await this.getCountryConfig();
    return config.country.payment_methods;
  }

  async getComplianceRequirements() {
    const config = await this.getCountryConfig();
    return config.country.compliance;
  }

  async getCountryFeatures() {
    const config = await this.getCountryConfig();
    return config.country.features;
  }

  async getCurrencyInfo() {
    const config = await this.getCountryConfig();
    return {
      currency: config.country.currency,
      symbol: this.getCurrencySymbol(config.country.currency),
      format:
        config.country.cultural?.currency_symbol || config.country.currency,
    };
  }

  getCurrencySymbol(currency) {
    const symbols = {
      USD: "$",
      GBP: "£",
      EUR: "€",
      INR: "₹",
      SGD: "S$",
      JPY: "¥",
    };
    return symbols[currency] || currency;
  }

  // Orders (country-specific)
  async createOrder(orderData) {
    return this.request(`${this.apiPrefix}/orders`, {
      method: "POST",
      body: JSON.stringify({
        ...orderData,
        country: this.countryCode,
        currency: (await this.getCurrencyInfo()).currency,
      }),
    });
  }

  async getOrders(customerId) {
    return this.request(`${this.apiPrefix}/orders/customer/${customerId}`);
  }

  async getOrderStatus(orderId) {
    return this.request(`${this.apiPrefix}/orders/${orderId}/status`);
  }

  // Analytics (country-specific)
  async getCountryAnalytics(timeframe = "7d") {
    return this.request(`${this.apiPrefix}/analytics?timeframe=${timeframe}`);
  }

  async getPopularRestaurants(limit = 10) {
    return this.request(
      `${this.apiPrefix}/analytics/restaurants/popular?limit=${limit}`
    );
  }

  async getPopularDishes(limit = 10) {
    return this.request(
      `${this.apiPrefix}/analytics/dishes/popular?limit=${limit}`
    );
  }
}

// Factory function for creating country-specific API clients
export function createCountryAPI(countryCode) {
  return new CountryAPIClient(countryCode);
}

// Pre-configured clients for each country
export const USAAPI = new CountryAPIClient("usa");
export const IndiaAPI = new CountryAPIClient("india");
export const SingaporeAPI = new CountryAPIClient("singapore");
export const UKAPI = new CountryAPIClient("uk");

// Global API client (for admin operations)
export const GlobalAPI = new CountryAPIClient("global");

export default CountryAPIClient;

