import Link from "next/link";

export function Header() {
  return (
    <header className="border-b border-zinc-800 bg-zinc-950">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="text-sm font-semibold tracking-tight text-zinc-50">
          Global Market Globe
        </Link>
        <nav aria-label="Primary" className="flex items-center gap-4 text-sm text-zinc-300">
          <Link href="/" className="hover:text-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 rounded">
            Globe
          </Link>
          <Link href="/about" className="hover:text-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 rounded">
            About &amp; Data
          </Link>
        </nav>
      </div>
    </header>
  );
}
