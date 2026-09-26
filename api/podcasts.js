import { getLivePodcasts } from '../server/podcasts.js';
import { json } from '../server/http.js';
import { podcasts as samplePodcasts } from '../src/data/podcasts.js';

export async function GET() {
  try {
    const { items } = await getLivePodcasts();
    return json(items, { maxAge: 1800 });
  } catch (err) {
    console.error(err);
    return json(samplePodcasts, { maxAge: 60 });
  }
}
