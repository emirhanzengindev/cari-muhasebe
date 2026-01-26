"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface ProtectedPageProps {
  children: React.ReactNode;
}

export default function ProtectedPage({ children }: ProtectedPageProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect when we're sure there's no user and loading is complete
    if (!isLoading && !user) {
      console.log('PROTECTED PAGE: No user found, redirecting to signin');
      router.replace('/auth/signin');
    }
  }, [isLoading, user, router]);

  // Show nothing while loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show nothing if no user (redirecting)
  if (!user) {
    return null;
  }

  // Render children only when user is authenticated
  return <>{children}</>;
}