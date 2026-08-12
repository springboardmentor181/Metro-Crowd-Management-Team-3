import type { Metadata } from "next";
import "./globals.css";

import { ThemeProvider }from "@/providers/ThemeProvider";

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

    description:
      "AI Powered Smart Metro Management Platform",
  },

  robots: {
    index: true,
    follow: true,
  },

  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
    >
      <body>

        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >

          {children}

        </ThemeProvider>

      </body>
    </html>
  );
}