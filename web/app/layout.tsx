import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NYX // Building a GPU from Scratch",
  description: "A cycle-accurate GPU simulator written in Go and an architectural study of parallel computing.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-canvas-fog text-inkwell font-denim">
        {children}
      </body>
    </html>
  );
}
