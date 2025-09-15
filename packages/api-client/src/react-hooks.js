// React hooks for multi-country API integration
import { useCallback, useEffect, useState } from "react";
import { createCountryAPI } from "./country-api.js";

// Hook for country-specific API client
export function useCountryAPI(countryCode) {
  const [apiClient] = useState(() => createCountryAPI(countryCode));
  return apiClient;
}

// Hook for fetching country configuration
export function useCountryConfig(countryCode) {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const apiClient = useCountryAPI(countryCode);

  useEffect(() => {
    async function fetchConfig() {
      try {
        setLoading(true);
        const result = await apiClient.getCountryConfig();
        setConfig(result.country);
        setError(null);
      } catch (err) {
        setError(err.message);
        setConfig(null);
      } finally {
        setLoading(false);
      }
    }

    fetchConfig();
  }, [countryCode, apiClient]);

  return { config, loading, error };
}

// Hook for fetching restaurants by country
export function useRestaurants(countryCode, filters = {}) {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const apiClient = useCountryAPI(countryCode);

  const fetchRestaurants = useCallback(async () => {
    try {
      setLoading(true);
      const result = await apiClient.getLocations(filters);
      setRestaurants(result.restaurants || []);
      setError(null);
    } catch (err) {
      setError(err.message);
      setRestaurants([]);
    } finally {
      setLoading(false);
    }
  }, [countryCode, apiClient, JSON.stringify(filters)]);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  const searchRestaurants = useCallback(
    async (query, searchFilters = {}) => {
      try {
        setLoading(true);
        const result = await apiClient.searchRestaurants(query, searchFilters);
        setRestaurants(result.restaurants || []);
        setError(null);
      } catch (err) {
        setError(err.message);
        setRestaurants([]);
      } finally {
        setLoading(false);
      }
    },
    [apiClient]
  );

  return {
    restaurants,
    loading,
    error,
    refetch: fetchRestaurants,
    search: searchRestaurants,
  };
}

// Hook for country-specific merchant data
export function useMerchants(countryCode, filters = {}) {
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const apiClient = useCountryAPI(countryCode);

  useEffect(() => {
    async function fetchMerchants() {
      try {
        setLoading(true);
        const result = await apiClient.getMerchants(filters);
        setMerchants(result.merchants || []);
        setError(null);
      } catch (err) {
        setError(err.message);
        setMerchants([]);
      } finally {
        setLoading(false);
      }
    }

    fetchMerchants();
  }, [countryCode, apiClient, JSON.stringify(filters)]);

  return { merchants, loading, error };
}

// Hook for country-specific analytics
export function useCountryAnalytics(countryCode, timeframe = "7d") {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const apiClient = useCountryAPI(countryCode);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setLoading(true);
        const result = await apiClient.getCountryAnalytics(timeframe);
        setAnalytics(result);
        setError(null);
      } catch (err) {
        setError(err.message);
        setAnalytics(null);
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, [countryCode, timeframe, apiClient]);

  return { analytics, loading, error };
}

// Hook for payment methods by country
export function usePaymentMethods(countryCode) {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const apiClient = useCountryAPI(countryCode);

  useEffect(() => {
    async function fetchPaymentMethods() {
      try {
        setLoading(true);
        const methods = await apiClient.getPaymentMethods();
        setPaymentMethods(methods);
        setError(null);
      } catch (err) {
        setError(err.message);
        setPaymentMethods([]);
      } finally {
        setLoading(false);
      }
    }

    fetchPaymentMethods();
  }, [countryCode, apiClient]);

  return { paymentMethods, loading, error };
}

