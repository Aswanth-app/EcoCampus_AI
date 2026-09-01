import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EcoCampus AI | Enterprise Resource Intelligence Platform",
  description: "Smart IoT + AI resource monitoring, continuous flow anomaly detection, and actionable intelligence for educational campuses.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
        />
      </head>
      <body className="bg-[#F8FAF9] text-gray-900 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
