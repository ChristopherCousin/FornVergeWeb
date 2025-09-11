import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import Navbar from "@/components/ui/Navbar";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter',
});

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '600', '700', '900'],
  variable: '--font-playfair-display',
});

export const metadata: Metadata = {
  title: "MASSA - Cafeterías & Panaderías Artesanales",
  description: "Cadena de cafeterías & panaderías artesanales en Palma de Mallorca. Llevant y Son Oliva.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="font-sans bg-cream text-brown antialiased">
        <Navbar />
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}
