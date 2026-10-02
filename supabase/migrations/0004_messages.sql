-- BiotechDaily Connect: direct messages between members who follow each other.
-- Run once in the Supabase dashboard (SQL Editor -> New query -> paste -> Run), after 0003_comments.sql.
--
-- Rules (enforced here):
--   * You can send a message only to someone you follow who follows you back, and neither has blocked the other.
--     If either unfollows or blocks, new messages stop; the history stays readable to both.
--   * Only the sender and recipient can read a message. Recipients can mark messages read; senders can delete
--     their own messages. Nobody can edit them.
--   * Reports keep a snapshot of the message, so evidence survives deletion. At most 100 messages per hour.

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  read_at timestamptz,
  created_at timestamptz not null default now(),
  check (sender_id <> recipient_id)
);
create index messages_pair_idx on public.messages (least(sender_id, recipient_id), greatest(sender_id, recipient_id), created_at desc);
create index messages_recipient_unread_idx on public.messages (recipient_id) where read_at is null;

-- Mutual follow and no block in either direction.
create or replace function public.can_message_between(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select a <> b
    and exists (select 1 from public.follows where follower_id = a and following_id = b)
    and exists (select 1 from public.follows where follower_id = b and following_id = a)
    and not public.is_blocked(a, b);
$$;

-- For the UI: can the signed-in member message this person right now?
create or replace function public.can_message(other uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and public.can_message_between(auth.uid(), other);
$$;
revoke execute on function public.can_message from public, anon;
grant execute on function public.can_message to authenticated;

alter table public.messages enable row level security;

create policy "participants read their messages" on public.messages for select
  using (auth.uid() in (sender_id, recipient_id) and not public.is_blocked(sender_id, recipient_id));

create policy "members message mutual follows" on public.messages for insert
  with check (sender_id = auth.uid() and public.can_message_between(sender_id, recipient_id));

create policy "recipients mark messages read" on public.messages for update
  using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());

create policy "senders delete their messages" on public.messages for delete using (sender_id = auth.uid());

revoke insert, update, delete on public.messages from anon;
revoke update on public.messages from authenticated;
grant update (read_at) on public.messages to authenticated;

-- At most 100 messages per member per hour.
create or replace function public.limit_messages() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.messages where sender_id = new.sender_id and created_at > now() - interval '1 hour') >= 100 then
    raise exception 'You''re sending messages too fast. Please wait a bit.' using errcode = 'P0001';
  end if;
  return new;
end $$;
create trigger messages_rate_limit before insert on public.messages for each row execute function public.limit_messages();

-- Inbox: one row per conversation partner with the latest message and unread count (RLS applies).
create or replace function public.my_conversations()
returns table (other_id uuid, last_body text, last_at timestamptz, last_sender uuid, unread bigint)
language sql stable security invoker set search_path = public as $$
  with mine as (
    select case when sender_id = auth.uid() then recipient_id else sender_id end as other, *
    from public.messages
    where auth.uid() in (sender_id, recipient_id)
  ), latest as (
    select distinct on (other) other, body, created_at, sender_id from mine order by other, created_at desc
  )
  select l.other, l.body, l.created_at, l.sender_id,
    (select count(*) from mine m where m.other = l.other and m.recipient_id = auth.uid() and m.read_at is null)
  from latest l
  order by l.created_at desc;
$$;
revoke execute on function public.my_conversations from public, anon;
grant execute on function public.my_conversations to authenticated;

-- Messages can be reported; the snapshot records sender, recipient and text.
alter table public.reports add column if not exists message_id uuid references public.messages (id) on delete set null;

drop policy if exists "members file reports as themselves" on public.reports;
create policy "members file reports as themselves" on public.reports for insert
  with check (
    reporter_id = auth.uid()
    and (post_id is not null or profile_id is not null or comment_id is not null or message_id is not null)
    -- Only a participant can report a private message.
    and (message_id is null or exists (select 1 from public.messages m where m.id = message_id))
  );

create or replace function public.snapshot_report() returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.snapshot := coalesce(
    (select format('Message from @%s to @%s: %s', s.username, r.username, m.body)
       from public.messages m join public.profiles s on s.id = m.sender_id join public.profiles r on r.id = m.recipient_id
       where m.id = new.message_id),
    (select format('Comment by @%s: %s', pr.username, c.body) from public.comments c join public.profiles pr on pr.id = c.author_id where c.id = new.comment_id),
    (select format('Post by @%s: %s', pr.username, p.body) from public.posts p join public.profiles pr on pr.id = p.author_id where p.id = new.post_id),
    (select format('Profile @%s (%s): %s', username, display_name, coalesce(bio, '')) from public.profiles where id = new.profile_id)
  );
  return new;
end $$;

-- Live updates: deliver new messages to the open chat and inbox (Realtime respects the RLS above).
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;
