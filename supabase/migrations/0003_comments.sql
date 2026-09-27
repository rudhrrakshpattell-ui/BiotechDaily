-- BiotechDaily Connect: comments on posts.
-- Run once in the Supabase dashboard (SQL Editor -> New query -> paste -> Run), after 0002_post_edits.sql.
--
-- Same safety model as posts: visible per can_view() (under-18 members only to signed-in members),
-- no commenting across a block, rate-limited, reportable. Post authors may remove comments on their posts.

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 500),
  hidden boolean not null default false, -- set by a moderator in the dashboard
  created_at timestamptz not null default now()
);
create index comments_post_created_idx on public.comments (post_id, created_at);
create index comments_author_idx on public.comments (author_id);

alter table public.comments enable row level security;

-- Visible if you can see the post (posts RLS applies inside the subquery) and its author.
create policy "comments are visible with their post" on public.comments for select
  using (
    (not hidden or author_id = auth.uid())
    and public.can_view(author_id)
    and exists (select 1 from public.posts p where p.id = post_id)
  );

create policy "members comment as themselves on posts they can see" on public.comments for insert
  with check (
    author_id = auth.uid()
    and exists (select 1 from public.posts p where p.id = post_id and not public.is_blocked(auth.uid(), p.author_id))
  );

-- Delete your own comments, or any comment on your own post.
create policy "authors and post owners delete comments" on public.comments for delete
  using (
    author_id = auth.uid()
    or exists (select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid())
  );

revoke update on public.comments from anon, authenticated;

-- At most 60 comments per member per hour.
create or replace function public.limit_comments() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.comments where author_id = new.author_id and created_at > now() - interval '1 hour') >= 60 then
    raise exception 'You''re commenting too fast. Please wait a bit.' using errcode = 'P0001';
  end if;
  return new;
end $$;
create trigger comments_rate_limit before insert on public.comments for each row execute function public.limit_comments();

-- Comments can be reported too.
alter table public.reports add column if not exists comment_id uuid references public.comments (id) on delete set null;

drop policy if exists "members file reports as themselves" on public.reports;
create policy "members file reports as themselves" on public.reports for insert
  with check (reporter_id = auth.uid() and (post_id is not null or profile_id is not null or comment_id is not null));

create or replace function public.snapshot_report() returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.snapshot := coalesce(
    (select format('Comment by @%s: %s', pr.username, c.body) from public.comments c join public.profiles pr on pr.id = c.author_id where c.id = new.comment_id),
    (select format('Post by @%s: %s', pr.username, p.body) from public.posts p join public.profiles pr on pr.id = p.author_id where p.id = new.post_id),
    (select format('Profile @%s (%s): %s', username, display_name, coalesce(bio, '')) from public.profiles where id = new.profile_id)
  );
  return new;
end $$;
