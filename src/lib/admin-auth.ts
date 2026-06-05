// Admin auth using localStorage

const ADMIN_KEY = 'shielacom_admin_session';
const ADMIN_CREDENTIALS = { username: 'admin', password: 'Admin@12345' };

export function adminLogin(username: string, password: string): boolean {
  if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
    localStorage.setItem(ADMIN_KEY, JSON.stringify({ loggedIn: true, timestamp: Date.now() }));
    return true;
  }
  return false;
}

export function adminLogout(): void {
  localStorage.removeItem(ADMIN_KEY);
}

export function isAdminLoggedIn(): boolean {
  try {
    const session = localStorage.getItem(ADMIN_KEY);
    if (!session) return false;
    const parsed = JSON.parse(session);
    return parsed.loggedIn === true;
  } catch {
    return false;
  }
}
