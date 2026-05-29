// Brand logo lockup. The source PNGs are opaque (cream bg for light, navy bg for
// dark), so we swap the variant to match the surface rather than relying on
// transparency. Swap is keyed on the manual data-theme toggle via .logo-on-* CSS.

/** Theme-aware horizontal logo. Light (navy-on-cream) on light surfaces, dark
 *  (white-on-navy) on dark surfaces. Size via `className` height (e.g. "h-7"). */
export function Logo({ className = "h-7", priority = false }: { className?: string; priority?: boolean }) {
  const loading = priority ? "eager" : "lazy";
  return (
    <span className={`inline-flex items-center ${className}`}>
      <img src="/brand/auralis-logo.png" alt="Auralis Finance" loading={loading} className="logo-on-light h-full w-auto" />
      <img src="/brand/auralis-logo-dark.png" alt="Auralis Finance" loading={loading} className="logo-on-dark h-full w-auto" />
    </span>
  );
}

/** The Auralis logo forced onto a permanently-dark surface (footer, dark CTA
 *  band) — always the navy/white variant regardless of theme. */
export function LogoOnDark({ className = "h-9" }: { className?: string }) {
  return <img src="/brand/auralis-logo-dark.png" alt="Auralis Finance" className={`w-auto ${className}`} />;
}
