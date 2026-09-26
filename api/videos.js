import { getLiveVideos } from '../server/videos.js';
import { json, params } from '../server/http.js';
import { queryVideos } from '../src/services/queries.js';
import { videos as sampleVideos } from '../src/data/videos.js';

export async function GET(request) {
  const p = params(request);
  try {
    const { items } = await getLiveVideos();
    return json(queryVideos(items, p), { maxAge: 1800 });
  } catch (err) {
    console.error(err);
    return json(queryVideos(sampleVideos, p), { maxAge: 60 });
  }
}
