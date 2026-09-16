import type { Metadata, Viewport } from "next";
import "./globals.css";

import { ThemeProvider } from "@/providers/ThemeProvider";
import { StateProvider } from "@/providers/StateProvider";
import { ReduxProvider } from "@/providers/ReduxProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export const metadata: Metadata = {
  title: {
    default: "MetroFlow AI",
    template: "%s | MetroFlow AI",
  },
  description:
    "AI Powered Smart Metro Management Platform for Passenger Analytics, Crowd Prediction, Smart Scheduling and Intelligent Metro Operations.",
  keywords: [
    "MetroFlow AI",
    "Metro",
    "Artificial Intelligence",
    "Smart Metro",
    "Passenger Analytics",
    "Crowd Prediction",
    "Metro Dashboard",
    "AI Dashboard",
    "Next.js",
    "Machine Learning",
  ],
  authors: [
    {
      name: "MetroFlow Team",
    },
  ],
  creator: "MetroFlow",
  publisher: "MetroFlow",
  metadataBase: new URL("https://metroflow.ai"),
  openGraph: {
    title: "MetroFlow AI",
    description:
      "Smart Metro Management Platform powered by Artificial Intelligence.",
    url: "https://metroflow.ai",
    siteName: "MetroFlow AI",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MetroFlow AI",
    description: "AI Powered Smart Metro Management Platform",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.ico",
  },
};

// Explicit viewport config so every screen - phones, foldables,
// tablets, and desktops - gets a 1:1 device-width layout instead of
// the browser's default "shrink the desktop layout to fit" mobile
// zoom-out behaviour. `viewportFit: "cover"` also lets us paint under
// notches/home-indicators on iOS/Android and handle that spacing
// ourselves with safe-area padding in globals.css.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ErrorBoundary label="MetroFlow">
          <ReduxProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <StateProvider>{children}</StateProvider>
            </ThemeProvider>
          </ReduxProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
