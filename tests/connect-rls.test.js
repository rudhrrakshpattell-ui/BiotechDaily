// Runs supabase/migrations/*.sql in PGlite (Postgres in WebAssembly) with a minimal Supabase environment
// (auth + storage schemas, anon/authenticated roles) and checks the security rules as different users.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { citext } from '@electric-sql/pglite/contrib/citext';

// Every migration, in order, exactly as run in the Supabase SQL editor.
const MIGRATIONS_DIR = new URL('../supabase/migrations/', import.meta.url);
const MIGRATIONS = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql')).sort().map((f) => readFileSync(new URL(f, MIGRATIONS_DIR), 'utf8'));

const SUPABASE_STUB = `
  create role anon nologin; create role authenticated nologin;
  grant usage on schema public to anon, authenticated;
  -- Supabase grants table/function access broadly and relies on RLS; mirror its default privileges.
  alter default privileges in schema public grant all on tables to anon, authenticated;
  alter default privileges in schema public grant all on functions to anon, authenticated;
  alter default privileges in schema public grant all on sequences to anon, authenticated;

  create schema auth;
  grant usage on schema auth to anon, authenticated;
  create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant execute on function auth.uid() to anon, authenticated;

  create schema storage;
  grant usage on schema storage to anon, authenticated;
  create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
  create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets(id), name text, owner uuid);
  alter table storage.objects enable row level security;
  grant all on storage.objects to anon, authenticated;
  create function storage.foldername(name text) returns text[] language sql immutable as $$ select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;
  grant execute on function storage.foldername(text) to anon, authenticated;
`;

const db = new PGlite({ extensions: { citext } });
await db.exec(SUPABASE_STUB);
for (const sql of MIGRATIONS) await db.exec(sql);

const id = { adult: '11111111-1111-1111-1111-111111111111', minor: '22222222-2222-2222-2222-222222222222', other: '33333333-3333-3333-3333-333333333333', kid: '44444444-4444-4444-4444-444444444444' };
for (const [name, uid] of Object.entries(id)) await db.query('insert into auth.users (id, email) values ($1, $2)', [uid, `${name}@test.dev`]);

const years = (n) => { const d = new Date(); d.setFullYear(d.getFullYear() - n); return d.toISOString().slice(0, 10); };

// Run a query as a given user (null = signed out). Wrapped in a transaction so role changes don't leak.
async function as(uid, sql, params = []) {
  await db.exec('begin');
  try {
    await db.exec(uid ? `set local role authenticated; select set_config('request.jwt.claim.sub', '${uid}', true);` : `set local role anon; select set_config('request.jwt.claim.sub', '', true);`);
    const res = await db.query(sql, params);
    await db.exec('commit');
    return res.rows;
  } catch (err) {
    await db.exec('rollback');
    throw err;
  }
}
const fails = async (fn, re) => assert.rejects(fn, re);

test('onboarding enforces the 13+ minimum and creates private birth data', async () => {
  await fails(() => as(id.kid, `select * from create_profile('kiddo', 'Kid', $1)`, [years(12)]), /at least 13/);
  await as(id.adult, `select * from create_profile('Ada_L', 'Ada Lovelace', $1, 'MIT', 'PhD Bioengineering')`, [years(25)]);
  await as(id.minor, `select * from create_profile('teen_sci', 'Teen Scientist', $1, 'Lincoln High')`, [years(15)]);
  await as(id.other, `select * from create_profile('bob', 'Bob', $1)`, [years(30)]);
  const [ada] = await as(id.adult, `select username from profiles where id = $1`, [id.adult]);
  assert.equal(ada.username, 'ada_l', 'usernames are lowercased');
  await fails(() => as(id.other, `select * from create_profile('ADA_L', 'Copy', $1)`, [years(30)]), /taken|duplicate/);
});

test('signed-out visitors cannot call member-only functions', async () => {
  await fails(() => as(null, `select * from create_profile('anon', 'Anon', $1)`, [years(30)]), /permission denied/);
  await fails(() => as(null, `select delete_my_account()`), /permission denied/);
});

test('profiles cannot be inserted directly, and username/id cannot be changed', async () => {
  await fails(() => as(id.kid, `insert into profiles (id, username, display_name) values ($1, 'sneaky', 'S')`, [id.kid]), /permission denied/);
  await fails(() => as(id.adult, `update profiles set username = 'hacked' where id = $1`, [id.adult]), /permission denied/);
  const rows = await as(id.adult, `update profiles set bio = 'CRISPR nerd' where id = $1 returning bio`, [id.adult]);
  assert.equal(rows[0].bio, 'CRISPR nerd');
  const other = await as(id.other, `update profiles set bio = 'defaced' where id = $1 returning id`, [id.adult]);
  assert.equal(other.length, 0, 'cannot edit someone else’s profile');
});

test('birth dates are private to their owner', async () => {
  assert.equal((await as(id.adult, `select * from profile_private`)).length, 1);
  assert.equal((await as(id.other, `select * from profile_private where id = $1`, [id.adult])).length, 0);
  assert.equal((await as(null, `select * from profile_private`)).length, 0);
});

