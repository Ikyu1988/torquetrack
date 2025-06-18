// src/app/layout.tsx
"use client"; // AuthProvider requires this to be a client component

import type { Metadata } from 'next'; // Still keep for static metadata if possible
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { Inter as FontSans, Space_Grotesk as FontHeadline } from 'next/font/google';
import { cn } from "@/lib/utils";
import { AuthProvider } from "@/contexts/AuthContext"; // Import AuthProvider

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
})

const fontHeadline = FontHeadline({
  subsets: ["latin"],
  variable: "--font-headline",
  weight: ['300', '400', '500', '700'],
})

// Metadata can still be defined but might not be fully static if layout is client component
// export const metadata: Metadata = { // This might have limitations now
//   title: 'TorqueTrack - Motorcycle Shop Management',
//   description: 'Efficiently manage your motorcycle shop with TorqueTrack.',
// };

// Script to apply theme from localStorage before hydration
const ApplyThemeScript = () => (
  <script
    dangerouslySetInnerHTML={{
      __html: `
        (function() {
          try {
            const theme = localStorage.getItem('theme');
            if (theme) {
              document.documentElement.classList.add(theme);
            } else {
              // Default to dark if no theme is set in localStorage
              document.documentElement.classList.add('dark'); 
              localStorage.setItem('theme', 'dark');
            }
          } catch (e) {
            // If localStorage is not available, default to dark
            document.documentElement.classList.add('dark');
            console.error('Error accessing localStorage for theme:', e);
          }
        })();
      `,
    }}
  />
);


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ApplyThemeScript />
        {/* If metadata object above doesn't work, you might need to set title in <head> directly */}
        <title>TorqueTrack - Motorcycle Shop Management</title>
        <meta name="description" content="Efficiently manage your motorcycle shop with TorqueTrack." />
      </head>
      <body 
        className={cn(
          "min-h-screen bg-background font-body text-foreground antialiased",
          fontSans.variable,
          fontHeadline.variable
        )}
      >
        <AuthProvider> {/* Wrap children with AuthProvider */}
          {children}
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
