// All Connect reads and writes. Row-level security decides what each call can see or change.
import { supabase } from './supabase.js';

const AUTHOR = 'author:profiles!posts_author_id_fkey(id, username, display_name, avatar_url, university, program)';
const POST_FIELDS = `id, body, image_url, created_at, author_id, ${AUTHOR}, likes:post_likes(count)`;
const PROFILE_CARD = 'id, username, display_name, avatar_url, university, program, bio, interests';
export const PAGE_SIZE = 15;

const unwrap = ({ data, error }) => {
  if (error) throw error;
  return data;
};

const normalizePost = (p) => ({ ...p, likeCount: p.likes?.[0]?.count ?? 0 });

// ---- profiles ----
export const getProfile = (username) =>
  supabase.from('profiles').select('*').eq('username', username.toLowerCase()).maybeSingle().then(unwrap);

export const getStats = (id) =>
  supabase.rpc('profile_stats', { uid: id }).single().then(unwrap);

export const createProfile = (fields) =>
  supabase.rpc('create_profile', {
    p_username: fields.username,
    p_display_name: fields.display_name,
    p_birth_date: fields.birth_date,
    p_university: fields.university,
    p_program: fields.program,
    p_bio: fields.bio,
    p_interests: fields.interests,
  }).then(unwrap);

export const updateProfile = (id, fields) =>
  supabase.from('profiles').update(fields).eq('id', id).select().single().then(unwrap);

export const isUsernameTaken = async (username) =>
  Boolean((await supabase.from('profiles').select('id').eq('username', username.toLowerCase()).maybeSingle()).data);

export const searchStudents = (q, limit = 20) => {
  const term = `%${q.replace(/[%_,()]/g, ' ').trim()}%`;
  return supabase
    .from('profiles')
    .select(PROFILE_CARD)
    .or(`username.ilike.${term},display_name.ilike.${term},university.ilike.${term},program.ilike.${term}`)
    .limit(limit)
    .then(unwrap);
};

// Newest members the viewer doesn't follow yet.
export async function suggestions(me, limit = 5) {
  const following = me ? await followingIds(me) : [];
  const exclude = [...following, ...(me ? [me] : [])];
  let query = supabase.from('profiles').select(PROFILE_CARD).order('created_at', { ascending: false }).limit(limit);
  if (exclude.length) query = query.not('id', 'in', `(${exclude.join(',')})`);
  return unwrap(await query);
}

// ---- follows ----
export const followingIds = async (me) =>
  unwrap(await supabase.from('follows').select('following_id').eq('follower_id', me)).map((r) => r.following_id);

export const isFollowing = async (me, id) =>
  Boolean(unwrap(await supabase.from('follows').select('follower_id').eq('follower_id', me).eq('following_id', id).maybeSingle()));

export const follow = (me, id) => supabase.from('follows').insert({ follower_id: me, following_id: id }).then(unwrap);
export const unfollow = (me, id) => supabase.from('follows').delete().eq('follower_id', me).eq('following_id', id).then(unwrap);

export async function listConnections(id, direction) {
  const [key, other] = direction === 'followers' ? ['following_id', 'follower_id'] : ['follower_id', 'following_id'];
  const rows = unwrap(
    await supabase.from('follows').select(`created_at, person:profiles!follows_${other}_fkey(${PROFILE_CARD})`).eq(key, id).order('created_at', { ascending: false }).limit(200),
  );
  return rows.map((r) => r.person).filter(Boolean);
}

// ---- posts ----
// feed: 'following' (people I follow + me), 'discover' (everyone), or { authorId }.
export async function listPosts({ feed, authorId, me, before, limit = PAGE_SIZE }) {
  let query = supabase.from('posts').select(POST_FIELDS).order('created_at', { ascending: false }).limit(limit);
  if (authorId) query = query.eq('author_id', authorId);
  if (feed === 'following') query = query.in('author_id', [...(await followingIds(me)), me]);
  if (before) query = query.lt('created_at', before);
  return unwrap(await query).map(normalizePost);
}

export async function likedPostIds(me, postIds) {
  if (!me || !postIds.length) return new Set();
  const rows = unwrap(await supabase.from('post_likes').select('post_id').eq('user_id', me).in('post_id', postIds));
  return new Set(rows.map((r) => r.post_id));
}

export const like = (postId) => supabase.from('post_likes').insert({ post_id: postId }).then(unwrap);
export const unlike = (me, postId) => supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', me).then(unwrap);

const extension = (file) => ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' })[file.type] ?? 'bin';

async function upload(bucket, me, file) {
  const path = `${me}/${crypto.randomUUID()}.${extension(file)}`;
  unwrap(await supabase.storage.from(bucket).upload(path, file, { contentType: file.type, cacheControl: '31536000' }));
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

// Storage path from a public URL: ".../object/public/<bucket>/<path>" -> "<path>".
const storagePath = (bucket, url) => url?.split(`/object/public/${bucket}/`)[1];

export async function createPost(me, { body, image }) {
  const image_url = image ? await upload('post-images', me, image) : null;
  const post = unwrap(await supabase.from('posts').insert({ author_id: me, body: body.trim(), image_url }).select(POST_FIELDS).single());
  return normalizePost(post);
}

export async function deletePost(post) {
  unwrap(await supabase.from('posts').delete().eq('id', post.id));
  const path = storagePath('post-images', post.image_url);
  if (path) await supabase.storage.from('post-images').remove([path]);
}

export async function setAvatar(me, file, previousUrl) {
  const url = await upload('avatars', me, file);
  const profile = await updateProfile(me, { avatar_url: url });
  const old = storagePath('avatars', previousUrl);
  if (old) await supabase.storage.from('avatars').remove([old]);
  return profile;
}

// ---- safety ----
export const report = ({ postId, profileId, reason, details }) =>
  supabase.from('reports').insert({ post_id: postId ?? null, profile_id: profileId ?? null, reason, details: details || null }).then(unwrap);

export const block = (id) => supabase.from('blocks').insert({ blocked_id: id }).then(unwrap);
export const unblock = (me, id) => supabase.from('blocks').delete().eq('blocker_id', me).eq('blocked_id', id).then(unwrap);
export const hasBlocked = async (me, id) =>
  Boolean(unwrap(await supabase.from('blocks').select('blocked_id').eq('blocker_id', me).eq('blocked_id', id).maybeSingle()));

// ---- account ----
export async function deleteAccount(me) {
  for (const bucket of ['avatars', 'post-images']) {
    const files = unwrap(await supabase.storage.from(bucket).list(me, { limit: 1000 }));
    if (files.length) await supabase.storage.from(bucket).remove(files.map((f) => `${me}/${f.name}`));
  }
  unwrap(await supabase.rpc('delete_my_account'));
  await supabase.auth.signOut();
}