test('minors are visible to signed-in members only', async () => {
  const anonProfiles = (await as(null, `select username from profiles order by username`)).map((r) => r.username);
  assert.deepEqual(anonProfiles, ['ada_l', 'bob']);
  const memberProfiles = (await as(id.other, `select username from profiles order by username`)).map((r) => r.username);
  assert.deepEqual(memberProfiles, ['ada_l', 'bob', 'teen_sci']);
});

test('posts follow the same visibility; authors post only as themselves', async () => {
  await as(id.adult, `insert into posts (body) values ('Hello from Ada')`);
  await as(id.minor, `insert into posts (body) values ('Hello from a teen')`);
  await fails(() => as(id.other, `insert into posts (author_id, body) values ($1, 'impersonation')`, [id.adult]), /row-level security/);
  assert.deepEqual((await as(null, `select body from posts`)).map((r) => r.body), ['Hello from Ada']);
  assert.equal((await as(id.other, `select body from posts`)).length, 2);
  await fails(() => as(id.adult, `insert into posts (body) values ('   ')`), /check constraint/);
});

test('hidden posts are visible only to their author', async () => {
  await as(id.adult, `insert into posts (body) values ('to be hidden')`);
  await db.query(`update posts set hidden = true where body = 'to be hidden'`); // moderator action (superuser)
  assert.equal((await as(id.other, `select * from posts where body = 'to be hidden'`)).length, 0);
  assert.equal((await as(id.adult, `select * from posts where body = 'to be hidden'`)).length, 1);
});

test('follows: only as yourself, and hidden from the public when a minor is involved', async () => {
  await as(id.other, `insert into follows (follower_id, following_id) values ($1, $2)`, [id.other, id.minor]);
  await as(id.other, `insert into follows (follower_id, following_id) values ($1, $2)`, [id.other, id.adult]);
  await fails(() => as(id.other, `insert into follows (follower_id, following_id) values ($1, $2)`, [id.adult, id.other]), /row-level security/);
  assert.equal((await as(null, `select * from follows`)).length, 1, 'anon sees only adult-to-adult follows');
  const [stats] = await as(id.minor, `select * from profile_stats($1)`, [id.minor]);
  assert.equal(Number(stats.followers), 1);
});

test('comments: visibility follows the post and the commenter; only as yourself', async () => {
  const [adultPost] = await as(id.adult, `select id from posts where body = 'Hello from Ada'`);
  const [minorPost] = await as(id.minor, `select id from posts where body = 'Hello from a teen'`);
  await as(id.other, `insert into comments (post_id, body) values ($1, 'Great post, Ada')`, [adultPost.id]);
  await as(id.minor, `insert into comments (post_id, body) values ($1, 'Teen reply on Ada')`, [adultPost.id]);
  await as(id.other, `insert into comments (post_id, body) values ($1, 'Reply on teen post')`, [minorPost.id]);
  await fails(() => as(id.other, `insert into comments (post_id, author_id, body) values ($1, $2, 'impersonation')`, [adultPost.id, id.adult]), /row-level security/);
  await fails(() => as(id.other, `insert into comments (post_id, body) values ($1, '  ')`, [adultPost.id]), /check constraint/);
  await fails(() => as(null, `insert into comments (post_id, body) values ($1, 'anon')`, [adultPost.id]), /row-level security|permission denied/);
  // Public: only adult comments on adult posts.
  assert.deepEqual((await as(null, `select body from comments order by body`)).map((r) => r.body), ['Great post, Ada']);
  assert.equal((await as(id.other, `select * from comments`)).length, 3);
  // Nobody can edit comments.
  await fails(() => as(id.other, `update comments set body = 'changed' where body = 'Great post, Ada'`), /permission denied/);
});

test('comments: post owners can remove comments on their posts; others cannot', async () => {
  const [teen] = await as(id.adult, `select id from comments where body = 'Teen reply on Ada'`);
  assert.equal((await as(id.other, `delete from comments where id = $1 returning id`, [teen.id])).length, 0);
  assert.equal((await as(id.adult, `delete from comments where id = $1 returning id`, [teen.id])).length, 1);
  const [c] = await as(id.other, `select id from comments where body = 'Great post, Ada'`);
  await as(id.adult, `insert into reports (comment_id, reason) values ($1, 'spam')`, [c.id]);
  const snaps = (await db.query(`select snapshot from reports where comment_id = $1`, [c.id])).rows;
  assert.equal(snaps[0].snapshot, 'Comment by @bob: Great post, Ada');
  await db.query(`update comments set hidden = true where id = $1`, [c.id]);
  assert.equal((await as(id.adult, `select * from comments where id = $1`, [c.id])).length, 0, 'hidden from others');
  assert.equal((await as(id.other, `select * from comments where id = $1`, [c.id])).length, 1, 'author still sees it');
});

