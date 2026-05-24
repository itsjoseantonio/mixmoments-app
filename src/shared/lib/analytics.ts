import posthog from 'posthog-js';

export function initAnalytics(key: string, host?: string) {
  posthog.init(key, {
    api_host: host ?? 'https://us.i.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: true,
  });
}

export function identify(userId: string) {
  posthog.identify(userId);
}

// Debounce repeated calls for the same event (e.g. song_configured fires on every drag/keystroke)
const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();

export function capture(event: string, properties?: Record<string, unknown>) {
  const pending = debounceTimers.get(event);
  if (pending) clearTimeout(pending);
  debounceTimers.set(
    event,
    setTimeout(() => {
      debounceTimers.delete(event);
      posthog.capture(event, properties);
    }, 300),
  );
}
