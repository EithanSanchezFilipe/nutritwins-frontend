import { useEffect, useState } from "react";
import { useSession as useBetterAuthSession } from "../lib/auth";

/**
 * Custom session hook that checks localStorage token first,
 * then falls back to better-auth's useSession (cookie-based).
 * This enables token-based auth (from Vercel/prod) while supporting
 * cookie-based auth in development.
 */
export const useCustomSession = () => {
  const [session, setSession] = useState<any>(null);
  const [isPending, setIsPending] = useState(true);

  // Always call better-auth hook (required for React), but we may not use the result
  const betterAuthSession = useBetterAuthSession();

  useEffect(() => {
    const token = localStorage.getItem("auth_token");

    if (token) {
      // Token exists in localStorage → user is logged in via token-based auth
      console.log(
        "[useCustomSession] Token found in localStorage, skipping better-auth",
      );
      setSession({ user: { id: "token-based-user" } });
      setIsPending(false);
    } else if (betterAuthSession.data) {
      // No token but have better-auth session (cookie-based)
      console.log("[useCustomSession] Using better-auth session from cookies");
      setSession(betterAuthSession.data);
      setIsPending(betterAuthSession.isPending);
    } else if (betterAuthSession.isPending) {
      // Still loading from better-auth
      setIsPending(true);
    } else {
      // No token and no session
      console.log("[useCustomSession] No session found");
      setSession(null);
      setIsPending(false);
    }
  }, [betterAuthSession.data, betterAuthSession.isPending]);

  return { data: session, isPending };
};
