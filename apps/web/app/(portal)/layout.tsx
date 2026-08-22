import { PortalProviders } from "@/components/portal/portal-providers";

export default function PortalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <PortalProviders>
      <div className="flex min-h-screen flex-col">
        <main className="flex flex-1 flex-col p-6">{children}</main>
      </div>
    </PortalProviders>
  );
}
