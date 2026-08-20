-- Recover visitor identities for sessions that began anonymously but later
-- recorded an authenticated event before session identity linking was fixed.
update public.analytics_sessions as session
set user_id = identified.user_id
from (
  select distinct on (session_id) session_id, user_id
  from public.analytics_events
  where user_id is not null
  order by session_id, occurred_at desc
) as identified
where session.session_id = identified.session_id
  and session.user_id is null;

