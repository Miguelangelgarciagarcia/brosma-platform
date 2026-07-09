import type { Metadata } from "next";
import { DM_Sans, Anton } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

// DM Sans = tipografía de texto de la identidad gráfica de Brosma.
const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

// Grifter Bold real (archivo que mandó el cliente) = tipografía de títulos
// de la identidad gráfica de Brosma.
const grifter = localFont({
  src: "./fonts/Grifter-Bold.otf",
  variable: "--font-grifter",
  display: "swap",
});

// Se deja como respaldo en la cadena de --font-heading (globals.css) por si
// el archivo de Grifter no cargara por algún motivo.
const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-anton",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Grupo Brosma - Plataforma de Gestión y Seguimiento",
  description: "Control interno de taller y seguimiento de pedidos para Grupo Brosma.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${dmSans.variable} ${grifter.variable} ${anton.variable}`}>
      <body style={{ background: "var(--bg)", color: "var(--fg1)", fontFamily: "var(--font-body)", minHeight: "100vh" }}>
        {children}
      </body>
    </html>
  );
}
