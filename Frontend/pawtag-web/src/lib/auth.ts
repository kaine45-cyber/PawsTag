const TOKEN_KEY = "pawtag_token";
const SESSION_KEY = "pawtag_session";

export const authStorage = {
  getToken:    () => localStorage.getItem(TOKEN_KEY),
  setToken:    (t: string) => localStorage.setItem(TOKEN_KEY, t),
  removeToken: () => localStorage.removeItem(TOKEN_KEY),
  getSession:  () => { try { const s = localStorage.getItem(SESSION_KEY); return s ? JSON.parse(s) : null; } catch { return null; } },
  setSession:  (s: object) => localStorage.setItem(SESSION_KEY, JSON.stringify(s)),
  clearAll:    () => { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(SESSION_KEY); },
};
