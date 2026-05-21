import { useEffect, useState } from "react";
import { useSession as useBetterAuthSession } from "../lib/auth";

/**
 * Custom session hook that checks localStorage token first,
 * then falls back to better-auth's useSession (cookie-based).
 * This enables token-based auth (from Vercel/prod) while supporting
 * cookie-based auth in development.
 */
export const useCustomSession = () => {
  const betterAuthSession = useBetterAuthSession();
  const [session, setSession] = useState(betterAuthSession.data);
  const [isPending, setIsPending] = useState(betterAuthSession.isPending);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");

    if (token) {
      // Token exists in localStorage → user is logged in via token-based auth
      // Return a minimal session object to satisfy the app's requirements
      console.log("[useCustomSession] Token found in localStorage");
      setSession({ user: { id: "token-based-user" } } as any);
      setIsPending(false);
    } else {
      // No token → fall back to better-auth session (cookie-based)
      console.log("[useCustomSession] No token, using better-auth session");
      setSession(betterAuthSession.data);
      setIsPending(betterAuthSession.isPending);
    }
  }, [betterAuthSession.data, betterAuthSession.isPending]);

  return { data: session, isPending };
};
