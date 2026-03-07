import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Budget Setup - ledgr",
  description: "Set up your personal budget",
};

export default function SetupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Minimal header */}
      <header className="sticky top-0 z-50 border-b border-stone-200 bg-stone-50/95 backdrop-blur supports-[backdrop-filter]:bg-stone-50/60">
        <div className="mx-auto flex h-14 max-w-2xl items-center px-4">
          <span className="font-semibold text-stone-800">ledgr</span>
          <span className="mx-2 text-stone-300">·</span>
          <span className="text-stone-500">Budget Setup</span>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-2xl px-4 py-8">{children}</main>
    </div>
  );
}
