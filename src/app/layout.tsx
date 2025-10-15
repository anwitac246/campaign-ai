import type { Metadata } from "next";
import "./globals.css";
import { Rowdies } from 'next/font/google';

const rowdies = Rowdies({
  subsets: ['latin'],
  weight: ['400','700'], 
  variable: '--font-rowdies',
});

export const metadata = {
  title: "CampaignAI",
  description: "AI-powered marketing platform",
};



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
       <body className={`${rowdies.variable} antialiased`}>


        {children}
      </body>
    </html>
  );
}
