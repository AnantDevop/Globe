import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About & Data — Global Market Globe",
  description: "What Global Market Globe shows, how market status and data freshness work, and important disclaimers.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-zinc-50">{title}</h2>
      <div className="space-y-2 text-sm leading-6 text-zinc-300">{children}</div>
    </section>
  );
}

export default function AboutPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-50">About &amp; Data</h1>
        <p className="mt-2 text-sm text-zinc-400">
          What this site is, how to read market status and data freshness, and what it is not.
        </p>
      </div>

      <Section title="What this is">
        <p>
          Global Market Globe is a public, read-only visualization of major stock-market index
          levels around the world, shown on an interactive 3D globe. It has no accounts, no
          logins, and no trading functionality.
        </p>
      </Section>

      <Section title="What this is not">
        <p>
          This site does not offer trading, order placement, broker connections, portfolios, or
          investment recommendations. Nothing on this site is investment advice. Data shown here
          should not be the sole basis for any financial decision. Always verify figures with an
          official exchange or licensed provider before acting on them.
        </p>
      </Section>

      <Section title="Market status">
        <p>A market&apos;s status reflects its configured trading session and timezone, independent of whether a quote is currently available:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>Open</strong> — within the exchange&apos;s regular trading hours.</li>
          <li><strong>Closed</strong> — outside regular trading hours on an ordinary trading day.</li>
          <li><strong>Pre-market / Post-market</strong> — reserved for markets with configured extended-hours sessions.</li>
          <li><strong>Holiday</strong> — the exchange is closed for a configured holiday.</li>
          <li><strong>Unavailable</strong> — status could not be determined (e.g. misconfiguration).</li>
        </ul>
        <p className="text-zinc-500">
          Holiday calendars are configuration-driven and, in this phase, may be incomplete.
          Production holiday calendars must be validated against an authoritative exchange-calendar
          source before being relied upon.
        </p>
      </Section>

      <Section title="Data freshness">
        <p>Every instrument quote carries a data status describing how current it is:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>Live</strong> — updated within the live-data threshold (typically the last ~15 seconds).</li>
          <li><strong>Delayed</strong> — the provider marks the quote as delayed, or its age exceeds the live threshold but is still within an acceptable window.</li>
          <li><strong>Stale</strong> — the quote is older than the staleness threshold and should not be treated as current.</li>
          <li><strong>End of day</strong> — a prior session&apos;s closing value.</li>
          <li><strong>Demo data</strong> — generated fixture data used for development and demonstration; never shown in production.</li>
          <li><strong>Unavailable</strong> — no valid quote currently exists for this instrument.</li>
        </ul>
        <p>
          The last successful data-synchronization time is always shown alongside the data. Values
          that are unavailable are shown as &ldquo;—&rdquo;, never as zero.
        </p>
      </Section>

      <Section title="Data provider">
        <p>
          Market data provider attribution: <em>to be finalized</em>. This site is built to work
          with multiple market-data providers behind a common interface; INDstocks/INDmoney is the
          intended initial provider for Indian markets, subject to confirming its available
          instrument coverage. Provider credentials are never exposed to your browser — all
          provider calls happen server-side.
        </p>
      </Section>

      <Section title="No investment advice">
        <p>
          Global Market Globe does not provide investment, financial, tax, or legal advice, and is
          not a broker-dealer or investment adviser. Use of this site does not create any advisory
          relationship.
        </p>
      </Section>
    </div>
  );
}
