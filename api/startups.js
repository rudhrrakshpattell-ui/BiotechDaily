import { getFundingRounds } from '../server/funding.js';
import { json, params } from '../server/http.js';
import { queryStartups } from '../src/services/queries.js';

export async function GET(request) {
  try {
    const { items } = await getFundingRounds();
    return json(queryStartups(items, params(request)));
  } catch (err) {
    // Never substitute the fictional sample startups for real data: show an empty tracker instead.
    console.error(err);
    return json([], { maxAge: 60 });
  }
}
