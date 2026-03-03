-- Simplify and harden apply_stock_movement against tenant/schema drift.
-- Keeps the same signature expected by the API.

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
SET search_path = public
AS $$
DECLARE
  v_current_stock int;
  v_tenant_id uuid;
  v_effective_type text;
BEGIN
  v_effective_type := lower(trim(coalesce(p_movement_type, '')));
  IF v_effective_type NOT IN ('in', 'out') THEN
    RAISE EXCEPTION 'Invalid movement type. Must be in or out';
  END IF;

  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'Quantity must be a positive integer';
  END IF;

  v_tenant_id := COALESCE(NULLIF(auth.jwt() ->> 'tenant_id', '')::uuid, auth.uid());

  -- Lock the row to ensure stock is updated atomically.
  SELECT p.stock_quantity
  INTO v_current_stock
  FROM public.products p
  WHERE p.id = p_product_id
    AND (p.tenant_id = v_tenant_id OR p.tenant_id = auth.uid())
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found or unauthorized';
  END IF;

  IF v_effective_type = 'out' AND v_current_stock < p_quantity THEN
    RAISE EXCEPTION 'Insufficient stock. Available: %, Requested: %', v_current_stock, p_quantity;
  END IF;

  UPDATE public.products p
  SET
    stock_quantity = CASE
      WHEN v_effective_type = 'out' THEN p.stock_quantity - p_quantity
      ELSE p.stock_quantity + p_quantity
    END,
    updated_at = NOW()
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
  )
  VALUES (
    p_product_id,
    v_effective_type,
    p_quantity,
    p_description,
    v_tenant_id,
    p_warehouse_id,
    p_price
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.apply_stock_movement(uuid, int, text, text, uuid, numeric) TO authenticated;

