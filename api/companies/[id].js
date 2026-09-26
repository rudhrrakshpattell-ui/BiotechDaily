import { json, notFound } from '../../server/http.js';
import { companies } from '../../src/data/companies.js';

export function GET(request) {
  const id = decodeURIComponent(new URL(request.url).pathname.split('/').pop());
  const company = companies.find((c) => c.id === id);
  return company ? json(company, { maxAge: 3600 }) : notFound('Company not found');
}
