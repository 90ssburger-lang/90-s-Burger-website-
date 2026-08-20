import { supabase } from "@/integrations/supabase/client";

const SESSION_ID_KEY = "90s_burger_session_id";
const SESSION_LAST_SEEN_KEY = "90s_burger_session_last_seen";
const SESSION_STARTED_AT_KEY = "90s_burger_session_started_at";
const LAST_TRACKED_PAGE_KEY = "90s_burger_last_tracked_page";
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

type MetaEvent = 'ViewContent' | 'AddToCart' | 'InitiateCheckout' | 'Purchase';
declare global { interface Window { fbq?: (...args: unknown[]) => void; } }

/** Browser Pixel hook. The same event payload can be forwarded server-side to Meta CAPI. */
export const trackMetaEvent = (event: MetaEvent, data: Record<string, unknown> = {}, eventId?: string) => {
  if (typeof window === 'undefined') return;
  const id = eventId || (crypto.randomUUID?.() ?? `evt_${Date.now()}`);
  window.fbq?.('track', event, data, { eventID: id });
  trackEvent(event, { metadata: { ...data, event_id: id, source: 'website' } });
  window.dispatchEvent(new CustomEvent('meta-commerce-event', { detail: { event, eventId: id, data } }));
};

export const trackMetaPageView = () => {
  if (typeof window === 'undefined') return;
  window.fbq?.('track', 'PageView');
};

export type SessionTrackingPayload = {
  session_id: string;
  user_id?: string | null;
  started_at: string;
  last_seen_at?: string | null;
  path?: string | null;
  referrer?: string | null;
  user_agent?: string | null;
};

export type AnalyticsEventPayload = {
  event_type: string;
  session_id: string;
  user_id?: string | null;
  occurred_at: string;
  path?: string | null;
  product_id?: string | null;
  metadata?: Record<string, unknown> | null;
};

const getStorage = () => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

const generateSessionId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `sess_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
};

const recordSession = async (payload: SessionTrackingPayload) => {
  try {
    const { error } = await supabase.rpc("record_analytics_session", {
      p_session_id: payload.session_id,
      p_user_id: payload.user_id ?? null,
      p_started_at: payload.started_at,
      p_last_seen_at: payload.last_seen_at || new Date().toISOString(),
      p_path: payload.path ?? null,
      p_referrer: payload.referrer ?? null,
      p_user_agent: payload.user_agent ?? null,
    });

    if (error) {
      console.warn("Analytics session insert failed", error.message);
    }
  } catch (error) {
    console.warn("Analytics session insert failed", error);
  }
};

const ensureSession = (options?: { userId?: string | null; path?: string }) => {
  if (typeof window === "undefined") return null;

  const storage = getStorage();
  if (!storage) return null;

  const now = Date.now();
  const lastSeen = Number(storage.getItem(SESSION_LAST_SEEN_KEY) || 0);
  let sessionId = storage.getItem(SESSION_ID_KEY);
  const isExpired = !sessionId || !lastSeen || now - lastSeen > SESSION_TIMEOUT_MS;

  if (isExpired) {
    sessionId = generateSessionId();
    storage.setItem(SESSION_ID_KEY, sessionId);
    storage.setItem(SESSION_STARTED_AT_KEY, new Date(now).toISOString());
  }

  storage.setItem(SESSION_LAST_SEEN_KEY, String(now));

  if (sessionId) {
    void recordSession({
      session_id: sessionId,
      user_id: options?.userId ?? null,
      started_at: storage.getItem(SESSION_STARTED_AT_KEY) || new Date(now).toISOString(),
      last_seen_at: new Date(now).toISOString(),
      path: options?.path ?? `${window.location.pathname}${window.location.search}`,
      referrer: document.referrer || null,
      user_agent: navigator.userAgent,
    });
  }

  return sessionId;
};

export const trackSession = (options?: { userId?: string | null; path?: string }) => {
  ensureSession(options);
};

/** A reload or auth-state refresh on the same URL is not a new page view. */
export const shouldTrackPageView = (path: string) => {
  if (typeof window === "undefined") return false;
  try {
    const previousPath = window.sessionStorage.getItem(LAST_TRACKED_PAGE_KEY);
    window.sessionStorage.setItem(LAST_TRACKED_PAGE_KEY, path);
    return previousPath !== path;
  } catch {
    return true;
  }
};

export const trackEvent = (
  eventType: string,
  options?: { userId?: string | null; path?: string; productId?: string | null; metadata?: Record<string, unknown> }
) => {
  if (typeof window === "undefined") return;

  const sessionId = ensureSession({ userId: options?.userId, path: options?.path });
  if (!sessionId) return;

  const payload: AnalyticsEventPayload = {
    event_type: eventType,
    session_id: sessionId,
    user_id: options?.userId ?? null,
    occurred_at: new Date().toISOString(),
    path: options?.path ?? `${window.location.pathname}${window.location.search}`,
    product_id: options?.productId ?? null,
    metadata: options?.metadata ?? null,
  };

  supabase
    .from("analytics_events")
    .insert(payload)
    .then(({ error }) => {
      if (error) {
        console.warn("Analytics event insert failed", error.message);
      }
    })
    .catch((error) => {
      console.warn("Analytics event insert failed", error);
    });
};
