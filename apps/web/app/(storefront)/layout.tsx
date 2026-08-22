import type { Metadata } from "next";
import Link from "next/link";
import { CartLink } from "@/components/cart/cart-link";
import { StorefrontProviders } from "@/components/storefront/storefront-providers";

export const metadata: Metadata = {
  title: "Brócolis",
  description:
    "Marketplace farmacêutico multi-tenant — Angola-first, Africa by design.",
};

export default function StorefrontLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <StorefrontProviders>
      <main className="flex min-h-screen flex-col">
        <header className="border-b">
          <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
            <Link href="/" className="text-lg font-semibold tracking-tight">
              Brócolis
            </Link>
            <nav className="flex items-center gap-2" aria-label="Storefront">
              <CartLink />
            </nav>
          </div>
        </header>
        <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
          {children}
        </div>
      </main>
    </StorefrontProviders>
  );
}
