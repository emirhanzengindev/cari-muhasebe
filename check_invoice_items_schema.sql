-- Check if unit_price column exists in invoice_items table
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'invoice_items' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- If unit_price doesn't exist, add it
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
        RAISE NOTICE 'unit_price column already exists';
    END IF;
END $$;

-- Verify the column was added
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'invoice_items' 
  AND table_schema = 'public'
  AND column_name = 'unit_price';
