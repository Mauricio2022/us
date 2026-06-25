import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nosotros — cosas por cambiar juntos",
  description: "Un espacio para anotar y dar seguimiento a lo que queremos mejorar en la relación.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
