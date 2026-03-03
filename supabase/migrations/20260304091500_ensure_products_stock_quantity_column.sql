-- Ensure products.stock_quantity exists for legacy RPC/trigger compatibility.
-- Some environments use stock/quantity-like column names instead.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'products'
      AND column_name = 'stock_quantity'
  ) THEN
    ALTER TABLE public.products
      ADD COLUMN stock_quantity integer DEFAULT 0;
  END IF;
END
$$;

-- Backfill stock_quantity from a compatible existing column if possible.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'products'
      AND column_name = 'stock'
  ) THEN
    EXECUTE 'UPDATE public.products SET stock_quantity = COALESCE(stock, 0) WHERE stock_quantity IS NULL OR stock_quantity = 0';
  ELSIF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'products'
      AND column_name = 'quantity'
  ) THEN
    EXECUTE 'UPDATE public.products SET stock_quantity = COALESCE(quantity, 0) WHERE stock_quantity IS NULL OR stock_quantity = 0';
  ELSIF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'products'
      AND column_name = 'qty'
  ) THEN
    EXECUTE 'UPDATE public.products SET stock_quantity = COALESCE(qty, 0) WHERE stock_quantity IS NULL OR stock_quantity = 0';
  ELSIF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'products'
      AND column_name = 'amount'
  ) THEN
    EXECUTE 'UPDATE public.products SET stock_quantity = COALESCE(amount, 0) WHERE stock_quantity IS NULL OR stock_quantity = 0';
  ELSIF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'products'
      AND column_name = 'inventory'
  ) THEN
    EXECUTE 'UPDATE public.products SET stock_quantity = COALESCE(inventory, 0) WHERE stock_quantity IS NULL OR stock_quantity = 0';
  END IF;
END
$$;

ALTER TABLE public.products
  ALTER COLUMN stock_quantity SET DEFAULT 0,
  ALTER COLUMN stock_quantity SET NOT NULL;

-- Refresh PostgREST schema cache in production.
COMMENT ON TABLE public.products IS 'Schema refresh: ensure stock_quantity compatibility for stock movement flow - 20260304091500';

