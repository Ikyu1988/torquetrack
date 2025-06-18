
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
