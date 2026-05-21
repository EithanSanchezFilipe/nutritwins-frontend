import { createAuthClient } from "better-auth/react";

const authBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() || window.location.origin;

export const authClient = createAuthClient({
  baseURL: authBaseUrl,
  fetchOptions: {
    credentials: "include",
  },
});

export const { signIn, signUp, signOut, useSession } = authClient;
