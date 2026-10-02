-- BiotechDaily Connect: let members edit the text of their own posts.
-- Run once in the Supabase dashboard (SQL Editor -> New query -> paste -> Run), after 0001_connect.sql.
--
-- Only `body` is editable, so authors can't un-hide a post a moderator hid or change anything else.
-- Edits are stamped with edited_at (shown as "edited"); reports keep their original snapshot.

alter table public.posts add column if not exists edited_at timestamptz;

revoke update on public.posts from anon, authenticated;
grant update (body) on public.posts to authenticated;

create policy "members edit their own posts" on public.posts for update
  using (author_id = auth.uid()) with check (author_id = auth.uid());

create or replace function public.mark_post_edited() returns trigger language plpgsql as $$
begin
  if new.body is distinct from old.body then
    new.edited_at := now();
  end if;
  return new;
end $$;

create trigger posts_mark_edited before update on public.posts
  for each row execute function public.mark_post_edited();
