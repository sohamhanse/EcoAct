export function trackEvent(name: string, payload?: Record<string, unknown>) {
  if (__DEV__) {
    // Local analytics stub for MVP without backend integration.
    console.log(`[Analytics] ${name}`, payload ?? {});
  }
}
