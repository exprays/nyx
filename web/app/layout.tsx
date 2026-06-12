import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://nyx.superxepic.dev"),
  title: "NYX // Building a GPU from Scratch",
  description: "A cycle-accurate GPU implementation written in Go and an architectural study of parallel computing.",
  authors: [{ name: "Surya", url: "https://surya.superxepic.dev" }],
  openGraph: {
    title: "NYX // Building a GPU from Scratch",
    description: "A cycle-accurate GPU implementation written in Go and an architectural study of parallel computing.",
    url: "https://nyx.superxepic.dev",
    images: [
      {
        url: "/banner.jpeg",
        width: 1200,
        height: 630,
        alt: "NYX GPU Architecture Banner",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NYX // Building a GPU from Scratch",
    description: "A cycle-accurate GPU implementation written in Go and an architectural study of parallel computing.",
    images: ["/banner.jpeg"],
  },
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
