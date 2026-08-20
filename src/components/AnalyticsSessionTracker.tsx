import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { shouldTrackPageView, trackEvent, trackMetaPageView, trackSession } from "@/lib/analytics";

export function AnalyticsSessionTracker() {
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    const path = `${location.pathname}${location.search}`;
    trackSession({
      userId: user?.id ?? null,
      path,
    });
    if (!shouldTrackPageView(path)) return;
    trackMetaPageView();
    trackEvent("page_view", {
      userId: user?.id ?? null,
      path,
      metadata: { title: document.title },
    });
  }, [location.pathname, location.search, user?.id]);

  return null;
}
