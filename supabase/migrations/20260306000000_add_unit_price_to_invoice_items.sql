-- Add unit_price column to invoice_items table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invoice_items' 
          AND table_schema = 'public'
          AND column_name = 'unit_price'
    ) THEN
        ALTER TABLE public.invoice_items 
        ADD COLUMN unit_price numeric(14,2) DEFAULT 0;
        
        RAISE NOTICE 'Added unit_price column to invoice_items table';
    ELSE
        RAISE NOTICE 'unit_price column already exists in invoice_items table';
    END IF;
END $$;

-- Add comment to document the column
COMMENT ON COLUMN public.invoice_items.unit_price IS 'Unit price for each item (price per single unit)';

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
