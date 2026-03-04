-- PAYMENT entries were recorded as balance-increasing for customer collections.
-- This migration flips legacy PAYMENT movements to decrease balance and applies
-- the same delta to movement snapshots and current account balances.

WITH affected AS (
  SELECT
    id,
    current_account_id,
    document_date,
    created_at,
    (-2 * ABS(amount))::numeric(14,2) AS delta
  FROM public.current_account_movements
  WHERE movement_type = 'PAYMENT'
    AND direction = 1
),
updated_payments AS (
  UPDATE public.current_account_movements m
  SET
    direction = -1,
    signed_amount = -ABS(m.amount)
  FROM affected a
  WHERE m.id = a.id
  RETURNING m.id
),
cumulative_deltas AS (
  SELECT
    m.id,
    COALESCE(SUM(a.delta), 0)::numeric(14,2) AS cumulative_delta
  FROM public.current_account_movements m
  LEFT JOIN affected a
    ON a.current_account_id = m.current_account_id
   AND (
     a.document_date < m.document_date
     OR (
       a.document_date = m.document_date
       AND (
         a.created_at < m.created_at
         OR (a.created_at = m.created_at AND a.id <= m.id)
       )
     )
   )
  GROUP BY m.id
),
updated_snapshots AS (
  UPDATE public.current_account_movements m
  SET balance_after = ROUND(m.balance_after + d.cumulative_delta, 2)
  FROM cumulative_deltas d
  WHERE m.id = d.id
    AND d.cumulative_delta <> 0
  RETURNING m.id
),
account_deltas AS (
  SELECT current_account_id, SUM(delta)::numeric(14,2) AS total_delta
  FROM affected
  GROUP BY current_account_id
)
UPDATE public.current_accounts ca
SET
  balance = ROUND(COALESCE(ca.balance, 0)::numeric + ad.total_delta, 2),
  updated_at = now()
FROM account_deltas ad
WHERE ca.id = ad.current_account_id;

