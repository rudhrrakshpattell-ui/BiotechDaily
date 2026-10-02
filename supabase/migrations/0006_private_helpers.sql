-- BiotechDaily Connect: move internal helper functions out of the public API.
-- Run once in the Supabase dashboard (SQL Editor -> New query -> paste -> Run), after 0005_message_requests.sql.
--
-- Supabase's API (PostgREST) exposes every function in the `public` schema. The helpers below were meant only
-- for security policies, but being public let anyone ask e.g. is_minor(<member id>) and learn whether a member
-- is under 18. Moving them to a `private` schema takes them off the API. Policies keep working: they refer to
-- functions internally, not by name, and the querying roles keep permission to run them.

create schema if not exists private;
grant usage on schema private to anon, authenticated;

alter function public.is_minor(uuid) set schema private;
alter function public.is_blocked(uuid, uuid) set schema private;
alter function public.can_view(uuid) set schema private;
alter function public.can_message_between(uuid, uuid) set schema private;

-- Functions whose bodies call the moved helpers by name: point them at the new schema.
create or replace function private.can_view(owner uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select case
    when auth.uid() = owner then true
    when auth.uid() is null then not private.is_minor(owner)
    else not private.is_blocked(auth.uid(), owner)
  end;
$$;

create or replace function private.can_message_between(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select a <> b and not private.is_blocked(a, b) and (
    case
      when private.is_minor(b) then
        exists (select 1 from public.follows where follower_id = a and following_id = b)
        and exists (select 1 from public.follows where follower_id = b and following_id = a)
      else
        (exists (select 1 from public.follows where follower_id = a and following_id = b)
         and exists (select 1 from public.follows where follower_id = b and following_id = a))
        or exists (select 1 from public.messages where sender_id = b and recipient_id = a)
        or (exists (select 1 from public.follows where follower_id = a and following_id = b)
            and not exists (select 1 from public.messages where sender_id = a and recipient_id = b))
    end
  );
$$;

-- The one helper the app does call stays public; it only answers for the signed-in member.
create or replace function public.can_message(other uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and private.can_message_between(auth.uid(), other);
$$;

-- Security policies run as the querying role, which needs permission to execute these.
grant execute on all functions in schema private to anon, authenticated;
