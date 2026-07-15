import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Comptes Publics France",
  description: "Dashboard des recettes et dépenses publiques de la France — visualisation et analyse des finances de l'État et des APU",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
