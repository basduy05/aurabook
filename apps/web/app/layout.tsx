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
  title: "AuraBook - Nền Tảng Thương Mại Điện Tử & Đọc Sách Số Bảo Mật AI",
  description:
    "Hệ thống phân phối và bảo mật bản quyền E-book WebAssembly Canvas DRM tích hợp tác tử RAG đa phương thức và Voice AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="dark">
      <body
        className={`${inter.className} min-h-screen flex flex-col antialiased bg-slate-950 text-slate-100 selection:bg-purple-600 selection:text-white`}
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
