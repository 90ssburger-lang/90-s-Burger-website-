import { useQuery } from '@tanstack/react-query';
import { subDays } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

export type AnalyticsRange = 7 | 30 | 90;

const deviceFromAgent = (agent: string | null) => {
  if (!agent) return 'Unknown';
  if (/tablet|ipad/i.test(agent)) return 'Tablet';
  if (/mobile|android|iphone/i.test(agent)) return 'Mobile';
  return 'Desktop';
};

const sourceFromReferrer = (referrer: string | null) => {
  if (!referrer) return 'Direct';
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, '');
    if (/google\.|bing\.|yahoo\.|duckduckgo\./i.test(host)) return 'Search';
    if (/facebook\.|instagram\.|tiktok\.|t\.co|twitter\./i.test(host)) return 'Social';
    return host;
  } catch { return 'Other'; }
};

export function useAnalytics(range: AnalyticsRange) {
  return useQuery({
    queryKey: ['full-analytics', range],
    queryFn: async () => {
      const since = subDays(new Date(), range - 1).toISOString();
      const [sessionsResult, eventsResult] = await Promise.all([
        supabase.from('analytics_sessions').select('*').gte('started_at', since).order('started_at', { ascending: false }).limit(5000),
        supabase.from('analytics_events').select('*').gte('occurred_at', since).order('occurred_at', { ascending: false }).limit(10000),
      ]);
      if (sessionsResult.error) throw sessionsResult.error;
      if (eventsResult.error) throw eventsResult.error;

      const sessions = sessionsResult.data || [];
      const events = eventsResult.data || [];
      const userIds = [...new Set(sessions.map(s => s.user_id).filter(Boolean))] as string[];
      const profiles = userIds.length
        ? (await supabase.from('profiles').select('id, full_name, email').in('id', userIds)).data || []
        : [];
      const profileMap = new Map(profiles.map(p => [p.id, p]));
      const eventsBySession = new Map<string, typeof events>();
      events.forEach(event => eventsBySession.set(event.session_id, [...(eventsBySession.get(event.session_id) || []), event]));

      const visitors = sessions.map(session => {
        const activity = eventsBySession.get(session.session_id) || [];
        const profile = session.user_id ? profileMap.get(session.user_id) : undefined;
        const started = new Date(session.started_at).getTime();
        const ended = new Date(session.last_seen_at || session.started_at).getTime();
        return {
          ...session,
          name: profile?.full_name || (profile?.email ? profile.email.split('@')[0] : 'Anonymous visitor'),
          email: profile?.email || null,
          device: deviceFromAgent(session.user_agent),
          source: sourceFromReferrer(session.referrer),
          pageViews: activity.filter(e => e.event_type === 'page_view').length || 1,
          events: activity,
          durationSeconds: Math.max(0, Math.round((ended - started) / 1000)),
        };
      });

      const count = (type: string) => events.filter(e => e.event_type.toLowerCase() === type.toLowerCase()).length;
      const pageViews = count('page_view') || sessions.length;
      const purchases = count('Purchase');
      const addToCarts = count('AddToCart') + count('add_to_cart');
      const checkouts = count('InitiateCheckout');
      const grouped = (values: string[]) => Object.entries(values.reduce<Record<string, number>>((acc, value) => {
        acc[value] = (acc[value] || 0) + 1; return acc;
      }, {})).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));

      return {
        visitors,
        totals: { sessions: sessions.length, uniqueUsers: new Set(sessions.map(s => s.user_id || s.session_id)).size, pageViews, addToCarts, checkouts, purchases },
        conversionRate: sessions.length ? (purchases / sessions.length) * 100 : 0,
        bounceRate: sessions.length ? (visitors.filter(v => v.pageViews <= 1 && v.events.length <= 1).length / sessions.length) * 100 : 0,
        devices: grouped(visitors.map(v => v.device)),
        sources: grouped(visitors.map(v => v.source)),
        pages: grouped(events.filter(e => e.event_type === 'page_view').map(e => e.path || '/')).slice(0, 10),
      };
    },
  });
}
