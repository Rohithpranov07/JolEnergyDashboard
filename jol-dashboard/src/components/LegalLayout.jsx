import Link from "next/link";

function BoltMark() {
  return (
    <span
      className="flex h-9 w-9 items-center justify-center rounded-xl"
      style={{
        background: "linear-gradient(135deg, #2270BB 0%, #0E3D6E 100%)",
        boxShadow:
          "0 4px 14px rgba(24,95,165,0.35), inset 0 1px 0 rgba(255,255,255,0.4)",
      }}
    >
      <svg width="16" height="16" viewBox="0 0 14 14" fill="none" aria-hidden>
        <path
          d="M8 1.5L3.5 7.5H7L6 12.5L11 6.5H7.5L8 1.5Z"
          fill="white"
          stroke="white"
          strokeWidth="0.3"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

const FOOTER_LINKS = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/contact", label: "Contact" },
  { href: "/dashboard", label: "Dashboard" },
];

/**
 * Shared chrome for the Privacy / Terms / Contact pages. Server component —
 * light glass aesthetic consistent with the rest of the app.
 */
export default function LegalLayout({ title, updated, children, bare = false }) {
  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{ background: "var(--bg-page)" }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(55vw 45vw at 15% -10%, rgba(24,95,165,0.10), transparent 60%), radial-gradient(45vw 40vw at 100% 0%, rgba(16,185,138,0.08), transparent 60%)",
        }}
      />

      {/* Top bar */}
      <header className="relative z-10 mx-auto flex max-w-3xl items-center justify-between px-5 pt-6">
        <Link href="/" className="flex items-center gap-2.5">
          <BoltMark />
          <span className="text-[15px] font-bold tracking-[-0.02em] text-[var(--text-primary)]">
            Jol Energy
          </span>
        </Link>
        <Link
          href="/login"
          className="rounded-full px-3.5 py-1.5 text-[13px] font-semibold text-[#185FA5] transition-colors hover:bg-[rgba(24,95,165,0.08)]"
        >
          Sign in
        </Link>
      </header>

      {/* Content */}
      <main className="relative z-10 mx-auto max-w-3xl px-5 py-10 sm:py-12">
        <Link
          href="/"
          className="text-[13px] font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text-secondary)]"
        >
          ← Back to home
        </Link>

        <h1 className="mt-4 text-[28px] font-bold tracking-[-0.02em] text-[var(--text-primary)] sm:text-[32px]">
          {title}
        </h1>
        {updated && (
          <p className="mt-1 text-[13px] text-[var(--text-muted)]">
            Last updated {updated}
          </p>
        )}

        {bare ? (
          <div className="mt-6">{children}</div>
        ) : (
          <div
            className="glass-card mt-6 p-6 sm:p-8 text-[var(--text-secondary)]
              [&_a]:text-[#185FA5] [&_a]:underline [&_a]:underline-offset-2
              [&_h2:first-child]:mt-0 [&_h2]:mt-7 [&_h2]:mb-2 [&_h2]:text-[16.5px] [&_h2]:font-bold [&_h2]:tracking-[-0.01em] [&_h2]:text-[var(--text-primary)]
              [&_li]:text-[14px] [&_li]:leading-relaxed
              [&_p]:mb-3 [&_p]:text-[14px] [&_p]:leading-relaxed
              [&_strong]:font-semibold [&_strong]:text-[var(--text-primary)]
              [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5"
          >
            {children}
          </div>
        )}

        {/* Footer */}
        <footer className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[var(--border-default)] pt-6 text-[13px]">
          {FOOTER_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
            >
              {l.label}
            </Link>
          ))}
          <span className="ml-auto text-[var(--text-muted)]">
            © 2026 Jol Energy Pvt. Ltd.
          </span>
        </footer>
      </main>
    </div>
  );
}
