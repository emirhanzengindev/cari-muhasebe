-- Add ledger tables for current account debit/credit tracking and collection-invoice matching.

CREATE TABLE IF NOT EXISTS public.current_account_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  current_account_id uuid NOT NULL REFERENCES public.current_accounts(id) ON DELETE CASCADE,
  invoice_id uuid NULL REFERENCES public.invoices(id) ON DELETE SET NULL,
  movement_type text NOT NULL CHECK (movement_type IN ('INVOICE', 'COLLECTION', 'PAYMENT', 'ADJUSTMENT', 'RETURN')),
  amount numeric(14,2) NOT NULL CHECK (amount > 0),
  direction integer NOT NULL CHECK (direction IN (-1, 1)),
  signed_amount numeric(14,2) NOT NULL,
  balance_after numeric(14,2) NOT NULL,
  currency text NOT NULL DEFAULT 'TRY',
  document_no text NULL,
  document_date date NOT NULL DEFAULT CURRENT_DATE,
  description text NULL,
  tenant_id uuid NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.collection_invoice_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_movement_id uuid NOT NULL REFERENCES public.current_account_movements(id) ON DELETE CASCADE,
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  applied_amount numeric(14,2) NOT NULL CHECK (applied_amount > 0),
  tenant_id uuid NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_collection_invoice UNIQUE (collection_movement_id, invoice_id)
);

CREATE INDEX IF NOT EXISTS idx_cam_current_account_id ON public.current_account_movements(current_account_id);
CREATE INDEX IF NOT EXISTS idx_cam_tenant_id ON public.current_account_movements(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cam_invoice_id ON public.current_account_movements(invoice_id);
CREATE INDEX IF NOT EXISTS idx_cam_document_date ON public.current_account_movements(document_date DESC);
CREATE INDEX IF NOT EXISTS idx_cim_collection_movement_id ON public.collection_invoice_matches(collection_movement_id);
CREATE INDEX IF NOT EXISTS idx_cim_invoice_id ON public.collection_invoice_matches(invoice_id);
CREATE INDEX IF NOT EXISTS idx_cim_tenant_id ON public.collection_invoice_matches(tenant_id);

ALTER TABLE public.current_account_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_invoice_matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "current_account_movements_select_policy" ON public.current_account_movements;
DROP POLICY IF EXISTS "current_account_movements_insert_policy" ON public.current_account_movements;
DROP POLICY IF EXISTS "current_account_movements_update_policy" ON public.current_account_movements;
DROP POLICY IF EXISTS "current_account_movements_delete_policy" ON public.current_account_movements;

CREATE POLICY "current_account_movements_select_policy"
ON public.current_account_movements
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR tenant_id = auth.uid()
  OR tenant_id = NULLIF((auth.jwt() ->> 'tenant_id'), '')::uuid
);

CREATE POLICY "current_account_movements_insert_policy"
ON public.current_account_movements
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND (
    tenant_id = auth.uid()
    OR tenant_id = NULLIF((auth.jwt() ->> 'tenant_id'), '')::uuid
  )
);

CREATE POLICY "current_account_movements_update_policy"
ON public.current_account_movements
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  OR tenant_id = auth.uid()
  OR tenant_id = NULLIF((auth.jwt() ->> 'tenant_id'), '')::uuid
)
WITH CHECK (
  user_id = auth.uid()
  AND (
    tenant_id = auth.uid()
    OR tenant_id = NULLIF((auth.jwt() ->> 'tenant_id'), '')::uuid
  )
);

CREATE POLICY "current_account_movements_delete_policy"
ON public.current_account_movements
FOR DELETE
TO authenticated
USING (
  user_id = auth.uid()
  OR tenant_id = auth.uid()
  OR tenant_id = NULLIF((auth.jwt() ->> 'tenant_id'), '')::uuid
);

DROP POLICY IF EXISTS "collection_invoice_matches_select_policy" ON public.collection_invoice_matches;
DROP POLICY IF EXISTS "collection_invoice_matches_insert_policy" ON public.collection_invoice_matches;
DROP POLICY IF EXISTS "collection_invoice_matches_update_policy" ON public.collection_invoice_matches;
DROP POLICY IF EXISTS "collection_invoice_matches_delete_policy" ON public.collection_invoice_matches;

CREATE POLICY "collection_invoice_matches_select_policy"
ON public.collection_invoice_matches
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR tenant_id = auth.uid()
  OR tenant_id = NULLIF((auth.jwt() ->> 'tenant_id'), '')::uuid
);

CREATE POLICY "collection_invoice_matches_insert_policy"
ON public.collection_invoice_matches
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND (
    tenant_id = auth.uid()
    OR tenant_id = NULLIF((auth.jwt() ->> 'tenant_id'), '')::uuid
  )
);

