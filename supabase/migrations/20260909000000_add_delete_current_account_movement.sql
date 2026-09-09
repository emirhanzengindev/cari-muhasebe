-- Delete a collection/payment movement and reverse its effect on the account ledger atomically.

CREATE OR REPLACE FUNCTION public.delete_current_account_movement(
  p_movement_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_tenant_claim text := NULLIF((auth.jwt() ->> 'tenant_id'), '');
  v_tenant_id uuid;
  v_movement public.current_account_movements%ROWTYPE;
  v_account public.current_accounts%ROWTYPE;
  v_updated_balance numeric(14,2);
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Auth session missing';
  END IF;

  v_tenant_id := COALESCE(v_tenant_claim::uuid, v_uid);

  SELECT *
  INTO v_movement
  FROM public.current_account_movements
  WHERE id = p_movement_id
    AND movement_type IN ('COLLECTION', 'PAYMENT', 'ADJUSTMENT')
    AND (
      user_id = v_uid
      OR tenant_id IN (v_uid, v_tenant_id)
    )
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Current account movement not found or unauthorized';
  END IF;

  SELECT *
  INTO v_account
  FROM public.current_accounts
  WHERE id = v_movement.current_account_id
    AND (
      user_id = v_uid
      OR tenant_id IN (v_uid, v_tenant_id)
    )
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Current account not found or unauthorized';
  END IF;

  v_updated_balance := ROUND(
    COALESCE(v_account.balance, 0)::numeric - v_movement.signed_amount,
    2
  );

  UPDATE public.current_accounts
  SET
    balance = v_updated_balance,
    updated_at = now()
  WHERE id = v_account.id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Current account could not be updated';
  END IF;

  -- The child rows are removed by the FK as well; deleting them explicitly
  -- documents that invoice matches are part of the same operation.
  DELETE FROM public.collection_invoice_matches
  WHERE collection_movement_id = v_movement.id;

  DELETE FROM public.current_account_movements
  WHERE id = v_movement.id;

  -- Preserve balance_after snapshots for all later ledger movements.
  UPDATE public.current_account_movements
  SET
    balance_after = ROUND(balance_after - v_movement.signed_amount, 2),
    updated_at = now()
  WHERE current_account_id = v_account.id
    AND (
      document_date > v_movement.document_date
      OR (
        document_date = v_movement.document_date
        AND (
          created_at > v_movement.created_at
          OR (created_at = v_movement.created_at AND id > v_movement.id)
        )
      )
    );

  RETURN jsonb_build_object(
    'movement_id', v_movement.id,
    'current_account_id', v_account.id,
    'balance', v_updated_balance,
    'signed_amount', v_movement.signed_amount,
    'invoice_id', v_movement.invoice_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_current_account_movement(uuid) TO authenticated;
