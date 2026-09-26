import { json, params } from '../server/http.js';
import { queryVideos } from '../src/services/queries.js';
import { videos } from '../src/data/videos.js';

export function GET(request) {
  return json(queryVideos(videos, params(request)), { maxAge: 3600 });
}
