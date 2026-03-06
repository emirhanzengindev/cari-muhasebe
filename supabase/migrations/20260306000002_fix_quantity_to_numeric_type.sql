-- Fix quantity column type to accept decimal values in invoice_items
DO $$
BEGIN
    -- Check if quantity column exists and is integer type
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invoice_items' 
          AND table_schema = 'public'
          AND column_name = 'quantity'
          AND data_type IN ('integer', 'bigint', 'smallint')
    ) THEN
        -- Alter quantity column to numeric type with precision
        ALTER TABLE public.invoice_items 
        ALTER COLUMN quantity TYPE numeric(14,4) USING quantity::numeric(14,4);
        
        RAISE NOTICE 'Changed invoice_items.quantity from integer to numeric(14,4)';
    ELSE
        RAISE NOTICE 'invoice_items.quantity is already numeric or does not exist';
    END IF;
END $$;

-- Fix quantity column type to accept decimal values in stock_movements
DO $$
BEGIN
    -- Check if quantity column exists and is integer type
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stock_movements' 
          AND table_schema = 'public'
          AND column_name = 'quantity'
          AND data_type IN ('integer', 'bigint', 'smallint')
    ) THEN
        -- Alter quantity column to numeric type with precision
        ALTER TABLE public.stock_movements 
        ALTER COLUMN quantity TYPE numeric(14,4) USING quantity::numeric(14,4);
        
        RAISE NOTICE 'Changed stock_movements.quantity from integer to numeric(14,4)';
    ELSE
        RAISE NOTICE 'stock_movements.quantity is already numeric or does not exist';
    END IF;
END $$;

-- Update default values to support decimals
ALTER TABLE public.invoice_items 
ALTER COLUMN quantity SET DEFAULT 0;

ALTER TABLE public.stock_movements 
ALTER COLUMN quantity SET DEFAULT 0;

-- Add comments to document the change
COMMENT ON COLUMN public.invoice_items.quantity IS 'Quantity of items (supports decimal values)';
COMMENT ON COLUMN public.stock_movements.quantity IS 'Quantity of products moved (supports decimal values)';

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
