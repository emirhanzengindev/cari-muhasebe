import type { Metadata } from "next";
import MainLayout from "@/components/MainLayout";
import ProtectedPage from "@/components/ProtectedPage";
import Providers from "@/components/Providers";

// Tenant/user specific application area: never index these pages.
export const metadata: Metadata = {
  title: "Panel",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <ProtectedPage>
        <MainLayout>{children}</MainLayout>
      </ProtectedPage>
    </Providers>
  );
}