import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';

type ServiceCategory = { id: string; name: string; emoji: string };
type CityLocation = { countryCode: string; countryName: string; citySlug: string; cityName: string; availableCategories: string[] };

const CATEGORIES: ServiceCategory[] = [
  { id: 'food', name: 'Food Delivery', emoji: '🍔' },
  { id: 'grocery', name: 'Grocery Delivery', emoji: '🛒' },
  { id: 'pharmacy', name: 'Pharmacy', emoji: '💊' },
  { id: 'cleaning', name: 'Cleaning Services', emoji: '🧽' },
  { id: 'repairs', name: 'Repair Services', emoji: '🔧' },
  { id: 'other', name: 'More Services', emoji: '✨' },
];

const LOCATIONS: CityLocation[] = [
  { countryCode: 'GB', countryName: 'United Kingdom', citySlug: 'london', cityName: 'London', availableCategories: ['food','grocery','pharmacy','cleaning'] },
  { countryCode: 'US', countryName: 'United States', citySlug: 'austin', cityName: 'Austin', availableCategories: ['food','grocery','pharmacy'] },
];

function getLocationByParams(country: string, city: string): CityLocation | undefined {
  const c = country.toUpperCase();
  const slug = city.toLowerCase();
  return LOCATIONS.find(l => l.countryCode === c && l.citySlug === slug);
}

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  try {
    const route = event.routeKey || `GET ${event.rawPath || ''}`;
    const params = event.pathParameters || {};

    if (route.startsWith('GET /locations/') && params.country && params.city && !params.category) {
      const loc = getLocationByParams(params.country, params.city);
      if (!loc) return { statusCode: 404, body: JSON.stringify({ message: 'Not found' }) };
      const categories = CATEGORIES.filter(c => loc.availableCategories.includes(c.id));
      return { statusCode: 200, body: JSON.stringify({ location: loc, categories }) };
    }

    if (route.startsWith('GET /locations/') && params.country && params.city && params.category) {
      const loc = getLocationByParams(params.country, params.city);
      const cat = CATEGORIES.find(c => c.id === params.category);
      if (!loc || !cat) return { statusCode: 404, body: JSON.stringify({ message: 'Not found' }) };
      const items = Array.from({ length: 6 }).map((_, i) => ({
        id: `${params.category}-${i + 1}`,
        name: `${cat.emoji} ${cat.name.split(' ')[0]} Spot ${i + 1}`,
        eta: i % 2 === 0 ? '20–30m' : '30–45m',
        rating: 4 + ((i % 3) / 10),
      }));
      return { statusCode: 200, body: JSON.stringify({ location: loc, category: cat, items }) };
    }

    return { statusCode: 404, body: JSON.stringify({ message: 'Route not found' }) };
  } catch (err) {
    console.error('Handler error', err);
    return { statusCode: 500, body: JSON.stringify({ message: 'Internal Server Error' }) };
  }
}

