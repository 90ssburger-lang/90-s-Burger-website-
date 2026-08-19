-- Let the anonymous tracker refresh its own session row. No visitor can read analytics.
CREATE POLICY "Anyone can update analytics sessions" ON public.analytics_sessions
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS analytics_sessions_last_seen_at_idx
  ON public.analytics_sessions (last_seen_at DESC);

CREATE INDEX IF NOT EXISTS analytics_events_session_occurred_idx
  ON public.analytics_events (session_id, occurred_at DESC);
