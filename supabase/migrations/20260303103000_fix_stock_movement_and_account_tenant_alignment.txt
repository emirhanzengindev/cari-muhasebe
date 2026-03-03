-- Align tenant handling across RPC + RLS and repair legacy account tenant/user fields.

-- 1) Make stock movement RPC tenant-aware for both JWT tenant_id and auth.uid() fallback.
CREATE OR REPLACE FUNCTION public.apply_stock_movement(
  p_product_id uuid,
  p_quantity int,
  p_movement_type text,
  p_description text DEFAULT NULL,
  p_warehouse_id uuid DEFAULT NULL,
  p_price numeric DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_stock int;
  v_tenant_id uuid;
BEGIN
  v_tenant_id := COALESCE(NULLIF(auth.jwt() ->> 'tenant_id', '')::uuid, auth.uid());

  SELECT p.stock_quantity
  INTO v_current_stock
  FROM public.products p
  WHERE p.id = p_product_id
    AND (p.tenant_id = v_tenant_id OR p.tenant_id = auth.uid())
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found or unauthorized';
  END IF;

  IF p_movement_type = 'out' AND v_current_stock < p_quantity THEN
    RAISE EXCEPTION 'Insufficient stock. Available: %, Requested: %', v_current_stock, p_quantity;
  END IF;

  UPDATE public.products p
  SET stock_quantity = CASE
    WHEN p_movement_type = 'out' THEN p.stock_quantity - p_quantity
    ELSE p.stock_quantity + p_quantity
  END
  WHERE p.id = p_product_id
    AND (p.tenant_id = v_tenant_id OR p.tenant_id = auth.uid());

  INSERT INTO public.stock_movements (
    product_id,
    movement_type,
    quantity,
    description,
    tenant_id,
    warehouse_id,
    price
  ) VALUES (
    p_product_id,
    p_movement_type,
    p_quantity,
    p_description,
    v_tenant_id,
    p_warehouse_id,
    p_price
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.apply_stock_movement(uuid, int, text, text, uuid, numeric) TO authenticated;

-- 2) Repair legacy current_accounts rows to match authenticated user + tenant metadata.
UPDATE public.current_accounts ca
SET
  user_id = COALESCE(ca.user_id, u.id),
  tenant_id = COALESCE(NULLIF(u.raw_app_meta_data ->> 'tenant_id', '')::uuid, u.id)
FROM auth.users u
WHERE ca.user_id = u.id
  AND (
    ca.user_id IS NULL
    OR ca.tenant_id IS DISTINCT FROM COALESCE(NULLIF(u.raw_app_meta_data ->> 'tenant_id', '')::uuid, u.id)
  );

-- 3) Normalize current_accounts policies to allow both tenant-claim and auth.uid fallback.
ALTER TABLE public.current_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "current_accounts_select" ON public.current_accounts;
DROP POLICY IF EXISTS "current_accounts_insert" ON public.current_accounts;
DROP POLICY IF EXISTS "current_accounts_update" ON public.current_accounts;
DROP POLICY IF EXISTS "current_accounts_delete" ON public.current_accounts;
DROP POLICY IF EXISTS "current_accounts_select_policy" ON public.current_accounts;
DROP POLICY IF EXISTS "current_accounts_insert_policy" ON public.current_accounts;
DROP POLICY IF EXISTS "current_accounts_update_policy" ON public.current_accounts;
DROP POLICY IF EXISTS "current_accounts_delete_policy" ON public.current_accounts;
DROP POLICY IF EXISTS "Users can view their own current accounts" ON public.current_accounts;
DROP POLICY IF EXISTS "Users can insert their own current accounts" ON public.current_accounts;
DROP POLICY IF EXISTS "Users can update their own current accounts" ON public.current_accounts;
DROP POLICY IF EXISTS "Users can delete their own current accounts" ON public.current_accounts;

CREATE POLICY "current_accounts_select_policy" ON public.current_accounts
FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR tenant_id = COALESCE(NULLIF(auth.jwt() ->> 'tenant_id', '')::uuid, auth.uid())
  OR tenant_id = auth.uid()
);

CREATE POLICY "current_accounts_insert_policy" ON public.current_accounts
FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND (
    tenant_id = COALESCE(NULLIF(auth.jwt() ->> 'tenant_id', '')::uuid, auth.uid())
    OR tenant_id = auth.uid()
  )
);

CREATE POLICY "current_accounts_update_policy" ON public.current_accounts
FOR UPDATE TO authenticated
USING (
  user_id = auth.uid()
  AND (
    tenant_id = COALESCE(NULLIF(auth.jwt() ->> 'tenant_id', '')::uuid, auth.uid())
    OR tenant_id = auth.uid()
  )
)
WITH CHECK (
  user_id = auth.uid()
  AND (
    tenant_id = COALESCE(NULLIF(auth.jwt() ->> 'tenant_id', '')::uuid, auth.uid())
    OR tenant_id = auth.uid()
  )
);

CREATE POLICY "current_accounts_delete_policy" ON public.current_accounts
FOR DELETE TO authenticated
USING (
  user_id = auth.uid()
  AND (
    tenant_id = COALESCE(NULLIF(auth.jwt() ->> 'tenant_id', '')::uuid, auth.uid())
    OR tenant_id = auth.uid()
  )
);

-- 4) Normalize stock_movements policies with same fallback logic.
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "stock_movements_select" ON public.stock_movements;
DROP POLICY IF EXISTS "stock_movements_insert" ON public.stock_movements;
DROP POLICY IF EXISTS "stock_movements_update" ON public.stock_movements;
DROP POLICY IF EXISTS "stock_movements_delete" ON public.stock_movements;

CREATE POLICY "stock_movements_select" ON public.stock_movements
FOR SELECT TO authenticated
USING (
  tenant_id = COALESCE(NULLIF(auth.jwt() ->> 'tenant_id', '')::uuid, auth.uid())
  OR tenant_id = auth.uid()
);

CREATE POLICY "stock_movements_insert" ON public.stock_movements
FOR INSERT TO authenticated
WITH CHECK (
  tenant_id = COALESCE(NULLIF(auth.jwt() ->> 'tenant_id', '')::uuid, auth.uid())
  OR tenant_id = auth.uid()
);

CREATE POLICY "stock_movements_update" ON public.stock_movements
FOR UPDATE TO authenticated
USING (
  tenant_id = COALESCE(NULLIF(auth.jwt() ->> 'tenant_id', '')::uuid, auth.uid())
  OR tenant_id = auth.uid()
)
WITH CHECK (
  tenant_id = COALESCE(NULLIF(auth.jwt() ->> 'tenant_id', '')::uuid, auth.uid())
  OR tenant_id = auth.uid()
);

CREATE POLICY "stock_movements_delete" ON public.stock_movements
FOR DELETE TO authenticated
USING (
  tenant_id = COALESCE(NULLIF(auth.jwt() ->> 'tenant_id', '')::uuid, auth.uid())
  OR tenant_id = auth.uid()
);

