import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SaaS Admin - Tenant",
  description: "Tenant admin portal for SaaS multi-tenant platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
