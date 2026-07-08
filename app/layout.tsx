import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Brosma - Plataforma de Gestión y Seguimiento",
  description: "Control interno de taller y seguimiento de pedidos para Brosma.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body style={{ background: "var(--bg)", color: "var(--fg1)", fontFamily: "var(--font-body)", minHeight: "100vh" }}>
        {children}
      </body>
    </html>
  );
}
