export function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950 py-4">
      <div className="mx-auto max-w-6xl px-4 text-xs text-zinc-500 sm:px-6">
        <p>
          Market data is for informational purposes only and does not constitute investment
          advice. See the{" "}
          <a href="/about" className="underline hover:text-zinc-300">
            About &amp; Data
          </a>{" "}
          page for data-source and freshness details.
        </p>
      </div>
    </footer>
  );
}
