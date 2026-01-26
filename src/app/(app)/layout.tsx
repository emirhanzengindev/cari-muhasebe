import MainLayout from "@/components/MainLayout";
import Providers from "@/components/Providers";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <MainLayout>{children}</MainLayout>
    </Providers>
  );
}