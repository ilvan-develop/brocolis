import { QueryProviders } from "@/components/providers";

export default function PortalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <QueryProviders>
      <div className="flex min-h-screen flex-col">
        <main className="flex flex-1 flex-col p-6">{children}</main>
      </div>
    </QueryProviders>
  );
}
