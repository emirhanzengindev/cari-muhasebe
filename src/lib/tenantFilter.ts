import { useAuth } from "@/contexts/AuthContext";

// Utility function to filter data by tenant ID
export function filterByTenant<T extends { tenantId: string }>(data: T[]): T[] {
  // In a real implementation, we would get the tenantId from the auth context
  // For now, we'll use a mock tenant ID
  const mockTenantId = "tenant-1";
  
  return data.filter(item => item.tenantId === mockTenantId);
}

// Utility function to add tenant ID to new items
export function withTenantId<T>(item: T, tenantId: string): T & { tenantId: string } {
  return {
    ...item,
    tenantId
  } as T & { tenantId: string };
}

// Hook to get tenant-specific data
export function useTenantData() {
  const { tenantId } = useAuth();
  
  const filterData = <T extends { tenantId: string }>(data: T[]): T[] => {
    if (!tenantId) return [];
    return data.filter(item => item.tenantId === tenantId);
  };
  
  const addItemWithTenant = <T>(item: T): T & { tenantId: string } => {
    if (!tenantId) {
      throw new Error("No active tenant");
    }
    return {
      ...item,
      tenantId
    } as T & { tenantId: string };
  };
  
  return {
    tenantId,
    filterData,
    addItemWithTenant
  };
}