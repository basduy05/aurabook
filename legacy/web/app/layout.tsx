import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { VoiceAssistant } from "@/components/voice-assistant";
import { CartProvider } from "@/context/cart-context";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { CartDrawer } from "@/components/cart-drawer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://aurabook.vn"),
  title: "AuraBook - Sàn Mua Bán Sách & Thư Viện Bản Quyền Số DRM",
  description:
    "Hệ thống phân phối sách in & bảo mật bản quyền E-book WebAssembly Canvas DRM tích hợp trợ lý RAG đa phương thức và Voice AI.",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.ico",
    apple: "/favicon.png",
  },
  openGraph: {
    title: "AuraBook - Sàn Mua Bán Sách & Thư Viện Bản Quyền Số DRM",
    description: "Nền tảng xuất bản sách công nghệ, thư viện E-book DRM Canvas và Voice AI.",
    images: [{ url: "/logo.png", width: 1200, height: 280, alt: "AuraBook Logo" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body
        className={`${inter.className} min-h-screen flex flex-col antialiased bg-white text-slate-900 selection:bg-sky-500 selection:text-white`}
      >
        <CartProvider>
          <Navbar />
          <CartDrawer />
          <div className="flex-1 flex flex-col">{children}</div>
          <Footer />
          <VoiceAssistant />
        </CartProvider>
      </body>
    </html>
  );
}
