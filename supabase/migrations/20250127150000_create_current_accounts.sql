-- Create current_accounts table
CREATE TABLE IF NOT EXISTS public.current_accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    tax_number VARCHAR(50),
    tax_office VARCHAR(100),
    company VARCHAR(255),
    balance DECIMAL(12,2) DEFAULT 0.00,
    tenant_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.current_accounts ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to access their own tenant's data
CREATE POLICY "Users can view their tenant's current accounts" 
ON public.current_accounts 
FOR SELECT 
TO authenticated 
USING (tenant_id = auth.uid());

CREATE POLICY "Users can insert their tenant's current accounts" 
ON public.current_accounts 
FOR INSERT 
TO authenticated 
WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "Users can update their tenant's current accounts" 
ON public.current_accounts 
FOR UPDATE 
TO authenticated 
USING (tenant_id = auth.uid());

CREATE POLICY "Users can delete their tenant's current accounts" 
ON public.current_accounts 
FOR DELETE 
TO authenticated 
USING (tenant_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_current_accounts_tenant_id ON public.current_accounts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_current_accounts_name ON public.current_accounts(name);