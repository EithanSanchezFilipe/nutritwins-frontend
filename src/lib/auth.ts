import { createAuthClient } from "better-auth/react";

// With the Vercel proxy, auth requests go through the same origin.
// Never use VITE_API_BASE_URL here — that would bypass the proxy.
const authBaseUrl = window.location.origin;

const withCredentials = (input: RequestInfo, init?: RequestInit) => {
  return fetch(input, { ...init, credentials: "include" });
};

export const authClient = createAuthClient({
  baseURL: authBaseUrl,
  fetch: withCredentials as any,
});

export const { signIn, signUp, useSession } = authClient;
