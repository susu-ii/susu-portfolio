import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "孙苏阳｜视觉设计作品集",
  description: "孙苏阳的 AIGC 视觉、品牌运营、IP 联名、H5 活动与 UI 产品设计作品集。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