test('authors can edit only the text of their own posts', async () => {
  const [post] = await as(id.adult, `select id from posts where body = 'Hello from Ada'`);
  const [edited] = await as(id.adult, `update posts set body = 'Hello from Ada (edited)' where id = $1 returning body, edited_at`, [post.id]);
  assert.equal(edited.body, 'Hello from Ada (edited)');
  assert.ok(edited.edited_at, 'edited_at is stamped');
  const others = await as(id.other, `update posts set body = 'vandalized' where id = $1 returning id`, [post.id]);
  assert.equal(others.length, 0, 'cannot edit someone else’s post');
  await fails(() => as(id.adult, `update posts set hidden = false where id = $1`, [post.id]), /permission denied/);
  await fails(() => as(id.adult, `update posts set author_id = $2 where id = $1`, [post.id, id.other]), /permission denied/);
  await fails(() => as(id.adult, `update posts set edited_at = null where id = $1`, [post.id]), /permission denied/);
  await fails(() => as(id.adult, `update posts set body = '  ' where id = $1`, [post.id]), /check constraint/);
  // A moderator-hidden post stays hidden when its author edits it.
  const [hiddenPost] = await as(id.adult, `select id from posts where body = 'to be hidden'`);
  await as(id.adult, `update posts set body = 'edited while hidden' where id = $1`, [hiddenPost.id]);
  assert.equal((await as(id.other, `select * from posts where id = $1`, [hiddenPost.id])).length, 0);
  await as(id.adult, `update posts set body = 'Hello from Ada' where id = $1`, [post.id]); // restore for later tests
});

test('likes and reports', async () => {
  const [post] = await as(id.other, `select id from posts where body = 'Hello from Ada'`);
  await as(id.other, `insert into post_likes (post_id) values ($1)`, [post.id]);
  await fails(() => as(id.other, `insert into post_likes (post_id, user_id) values ($1, $2)`, [post.id, id.adult]), /row-level security/);
  await as(id.other, `insert into reports (post_id, reason) values ($1, 'spam')`, [post.id]);
  assert.equal((await as(id.other, `select * from reports`)).length, 0, 'reports are not readable by members');
  await fails(() => as(id.other, `insert into reports (reason) values ('spam')`), /row-level security/);
  const [r] = (await db.query(`select snapshot from reports where post_id = $1`, [post.id])).rows;
  assert.equal(r.snapshot, 'Post by @ada_l: Hello from Ada', 'report keeps evidence');
});

test('blocking hides both people from each other and removes follows', async () => {
  await as(id.minor, `insert into blocks (blocked_id) values ($1)`, [id.other]);
  assert.equal((await as(id.other, `select * from profiles where id = $1`, [id.minor])).length, 0);
  assert.equal((await as(id.other, `select * from posts where author_id = $1`, [id.minor])).length, 0);
  assert.equal((await as(id.minor, `select * from profiles where id = $1`, [id.other])).length, 0);
  assert.equal((await db.query(`select * from follows where following_id = $1`, [id.minor])).rows.length, 0, 'follow removed');
  await fails(() => as(id.other, `insert into follows (follower_id, following_id) values ($1, $2)`, [id.other, id.minor]), /row-level security/);
  const [minorPost] = (await db.query(`select id from posts where author_id = $1 limit 1`, [id.minor])).rows;
  await fails(() => as(id.other, `insert into comments (post_id, body) values ($1, 'still here?')`, [minorPost.id]), /row-level security/);
});

test('posting is rate-limited to 20 per hour', async () => {
  const [{ n }] = await as(id.other, `select count(*)::int as n from posts where author_id = $1`, [id.other]);
  for (let i = n; i < 20; i++) await as(id.other, `insert into posts (body) values ($1)`, [`post ${i}`]);
  await fails(() => as(id.other, `insert into posts (body) values ('one too many')`), /posting too fast/);
});

test('storage: members write only in their own folder', async () => {
  await as(id.adult, `insert into storage.objects (bucket_id, name) values ('avatars', $1)`, [`${id.adult}/me.jpg`]);
  await fails(() => as(id.adult, `insert into storage.objects (bucket_id, name) values ('avatars', $1)`, [`${id.other}/x.jpg`]), /row-level security/);
  await fails(() => as(null, `insert into storage.objects (bucket_id, name) values ('avatars', 'anon/x.jpg')`), /row-level security/);
  assert.equal((await as(id.other, `select * from storage.objects`)).length, 0, 'cannot list other members’ files');
});

test('deleting an account removes the profile and everything it owns', async () => {
  await as(id.adult, `select delete_my_account()`);
  const left = (await db.query(`select
    (select count(*) from auth.users where id = $1) +
    (select count(*) from profiles where id = $1) +
    (select count(*) from profile_private where id = $1) +
    (select count(*) from posts where author_id = $1) +
    (select count(*) from follows where following_id = $1) as n`, [id.adult])).rows[0].n;
  assert.equal(Number(left), 0);
  const [r] = (await db.query(`select post_id, snapshot from reports where snapshot like 'Post by%'`)).rows;
  assert.equal(r.post_id, null);
  assert.match(r.snapshot, /Hello from Ada/, 'evidence survives account deletion');
});
