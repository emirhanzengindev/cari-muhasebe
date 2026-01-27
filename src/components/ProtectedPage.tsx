"use client";

interface ProtectedPageProps {
  children: React.ReactNode;
}

export default function ProtectedPage({ children }: ProtectedPageProps) {
  // AuthProvider disabled - allow all pages to render
  return <>{children}</>;
}