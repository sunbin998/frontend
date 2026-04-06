import axios from "axios";
import type { TokenPair } from "./types";

const ACCESS_TOKEN_KEY = "gr_access_token";
const REFRESH_TOKEN_KEY = "gr_refresh_token";

function isBrowser(): boolean {
    return typeof window !== "undefined";
}

export function getAccessToken(): string | null {
    if (!isBrowser()) return null;
    return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
    if (!isBrowser()) return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setAuthTokens(accessToken: string, refreshToken: string): void {
    if (!isBrowser()) return;
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearAuthTokens(): void {
    if (!isBrowser()) return;
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
}

let refreshPromise: Promise<string | null> | null = null;

export async function refreshAuthTokens(): Promise<string | null> {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return null;

    if (refreshPromise) {
        return refreshPromise;
    }

    refreshPromise = (async () => {
        try {
            const response = await axios.post<TokenPair>("/api/auth/refresh", {
                refresh_token: refreshToken,
            }, {
                headers: { "Content-Type": "application/json" },
            });

            const { access_token, refresh_token } = response.data;
            setAuthTokens(access_token, refresh_token);
            return access_token;
        } catch {
            clearAuthTokens();
            return null;
        } finally {
            refreshPromise = null;
        }
    })();

    return refreshPromise;
}

export async function ensureValidAccessToken(): Promise<string | null> {
    const accessToken = getAccessToken();
    if (accessToken) return accessToken;
    return refreshAuthTokens();
}

export function redirectToLogin(): void {
    if (!isBrowser()) return;
    if (window.location.pathname !== "/login") {
        window.location.href = "/login";
    }
}
