-- BiotechDaily Connect: student profiles, follows, posts, likes, blocks and reports.
-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste this file -> Run.
--
-- Safety model (enforced here with row-level security, not just in the UI):
--   * Members must be 13+. Birth dates live in profile_private, readable only by their owner.
--   * Under-18 profiles, their posts and their follow lists are visible only to signed-in members.
--   * Blocking hides both people's profiles and posts from each other and prevents following.
--   * Posting is rate-limited; reports go to the reports table for review in the dashboard.

create extension if not exists citext;

-- ---------------------------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username citext not null unique check (username ~ '^[a-z0-9_]{3,20}$'),
  display_name text not null check (char_length(display_name) between 1 and 60),
  university text check (char_length(university) <= 100),
  program text check (char_length(program) <= 100),
  bio text check (char_length(bio) <= 280),
  interests text[] not null default '{}' check (cardinality(interests) <= 8),
  avatar_url text check (avatar_url is null or avatar_url ~ '^https://'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Private data, readable only by its owner.
create table public.profile_private (
  id uuid primary key references public.profiles (id) on delete cascade,
  birth_date date not null,
  accepted_guidelines_at timestamptz not null default now()
);

create table public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);
create index follows_following_idx on public.follows (following_id);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 1000),
  image_url text check (image_url is null or image_url ~ '^https://'),
  hidden boolean not null default false, -- set by a moderator in the dashboard
  created_at timestamptz not null default now()
);
create index posts_author_created_idx on public.posts (author_id, created_at desc);
create index posts_created_idx on public.posts (created_at desc);

create table public.post_likes (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
create index post_likes_user_idx on public.post_likes (user_id);

create table public.blocks (
  blocker_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  post_id uuid references public.posts (id) on delete set null,
  profile_id uuid references public.profiles (id) on delete set null,
  reason text not null check (reason in ('spam', 'harassment', 'inappropriate', 'misinformation', 'impersonation', 'other')),
  details text check (char_length(details) <= 500),
  -- What was reported, captured at report time, so the evidence survives if the post or account is deleted.
  snapshot text,
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------------------------
-- Helper functions (security definer so policies can consult private data)
-- ---------------------------------------------------------------------------------------------

create or replace function public.is_minor(uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select birth_date > (current_date - interval '18 years') from public.profile_private where id = uid), true);
$$;

-- True if either user has blocked the other.
create or replace function public.is_blocked(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.blocks
    where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a)
  );
$$;

-- Whether the current viewer (signed in or not) may see this member's profile and content.
create or replace function public.can_view(owner uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select case
    when auth.uid() = owner then true
    when auth.uid() is null then not public.is_minor(owner)
    else not public.is_blocked(auth.uid(), owner)
  end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.profile_private enable row level security;
alter table public.follows enable row level security;
alter table public.posts enable row level security;
alter table public.post_likes enable row level security;
alter table public.blocks enable row level security;
alter table public.reports enable row level security;

create policy "profiles are visible per can_view" on public.profiles for select using (public.can_view(id));
create policy "members update their own profile" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
-- Profiles are created only through create_profile() (age check). Username and id can't be changed.
revoke insert, update on public.profiles from anon, authenticated;
grant update (display_name, university, program, bio, interests, avatar_url, updated_at) on public.profiles to authenticated;

create policy "owners read their private data" on public.profile_private for select using (id = auth.uid());
revoke insert, update, delete on public.profile_private from anon, authenticated;

create policy "follows are visible when both people are" on public.follows for select
  using (public.can_view(follower_id) and public.can_view(following_id));
create policy "members follow as themselves" on public.follows for insert
  with check (follower_id = auth.uid() and not public.is_blocked(follower_id, following_id));
create policy "members unfollow as themselves" on public.follows for delete using (follower_id = auth.uid());

create policy "posts are visible per can_view" on public.posts for select
  using ((not hidden or author_id = auth.uid()) and public.can_view(author_id));
create policy "members post as themselves" on public.posts for insert with check (author_id = auth.uid());
create policy "members delete their own posts" on public.posts for delete using (author_id = auth.uid());

create policy "likes are visible with their post" on public.post_likes for select
  using (exists (select 1 from public.posts p where p.id = post_id) and public.can_view(user_id));
create policy "members like as themselves" on public.post_likes for insert
  with check (user_id = auth.uid() and exists (select 1 from public.posts p where p.id = post_id));
create policy "members unlike as themselves" on public.post_likes for delete using (user_id = auth.uid());

create policy "members see their own blocks" on public.blocks for select using (blocker_id = auth.uid());
create policy "members block as themselves" on public.blocks for insert with check (blocker_id = auth.uid());
create policy "members unblock as themselves" on public.blocks for delete using (blocker_id = auth.uid());

create policy "members file reports as themselves" on public.reports for insert
  with check (reporter_id = auth.uid() and (post_id is not null or profile_id is not null));
-- No select policy: reports are reviewed in the Supabase dashboard (Table Editor -> reports).

-- ---------------------------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------------------------

-- Blocking someone also removes follows in both directions.
create or replace function public.on_block() returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from public.follows
  where (follower_id = new.blocker_id and following_id = new.blocked_id)
     or (follower_id = new.blocked_id and following_id = new.blocker_id);
  return new;
end $$;
create trigger blocks_remove_follows after insert on public.blocks for each row execute function public.on_block();

-- At most 20 posts per member per hour.
create or replace function public.limit_posts() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.posts where author_id = new.author_id and created_at > now() - interval '1 hour') >= 20 then
    raise exception 'You''re posting too fast. Please wait a bit.' using errcode = 'P0001';
  end if;
  return new;
