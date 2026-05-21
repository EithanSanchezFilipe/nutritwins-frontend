import { createAuthClient } from "better-auth/react";

// Patch global fetch to include credentials by default so third-party
// libraries (like better-auth) that don't set credentials still send cookies.
if (!(window as any).__nutritwins_fetch_patched) {
  const originalFetch = window.fetch.bind(window);
  (window as any).__nutritwins_fetch_patched = true;
  (window as any).fetch = (input: RequestInfo, init?: RequestInit) => {
    const merged: RequestInit = { ...(init || {}), credentials: (init && init.credentials) || "include" };
    return originalFetch(input, merged as RequestInit);
  };
}

const authBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() || window.location.origin;

export const authClient = createAuthClient({
  baseURL: authBaseUrl,
});

export const { signIn, signUp, signOut, useSession } = authClient;
