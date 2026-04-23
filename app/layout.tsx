import type { Metadata } from "next";
import { Sora } from "next/font/google";
import { AuthProvider } from "@/components/auth/AuthProvider";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "SIL Inteligência Analítica",
  description: "Interface de chat com IA para análise de dados no Power BI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={sora.variable}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
