export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export function setAuthTokens(tokens: AuthTokens): void {
  if (typeof document !== 'undefined') {
    const expires = new Date();
    expires.setTime(expires.getTime() + (tokens.expiresIn * 1000));
    
    document.cookie = `access_token=${tokens.accessToken}; expires=${expires.toUTCString()}; path=/; secure; samesite=strict`;
    document.cookie = `refresh_token=${tokens.refreshToken}; expires=${expires.toUTCString()}; path=/; secure; samesite=strict`;
  }
}

export function getAuthTokens(): AuthTokens | null {
  if (typeof document === 'undefined') {
    return null;
  }
  
  const cookies = document.cookie.split(';');
  let accessToken = '';
  let refreshToken = '';
  
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'access_token') accessToken = value;
    if (name === 'refresh_token') refreshToken = value;
  }
  
  if (accessToken && refreshToken) {
    return { accessToken, refreshToken, expiresIn: 900 };
  }
  
  return null;
}

export function clearAuthTokens(): void {
  if (typeof document !== 'undefined') {
    document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure; samesite=strict';
    document.cookie = 'refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure; samesite=strict';
  }
}