end $$;
create trigger posts_rate_limit before insert on public.posts for each row execute function public.limit_posts();

-- Record what was reported (post text, or profile name and bio) for moderators.
create or replace function public.snapshot_report() returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.snapshot := coalesce(
    (select format('Post by @%s: %s', pr.username, p.body) from public.posts p join public.profiles pr on pr.id = p.author_id where p.id = new.post_id),
    (select format('Profile @%s (%s): %s', username, display_name, coalesce(bio, '')) from public.profiles where id = new.profile_id)
  );
  return new;
end $$;
create trigger reports_snapshot before insert on public.reports for each row execute function public.snapshot_report();

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------------------------
-- RPCs
-- ---------------------------------------------------------------------------------------------

-- Onboarding: creates the caller's profile after checking they're 13+.
create or replace function public.create_profile(
  p_username text, p_display_name text, p_birth_date date,
  p_university text default null, p_program text default null, p_bio text default null, p_interests text[] default '{}'
) returns public.profiles language plpgsql security definer set search_path = public as $$
declare created public.profiles;
begin
  if auth.uid() is null then raise exception 'Please sign in first.' using errcode = 'P0001'; end if;
  if p_birth_date is null or p_birth_date > current_date - interval '13 years' then
    raise exception 'You must be at least 13 to join BiotechDaily Connect.' using errcode = 'P0001';
  end if;
  if p_birth_date < current_date - interval '100 years' then
    raise exception 'Please check your date of birth.' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.profiles where username = lower(p_username)) then
    raise exception 'That username is taken.' using errcode = 'P0001';
  end if;
  insert into public.profiles (id, username, display_name, university, program, bio, interests)
  values (auth.uid(), lower(p_username), btrim(p_display_name), nullif(btrim(p_university), ''), nullif(btrim(p_program), ''),
          nullif(btrim(p_bio), ''), coalesce(p_interests, '{}'))
  returning * into created;
  insert into public.profile_private (id, birth_date) values (auth.uid(), p_birth_date);
  return created;
end $$;
-- Functions are executable by PUBLIC by default; restrict to signed-in members.
revoke execute on function public.create_profile from public, anon;
grant execute on function public.create_profile to authenticated;

-- Follower / following / post counts, respecting visibility.
create or replace function public.profile_stats(uid uuid)
returns table (followers bigint, following bigint, posts bigint) language sql stable security invoker set search_path = public as $$
  select
    (select count(*) from public.follows where following_id = uid),
    (select count(*) from public.follows where follower_id = uid),
    (select count(*) from public.posts where author_id = uid);
$$;

-- Deletes the caller's account and everything they created. Uploaded files are removed by the app first.
create or replace function public.delete_my_account() returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Please sign in first.' using errcode = 'P0001'; end if;
  delete from auth.users where id = auth.uid();
end $$;
revoke execute on function public.delete_my_account from public, anon;
grant execute on function public.delete_my_account to authenticated;

-- ---------------------------------------------------------------------------------------------
-- Storage: profile photos and post images (public read; members write only in their own folder)
-- ---------------------------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp']),
  ('post-images', 'post-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do nothing;

-- Deleting or listing files requires select as well (public URLs are readable without it).
create policy "members see their own files" on storage.objects for select to authenticated
  using (bucket_id in ('avatars', 'post-images') and (storage.foldername(name))[1] = auth.uid()::text);
create policy "members upload to their own folder" on storage.objects for insert to authenticated
  with check (bucket_id in ('avatars', 'post-images') and (storage.foldername(name))[1] = auth.uid()::text);
create policy "members replace their own files" on storage.objects for update to authenticated
  using (bucket_id in ('avatars', 'post-images') and (storage.foldername(name))[1] = auth.uid()::text);
create policy "members delete their own files" on storage.objects for delete to authenticated
  using (bucket_id in ('avatars', 'post-images') and (storage.foldername(name))[1] = auth.uid()::text);
