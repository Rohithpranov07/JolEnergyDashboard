import { Geist } from "next/font/google";
import "leaflet/dist/leaflet.css";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata = {
  title: "Jol Energy — Business Intelligence Dashboard",
  description:
    "Live BI dashboard for Jol Energy: supplier & buyer pipelines, collection network, battery-metal market intelligence, and AI insights.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full" suppressHydrationWarning>{children}</body>
    </html>
  );
}
