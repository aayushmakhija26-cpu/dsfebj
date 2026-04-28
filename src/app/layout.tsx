import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "CREDAI Pune Member Portal",
    template: "%s | CREDAI Pune",
  },
  description:
    "Official membership application and management portal for CREDAI Pune — the apex body of real-estate developers in Pune.",
  keywords: ["CREDAI", "Pune", "real estate", "membership", "developer association"],
  authors: [{ name: "CREDAI Pune" }],
  creator: "CREDAI Pune",
  robots: {
    index: false, // Portal is not public — do not index
    follow: false,
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#1B3A6B",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fontSans.variable} ${fontMono.variable} min-h-screen bg-background font-sans antialiased`}
      >
        {/* Skip navigation for keyboard/screen-reader users */}
        <a href="#main-content" className="skip-nav">
          Skip to main content
        </a>

        <main id="main-content">{children}</main>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
