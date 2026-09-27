// All Connect reads and writes. Row-level security decides what each call can see or change.
import { supabase } from './supabase.js';

const AUTHOR = 'author:profiles!posts_author_id_fkey(id, username, display_name, avatar_url, university, program)';
// `*` rather than a column list so new columns (like edited_at) don't break older databases.
const POST_FIELDS_BASE = `*, ${AUTHOR}, likes:post_likes(count)`;
const POST_FIELDS_WITH_COMMENTS = `${POST_FIELDS_BASE}, comments(count)`;
// Comment counts need migration 0003; until it's applied, PostgREST reports the relationship as missing.
let commentsAvailable = true;
const postFields = () => (commentsAvailable ? POST_FIELDS_WITH_COMMENTS : POST_FIELDS_BASE);

// Runs a posts query, retrying once without comment counts if the comments table doesn't exist yet.
async function queryPosts(build) {
  let result = await build(postFields());
  if (result.error && commentsAvailable && /comments/.test(result.error.message ?? '')) {
    commentsAvailable = false;
    result = await build(postFields());
  }
  return unwrap(result);
}
const PROFILE_CARD = 'id, username, display_name, avatar_url, university, program, bio, interests';
export const PAGE_SIZE = 15;

const unwrap = ({ data, error }) => {
  if (error) throw error;
  return data;
};

const normalizePost = (p) => ({ ...p, likeCount: p.likes?.[0]?.count ?? 0, commentCount: p.comments?.[0]?.count ?? 0 });

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
  const ids = feed === 'following' ? [...(await followingIds(me)), me] : null;
  const rows = await queryPosts((fields) => {
    let query = supabase.from('posts').select(fields).order('created_at', { ascending: false }).limit(limit);
    if (authorId) query = query.eq('author_id', authorId);
    if (ids) query = query.in('author_id', ids);
    if (before) query = query.lt('created_at', before);
    return query;
  });
  return rows.map(normalizePost);
}

export async function getPost(id) {
  const row = await queryPosts((fields) => supabase.from('posts').select(fields).eq('id', id).maybeSingle());
  return row ? normalizePost(row) : null;
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
  const post = await queryPosts((fields) => supabase.from('posts').insert({ author_id: me, body: body.trim(), image_url }).select(fields).single());
  return normalizePost(post);
}

// Only the text can change (enforced in the database); returns the updated post.
export async function updatePost(id, body) {
  return normalizePost(await queryPosts((fields) => supabase.from('posts').update({ body: body.trim() }).eq('id', id).select(fields).single()));
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

// ---- comments ----
const COMMENT_FIELDS = 'id, body, created_at, post_id, author_id, author:profiles!comments_author_id_fkey(id, username, display_name, avatar_url)';

export const listComments = (postId) =>
  supabase.from('comments').select(COMMENT_FIELDS).eq('post_id', postId).order('created_at', { ascending: true }).limit(200).then(unwrap);

export const addComment = (me, postId, body) =>
  supabase.from('comments').insert({ author_id: me, post_id: postId, body: body.trim() }).select(COMMENT_FIELDS).single().then(unwrap);

export const deleteComment = (id) => supabase.from('comments').delete().eq('id', id).then(unwrap);

// ---- direct messages ----
// Allowed only between mutual follows with no block (enforced in the database).
export const canMessage = (otherId) => supabase.rpc('can_message', { other: otherId }).then(unwrap);

// People I follow who follow me back: the people I can start a conversation with.
export async function mutualFollows(me) {
  const following = await followingIds(me);
  if (!following.length) return [];
  const back = unwrap(await supabase.from('follows').select('follower_id').eq('following_id', me).in('follower_id', following)).map((r) => r.follower_id);
  if (!back.length) return [];
  return unwrap(await supabase.from('profiles').select(PROFILE_CARD).in('id', back).order('display_name'));
}

// Inbox: latest message per person, with unread counts. Conversations with people you can't see
// (blocked, or deleted accounts) are dropped.
export async function listConversations() {
  const rows = unwrap(await supabase.rpc('my_conversations'));
  if (!rows.length) return [];
  const people = unwrap(await supabase.from('profiles').select(PROFILE_CARD).in('id', rows.map((r) => r.other_id)));
  const byId = new Map(people.map((p) => [p.id, p]));
  return rows.filter((r) => byId.has(r.other_id)).map((r) => ({ ...r, unread: Number(r.unread), person: byId.get(r.other_id) }));
}

export async function listMessages(me, otherId, limit = 200) {
  const rows = unwrap(
    await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${me},recipient_id.eq.${otherId}),and(sender_id.eq.${otherId},recipient_id.eq.${me})`)
      .order('created_at', { ascending: false })
      .limit(limit),
  );
  return rows.reverse();
}

export const sendMessage = (me, otherId, body) =>
  supabase.from('messages').insert({ sender_id: me, recipient_id: otherId, body: body.trim() }).select().single().then(unwrap);

export const markConversationRead = (me, otherId) =>
  supabase.from('messages').update({ read_at: new Date().toISOString() }).eq('recipient_id', me).eq('sender_id', otherId).is('read_at', null).then(unwrap);

export const deleteMessage = (id) => supabase.from('messages').delete().eq('id', id).then(unwrap);

export async function unreadMessageCount(me) {
  const { count, error } = await supabase.from('messages').select('id', { count: 'exact', head: true }).eq('recipient_id', me).is('read_at', null);
  if (error) throw error;
  return count ?? 0;
}

// Calls onMessage(row) for each new message sent to me, live. Returns an unsubscribe function.
export function subscribeToMessages(me, onMessage) {
  const channel = supabase
    .channel(`messages-to-${me}-${Math.random().toString(36).slice(2)}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `recipient_id=eq.${me}` }, (payload) => onMessage(payload.new))
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}

// ---- safety ----
export const report = ({ postId, profileId, commentId, messageId, reason, details }) =>
  supabase
    .from('reports')
    .insert({
      post_id: postId ?? null,
      profile_id: profileId ?? null,
      ...(commentId ? { comment_id: commentId } : {}),
      ...(messageId ? { message_id: messageId } : {}),
      reason,
      details: details || null,
    })
    .then(unwrap);

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
