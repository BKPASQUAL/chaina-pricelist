import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "China Pricing Calculator",
  description: "Calculate product pricing with taxes and additional costs",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SidebarProvider>
          <AppSidebar />
          <main className="flex-1 flex flex-col min-h-screen">
            {/* Header with sidebar trigger and branding */}
            <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="container flex h-14 max-w-screen-2xl items-center">
                <SidebarTrigger className="mr-4" />
                <div className="flex items-center space-x-2">
                  <h1 className="text-lg font-semibold">
                    China Pricing Calculator
                  </h1>
                </div>
              </div>
            </header>

            {/* Main content area */}
            <div className="flex-1">{children}</div>
          </main>
        </SidebarProvider>
      </body>
    </html>
  );
}
