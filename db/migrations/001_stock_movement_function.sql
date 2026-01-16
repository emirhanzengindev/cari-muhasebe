-- Create the stock movement function
CREATE OR REPLACE FUNCTION apply_stock_movement(
  p_product_id uuid,
  p_quantity int,
  p_movement_type text,
  p_description text default null,
  p_warehouse_id uuid default null,
  p_price numeric default null
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_stock int;
  tenant_id uuid;
BEGIN
  -- Get the current user's tenant ID
  tenant_id := auth.uid();

  -- Lock the product record to prevent race conditions
  SELECT stock_quantity
  INTO current_stock
  FROM products
  WHERE id = p_product_id
    AND tenant_id = tenant_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found or unauthorized';
  END IF;

  -- Check for sufficient stock if it's an OUT movement
  IF p_movement_type = 'out' AND current_stock < p_quantity THEN
    RAISE EXCEPTION 'Insufficient stock. Available: %, Requested: %', current_stock, p_quantity;
  END IF;

  -- Update product stock quantity based on movement type
  IF p_movement_type = 'out' THEN
    UPDATE products
    SET stock_quantity = stock_quantity - p_quantity
    WHERE id = p_product_id
      AND tenant_id = tenant_id;
  ELSE
    UPDATE products
    SET stock_quantity = stock_quantity + p_quantity
    WHERE id = p_product_id
      AND tenant_id = tenant_id;
  END IF;

  -- Insert the stock movement record
  INSERT INTO stock_movements (
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
    p_movement_type,
    p_quantity,
    p_description,
    tenant_id,
    p_warehouse_id,
    p_price
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION apply_stock_movement TO authenticated;