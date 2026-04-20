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

export function capture(event: string, properties?: Record<string, unknown>) {
  posthog.capture(event, properties);
}
