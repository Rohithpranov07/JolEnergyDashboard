"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";

/**
 * Gate for authenticated-only routes. While Firebase resolves the initial auth
 * state we show a loader; once resolved, an unauthenticated visitor is sent to
 * /login with a `next` param so they return here after signing in.
 *
 * Note: this is a client-side guard. Firebase web auth lives in the browser, so
 * the page still ships to the client — it just won't render protected content
 * without a user. That's the right model for a public BI demo.
 */
export default function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      const next = encodeURIComponent(pathname || "/dashboard");
      router.replace(`/login?next=${next}`);
    }
  }, [loading, user, pathname, router]);

  if (loading || !user) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: "var(--bg-page)" }}
      >
        <div
          aria-label="Loading"
          style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            border: "3px solid rgba(24,95,165,0.18)",
            borderTopColor: "#185FA5",
            animation: "spin 700ms linear infinite",
          }}
        />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return children;
}
