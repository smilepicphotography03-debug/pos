import type { Metadata, Viewport } from "next";
import "./globals.css";
import VisualEditsMessenger from "../visual-edits/VisualEditsMessenger";
import ErrorReporter from "@/components/ErrorReporter";
import Script from "next/script";
<<<<<<< HEAD
=======
import SWInit from "@/components/SWInit"; // <-- Correct placement
>>>>>>> 795026f (Enable PWA support and fix SW registration)

export const metadata: Metadata = {
  title: "Kumar Pooja Store POS",
  description: "Professional POS Billing System",
<<<<<<< HEAD
  manifest: "/manifest.json",
=======
  manifest: "/manifest.webmanifest",
>>>>>>> 795026f (Enable PWA support and fix SW registration)
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Kumar POS",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
<<<<<<< HEAD
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ErrorReporter />
=======
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* PWA Requirements */}
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="theme-color" content="#000000" />
      </head>

      <body className="antialiased">
        <SWInit /> {/* <-- Service Worker init */}

        <ErrorReporter />

>>>>>>> 795026f (Enable PWA support and fix SW registration)
        <Script
          src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts//route-messenger.js"
          strategy="afterInteractive"
          data-target-origin="*"
          data-message-type="ROUTE_CHANGE"
          data-include-search-params="true"
          data-only-in-iframe="true"
          data-debug="true"
          data-custom-data='{"appName": "YourApp", "version": "1.0.0", "greeting": "hi"}'
        />
<<<<<<< HEAD
=======

>>>>>>> 795026f (Enable PWA support and fix SW registration)
        {children}
        <VisualEditsMessenger />
      </body>
    </html>
  );
<<<<<<< HEAD
}
=======
}
>>>>>>> 795026f (Enable PWA support and fix SW registration)
