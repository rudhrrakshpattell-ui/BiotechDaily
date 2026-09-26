import { json } from '../server/http.js';
import { podcasts } from '../src/data/podcasts.js';

export function GET() {
  return json(podcasts, { maxAge: 3600 });
}
