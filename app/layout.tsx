import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Newsreader, Karla, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/query-provider";
import { Toaster } from "@/components/ui/sonner";

// Editorial serif for names of things.
const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600"],
});

// Karla for sentences.
const karla = Karla({
  variable: "--font-karla",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Mono for data: times, prices, labels, distances.
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Wanderplan",
  description:
    "Day-by-day itineraries, bookings and photos, shared with everyone on the trip.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f1e8d5" },
    { media: "(prefers-color-scheme: dark)", color: "#211f1c" },
  ],
};

// Apply the saved theme before hydration to avoid a flash of the wrong one.
const themeScript = `(function(){try{var t=localStorage.getItem('theme');var m=window.matchMedia('(prefers-color-scheme: dark)').matches;if(t==='dark'||(!t&&m)){document.documentElement.classList.add('dark')}}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${newsreader.variable} ${karla.variable} ${jetbrainsMono.variable} bg-background text-foreground flex min-h-dvh flex-col antialiased`}
      >
        <Script id="theme-init" strategy="beforeInteractive">
          {themeScript}
        </Script>
        <QueryProvider>
          {children}
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  );
}
