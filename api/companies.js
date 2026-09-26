import { json, params } from '../server/http.js';
import { queryCompanies } from '../src/services/queries.js';
import { companies } from '../src/data/companies.js';

export function GET(request) {
  return json(queryCompanies(companies, params(request)), { maxAge: 3600 });
}
