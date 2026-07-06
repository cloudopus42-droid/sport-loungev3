import { useState, useEffect, useCallback } from 'react';

export type CookieCategory = 'necessary' | 'analytics' | 'marketing' | 'functional';

export interface CookieConsent {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
}

const STORAGE_KEY = 'sl_cookie_consent';
const DEFAULT_CONSENT: CookieConsent = { necessary: true, analytics: false, marketing: false, functional: false };

export function useCookieConsent() {
  const [consent, setConsentState] = useState<CookieConsent>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    return DEFAULT_CONSENT;
  });
  const [isBannerVisible, setBannerVisible] = useState(false);

  useEffect(() => {
    const hasConsent = localStorage.getItem(STORAGE_KEY);
    if (!hasConsent) {
      setBannerVisible(true);
    }
  }, []);

  const setConsent = useCallback((newConsent: Partial<CookieConsent>) => {
    const merged = { ...consent, ...newConsent, necessary: true };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    setConsentState(merged);
    setBannerVisible(false);
    applyConsent(merged);
  }, [consent]);

  const acceptAll = useCallback(() => {
    const all: CookieConsent = { necessary: true, analytics: true, marketing: true, functional: true };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    setConsentState(all);
    setBannerVisible(false);
    applyConsent(all);
  }, []);

  const rejectAll = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CONSENT));
    setConsentState(DEFAULT_CONSENT);
    setBannerVisible(false);
    applyConsent(DEFAULT_CONSENT);
  }, []);

  const dismissBanner = useCallback(() => {
    setBannerVisible(false);
  }, []);

  return { consent, isBannerVisible, setConsent, acceptAll, rejectAll, dismissBanner };
}

function applyConsent(consent: CookieConsent) {
  if (typeof window === 'undefined') return;
  if (consent.analytics) {
    window.dispatchEvent(new CustomEvent('sl:consent:analytics', { detail: { enabled: true } }));
  }
  if (consent.marketing) {
    window.dispatchEvent(new CustomEvent('sl:consent:marketing', { detail: { enabled: true } }));
  }
}
