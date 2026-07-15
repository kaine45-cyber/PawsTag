const LEGACY_TOKEN_KEY = "pawtag_token";
const SESSION_KEY = "pawtag_session";

export const authStorage = {
  getSession:  () => { try { const s = localStorage.getItem(SESSION_KEY); return s ? JSON.parse(s) : null; } catch { return null; } },
  setSession:  (s: object) => localStorage.setItem(SESSION_KEY, JSON.stringify(s)),
  clearAll:    () => { localStorage.removeItem(LEGACY_TOKEN_KEY); localStorage.removeItem(SESSION_KEY); },
};
