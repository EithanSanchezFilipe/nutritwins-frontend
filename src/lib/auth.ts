import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: window.location.origin, // Proxied through Vite to http://localhost:3000
});

export const { signIn, signUp, signOut, useSession } = authClient;
