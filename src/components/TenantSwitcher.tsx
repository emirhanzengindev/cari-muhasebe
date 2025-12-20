"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";

export default function TenantSwitcher() {
  const { tenantId, user } = useAuth();
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTenants = async () => {
      if (!user?.id) return;
      
      try {
        // In a real app, this would be an API call
        // const response = await fetch(`/api/users/${user.id}/tenants`);
        // const data = await response.json();
        
        // Mock data for now
        const mockTenants = [
          { id: "tenant-1", name: "Company A" },
          { id: "tenant-2", name: "Company B" },
          { id: "tenant-3", name: "Company C" },
        ];
        
        setTenants(mockTenants);
      } catch (error) {
        console.error("Failed to fetch tenants:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTenants();
  }, [user?.id]);

  const handleTenantChange = (newTenantId: string) => {
    // In a real app, this would update the user's active tenant
    // and refresh the session
    console.log("Switching to tenant:", newTenantId);
    // This would typically involve an API call to update the user's session
  };

  if (loading) {
    return (
      <div className="flex items-center">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
      </div>
    );
  }

  if (tenants.length <= 1) {
    return null;
  }

  return (
    <div className="relative">
      <select
        value={tenantId || ""}
        onChange={(e) => handleTenantChange(e.target.value)}
        className="bg-blue-600 text-white text-sm rounded-md py-1 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
      >
        {tenants.map((tenant) => (
          <option key={tenant.id} value={tenant.id}>
            {tenant.name}
          </option>
        ))}
      </select>
    </div>
  );
}