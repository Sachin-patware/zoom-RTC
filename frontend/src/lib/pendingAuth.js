const PENDING_SIGNUP_KEY = "zoomrtc_pending_signup";

export function storePendingSignup(payload) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(PENDING_SIGNUP_KEY, JSON.stringify(payload));
}

export function readPendingSignup() {
  if (typeof window === "undefined") return null;

  const raw = window.sessionStorage.getItem(PENDING_SIGNUP_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function clearPendingSignup() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(PENDING_SIGNUP_KEY);
}
