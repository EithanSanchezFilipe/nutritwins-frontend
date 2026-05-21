import { createAuthClient } from "better-auth/react";

const authBaseUrl =
  import.meta.env.VITE_API_BASE_URL?.trim() || window.location.origin;

// Custom fetch that ensures credentials are sent for better-auth's own requests
const withCredentials = (input: RequestInfo, init?: RequestInit) => {
  return fetch(input, { ...init, credentials: "include" });
};

export const authClient = createAuthClient({
  baseURL: authBaseUrl,
  fetch: withCredentials as any,
});

export const { signIn, signUp, useSession } = authClient;
