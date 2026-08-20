create or replace function public.record_analytics_session(
  p_session_id text,
  p_user_id uuid,
  p_started_at timestamptz,
  p_last_seen_at timestamptz,
  p_path text,
  p_referrer text,
  p_user_agent text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.analytics_sessions (
    session_id, user_id, started_at, last_seen_at, path, referrer, user_agent
  ) values (
    p_session_id, p_user_id, p_started_at, p_last_seen_at, p_path, p_referrer, p_user_agent
  )
  on conflict (session_id) do update set
    -- Never turn an identified customer back into an anonymous visitor while auth loads.
    user_id = coalesce(excluded.user_id, analytics_sessions.user_id),
    last_seen_at = excluded.last_seen_at,
    path = excluded.path,
    referrer = coalesce(analytics_sessions.referrer, excluded.referrer),
    user_agent = excluded.user_agent;

  if p_user_id is not null then
    update public.analytics_events
      set user_id = p_user_id
      where session_id = p_session_id and user_id is null;
  end if;
end;
$$;

revoke all on function public.record_analytics_session(text, uuid, timestamptz, timestamptz, text, text, text) from public;
grant execute on function public.record_analytics_session(text, uuid, timestamptz, timestamptz, text, text, text) to anon, authenticated;

