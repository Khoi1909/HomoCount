import { Geist, Geist_Mono } from "next/font/google";
import Header from "@/components/Header";
import "./globals.css";

// Use correct font function names
const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata = {
  title: "HomoCount - Real-time Detection",
  description: "Live CCTV human head detection and counting system.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      {/* Apply base body styles */}
      <body className={`antialiased bg-gray-950 text-gray-100`}> 
        <Header />
        {/* Main content area with padding for sticky header */}
        <main className="pt-20">{children}</main>
      </body>
    </html>
  );
}
