import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { Inter as FontSans, Space_Grotesk as FontHeadline } from 'next/font/google';
import { cn } from "@/lib/utils";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
})

const fontHeadline = FontHeadline({
  subsets: ["latin"],
  variable: "--font-headline",
  weight: ['300', '400', '500', '700'],
})

export const metadata: Metadata = {
  title: 'TorqueTrack - Motorcycle Shop Management',
  description: 'Efficiently manage your motorcycle shop with TorqueTrack.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* Existing Google Fonts links if any, can be removed if using next/font exclusively */}
        {/* <link rel="preconnect" href="https://fonts.googleapis.com" /> */}
        {/* <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" /> */}
        {/* <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@300;400;500;700&display=swap" rel="stylesheet" /> */}
      </head>
      <body 
        className={cn(
          "min-h-screen bg-background font-body text-foreground antialiased",
          fontSans.variable,
          fontHeadline.variable
        )}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
