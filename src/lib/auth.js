// --------------------------------------------------------------------------
// Small helper so we're not repeating localStorage calls everywhere. We
// store the JWT in localStorage so it survives a page refresh (the staff
// member shouldn't have to log in again every time they reload /admin).
//
// This is a REAL deployed app (not a Claude Artifact preview), so
// localStorage is the normal, correct tool here - unlike in-chat preview
// artifacts, this code runs in an actual browser you control.
// --------------------------------------------------------------------------

const TOKEN_KEY = 'trainee_platform_admin_token';

export function saveToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function isLoggedIn() {
  return Boolean(getToken());
}