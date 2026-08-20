import type { Metadata } from "next";
import { Geist } from "next/font/google";

import { SiteHeader } from "@/src/presentation/layout/site-header";
import { UserMenu } from "@/src/presentation/layout/user-menu";
import { getCurrentPlayer } from "@/src/presentation/session/current-player";

import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export const metadata: Metadata = {
  title: "SplitScore",
  description: "Praćenje 2v2 mečeva i rang-liste.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // nijedna ruta ne može biti statički generirana (čitanje sesije - pokazuje se prijavljeni igrač)
  const player = await getCurrentPlayer();

  return (
    <html lang="hr" className={geist.variable}>
      <body className="min-h-screen font-sans antialiased">
        <SiteHeader
          userMenu={player ? <UserMenu player={player} /> : undefined}
        />
        <main
          data-testid="page-content"
          className="mx-auto w-full max-w-content px-4 py-8 sm:px-6 sm:py-12"
        >
          {children}
        </main>
      </body>
    </html>
  );
}
