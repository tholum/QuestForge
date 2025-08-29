import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppLayout } from "@/components/layout/AppLayout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Goal Assistant - Life Management for ADHD",
  description: "A comprehensive, modular, and gamified life management application designed for individuals with ADHD.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Mock user data - in real app, this would come from auth/database
  const mockUser = {
    id: "user-1",
    name: "Alex Johnson",
    email: "alex@example.com",
    avatar: undefined,
    level: 12,
    xp: 2847
  };

  // Mock notifications - in real app, this would come from API
  const mockNotifications = [
    {
      id: "1",
      type: "success" as const,
      message: "Great job! You completed your fitness goal for today.",
      timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
      read: false
    },
    {
      id: "2",
      type: "info" as const,
      message: "Your weekly home project review is ready.",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      read: false
    },
    {
      id: "3",
      type: "warning" as const,
      message: "Bible study streak at risk - don't forget today's reading!",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
      read: true
    }
  ];

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AppLayout
          user={mockUser}
          notifications={mockNotifications}
        >
          {children}
        </AppLayout>
      </body>
    </html>
  );
}
