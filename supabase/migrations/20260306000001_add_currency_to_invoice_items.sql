-- Add currency column to invoice_items table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invoice_items' 
          AND table_schema = 'public'
          AND column_name = 'currency'
    ) THEN
        ALTER TABLE public.invoice_items 
        ADD COLUMN currency text DEFAULT 'TRY';
        
        RAISE NOTICE 'Added currency column to invoice_items table';
    ELSE
        RAISE NOTICE 'currency column already exists in invoice_items table';
    END IF;
END $$;

-- Add comment to document the column
COMMENT ON COLUMN public.invoice_items.currency IS 'Currency of the item (TRY or USD)';

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