CREATE POLICY "collection_invoice_matches_update_policy"
ON public.collection_invoice_matches
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  OR tenant_id = auth.uid()
  OR tenant_id = NULLIF((auth.jwt() ->> 'tenant_id'), '')::uuid
)
WITH CHECK (
  user_id = auth.uid()
  AND (
    tenant_id = auth.uid()
    OR tenant_id = NULLIF((auth.jwt() ->> 'tenant_id'), '')::uuid
  )
);

CREATE POLICY "collection_invoice_matches_delete_policy"
ON public.collection_invoice_matches
FOR DELETE
TO authenticated
USING (
  user_id = auth.uid()
  OR tenant_id = auth.uid()
  OR tenant_id = NULLIF((auth.jwt() ->> 'tenant_id'), '')::uuid
);

CREATE OR REPLACE FUNCTION public.record_current_account_movement(
  p_current_account_id uuid,
  p_movement_type text,
  p_amount numeric,
  p_direction integer DEFAULT NULL,
  p_currency text DEFAULT 'TRY',
  p_document_no text DEFAULT NULL,
  p_document_date date DEFAULT CURRENT_DATE,
  p_description text DEFAULT NULL,
  p_invoice_id uuid DEFAULT NULL,
  p_matches jsonb DEFAULT '[]'::jsonb
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
  v_direction integer;
  v_signed_amount numeric(14,2);
  v_balance_after numeric(14,2);
  v_movement_id uuid;
  v_account public.current_accounts%ROWTYPE;
  v_match_item jsonb;
  v_match_invoice_id uuid;
  v_match_amount numeric(14,2);
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Auth session missing';
  END IF;

  v_tenant_id := COALESCE(v_tenant_claim::uuid, v_uid);

  SELECT *
  INTO v_account
  FROM public.current_accounts
  WHERE id = p_current_account_id
    AND (
      user_id = v_uid
      OR tenant_id IN (v_uid, v_tenant_id)
    )
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Current account not found or unauthorized';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be greater than 0';
  END IF;

  v_direction := COALESCE(
    p_direction,
    CASE UPPER(COALESCE(p_movement_type, ''))
      WHEN 'INVOICE' THEN 1
      WHEN 'PAYMENT' THEN 1
      WHEN 'COLLECTION' THEN -1
      ELSE NULL
    END
  );

  IF v_direction NOT IN (-1, 1) THEN
    RAISE EXCEPTION 'Direction must be -1 or 1';
  END IF;

  v_signed_amount := ROUND(p_amount::numeric, 2) * v_direction;
  v_balance_after := ROUND(COALESCE(v_account.balance, 0)::numeric + v_signed_amount, 2);

  UPDATE public.current_accounts
  SET
    balance = v_balance_after,
    updated_at = now()
  WHERE id = v_account.id;

  INSERT INTO public.current_account_movements (
    current_account_id,
    invoice_id,
    movement_type,
    amount,
    direction,
    signed_amount,
    balance_after,
    currency,
    document_no,
    document_date,
    description,
    tenant_id,
    user_id
  )
  VALUES (
    v_account.id,
    p_invoice_id,
    UPPER(p_movement_type),
    ROUND(p_amount::numeric, 2),
    v_direction,
    v_signed_amount,
    v_balance_after,
    COALESCE(NULLIF(p_currency, ''), 'TRY'),
    NULLIF(p_document_no, ''),
    COALESCE(p_document_date, CURRENT_DATE),
    p_description,
    v_account.tenant_id,
    v_uid
  )
  RETURNING id INTO v_movement_id;

  IF p_matches IS NOT NULL AND jsonb_typeof(p_matches) = 'array' THEN
    FOR v_match_item IN
      SELECT * FROM jsonb_array_elements(p_matches)
    LOOP
      v_match_invoice_id := NULLIF((v_match_item ->> 'invoice_id'), '')::uuid;
      v_match_amount := COALESCE(NULLIF((v_match_item ->> 'amount'), '')::numeric, 0);

      IF v_match_invoice_id IS NULL OR v_match_amount <= 0 THEN
        CONTINUE;
      END IF;

      INSERT INTO public.collection_invoice_matches (
        collection_movement_id,
        invoice_id,
        applied_amount,
        tenant_id,
        user_id
      )
      VALUES (
        v_movement_id,
        v_match_invoice_id,
        ROUND(v_match_amount, 2),
        v_account.tenant_id,
        v_uid
      )
      ON CONFLICT (collection_movement_id, invoice_id)
      DO UPDATE SET applied_amount = EXCLUDED.applied_amount;
    END LOOP;
  END IF;

  RETURN jsonb_build_object(
    'movement_id', v_movement_id,
    'current_account_id', v_account.id,
    'balance', v_balance_after,
    'signed_amount', v_signed_amount
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_current_account_movement(
  uuid,
  text,
  numeric,
  integer,
  text,
  text,
  date,
  text,
  uuid,
  jsonb
) TO authenticated;

