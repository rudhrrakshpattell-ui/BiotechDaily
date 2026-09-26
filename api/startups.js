import { json, params } from '../server/http.js';
import { queryStartups } from '../src/services/queries.js';
import { startups } from '../src/data/startups.js';

export function GET(request) {
  return json(queryStartups(startups, params(request)), { maxAge: 3600 });
}
