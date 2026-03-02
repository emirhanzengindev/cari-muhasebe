"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import TenantSwitcher from "@/components/TenantSwitcher";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { user, isLoading, logout } = useAuth();

  useEffect(() => {
    const checkIsMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setSidebarOpen(!mobile);
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const navigation = [
    { name: "Ana Sayfa", href: "/", icon: "A" },
    { name: "Cari Hesaplar", href: "/current-accounts", icon: "C" },
    { name: "Stok Yonetimi", href: "/inventory", icon: "S" },
    { name: "Faturalar", href: "/invoices", icon: "F" },
    { name: "Hizli Satis", href: "/quick-sales", icon: "H" },
    { name: "Finans", href: "/finance", icon: "$" },
    { name: "Raporlar", href: "/reports", icon: "R" },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <div
        className={`${sidebarOpen ? "w-64" : "w-0 md:w-20"} ${
          isMobile && !sidebarOpen ? "hidden" : "block"
        } bg-white shadow-md transition-all duration-300 ease-in-out overflow-hidden fixed md:relative z-50 h-full`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b">
            {sidebarOpen ? (
              <h1 className="text-xl font-bold text-blue-600">On Muhasebe</h1>
            ) : (
              <h1 className="text-xl font-bold text-blue-600 mx-auto">P-A</h1>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-500 hover:text-gray-700 md:hidden"
            >
              {sidebarOpen ? "<<" : ">>"}
            </button>
          </div>

          <nav className="flex-1 px-2 py-4 overflow-y-auto">
            <ul className="space-y-1">
              {navigation.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`flex items-center p-3 rounded-lg ${
                      pathname === item.href
                        ? "bg-blue-100 text-blue-600"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    onClick={() => isMobile && setSidebarOpen(false)}
                  >
                    <span className="text-xl">{item.icon}</span>
                    {sidebarOpen && <span className="ml-3 font-medium">{item.name}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="p-4 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
                  {user?.name?.charAt(0) || "U"}
                </div>
                {sidebarOpen && (
                  <div className="ml-3">
                    <p className="text-sm font-medium">{user?.email || user?.name || "Kullanici"}</p>
                    <p className="text-xs text-gray-500">Hesabiniz</p>
                  </div>
                )}
              </div>
              <div className="relative">
                <button onClick={logout} className="text-gray-500 hover:text-gray-700">
                  Cikis
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed top-4 left-4 z-50 p-2 bg-blue-600 text-white rounded-md shadow-lg md:hidden"
        >
          Menu
        </button>
      )}

      {sidebarOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden md:ml-0 transition-all duration-300">
        <header className="bg-white shadow-sm z-30">
          <div className="flex items-center justify-between p-4">
            <h2 className="text-lg font-semibold text-gray-800">
              {navigation.find((item) => item.href === pathname)?.name || "Ana Sayfa"}
            </h2>
            <div className="flex items-center space-x-4">
              <TenantSwitcher />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 bg-gray-50">{children}</main>
      </div>
    </div>
  );
}
