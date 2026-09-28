-- BiotechDaily Connect: message requests.
-- Run once in the Supabase dashboard (SQL Editor -> New query -> paste -> Run), after 0004_messages.sql.
--
-- Who can message whom (never across a block):
--   * Recipient under 18: only a mutual follow, always (unchanged from 0004).
--   * Recipient 18+:
--       - mutual follow: message freely;
--       - they have written to you: reply freely (replying accepts their request);
--       - you follow them but they don't follow you: ONE message (a "request") until they reply.
-- Requests show in the recipient's Requests tab instead of their inbox, and don't count as unread.

create or replace function public.can_message_between(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select a <> b and not public.is_blocked(a, b) and (
    case
      when public.is_minor(b) then
        exists (select 1 from public.follows where follower_id = a and following_id = b)
        and exists (select 1 from public.follows where follower_id = b and following_id = a)
      else
        -- mutual follow
        (exists (select 1 from public.follows where follower_id = a and following_id = b)
         and exists (select 1 from public.follows where follower_id = b and following_id = a))
        -- replying to someone who wrote to you
        or exists (select 1 from public.messages where sender_id = b and recipient_id = a)
        -- one request message to an adult you follow
        or (exists (select 1 from public.follows where follower_id = a and following_id = b)
            and not exists (select 1 from public.messages where sender_id = a and recipient_id = b))
    end
  );
$$;

-- Inbox now also says whether each conversation is a request: they wrote to me, I haven't written back,
-- and I don't follow them.
drop function if exists public.my_conversations();
create function public.my_conversations()
returns table (other_id uuid, last_body text, last_at timestamptz, last_sender uuid, unread bigint, is_request boolean)
language sql stable security invoker set search_path = public as $$
  with mine as (
    select case when sender_id = auth.uid() then recipient_id else sender_id end as other, *
    from public.messages
    where auth.uid() in (sender_id, recipient_id)
  ), latest as (
    select distinct on (other) other, body, created_at, sender_id from mine order by other, created_at desc
  )
  select l.other, l.body, l.created_at, l.sender_id,
    (select count(*) from mine m where m.other = l.other and m.recipient_id = auth.uid() and m.read_at is null),
    (not exists (select 1 from mine m where m.other = l.other and m.sender_id = auth.uid())
     and not exists (select 1 from public.follows f where f.follower_id = auth.uid() and f.following_id = l.other))
  from latest l
  order by l.created_at desc;
$$;
revoke execute on function public.my_conversations from public, anon;
grant execute on function public.my_conversations to authenticated;
