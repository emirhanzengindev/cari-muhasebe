# Tenant migration test: run order

Tests for `supabase/migrations/20261118130000_tenant_model_app_metadata.sql`
and `supabase/rollbacks/20261118130000_tenant_model_app_metadata.down.sql`.
Everything runs against a **local** Supabase stack in Docker. Nothing here
connects to the live project except `dump_live_schema.ps1` (read-only,
schema only, run by you with your password).

## Safety

* The local stack lives in `Desktop\cari1-tenant-test` (outside the repo). Its
  `config.toml` has automatic seeding off.
* SQL test files abort unless `tenant_test.local_marker` exists. Only the local
  setup creates that table.
* The PowerShell helpers only use `docker exec supabase_db_cari1-tenant-test psql`.
  They hold no connection string.
* The migration and rollback files are copied into the container unchanged.
  The lock test (L3) uses a paused copy written to `cari1-tenant-test\tmp`.
* The app runs with process-level environment variables pointing to the local
  stack. `.env.local` is neither read nor changed. `40_api_smoke.mjs` refuses
  non-local URLs. Before its first write it also checks that the app returns
  the synthetic data.

## One-time setup

| Step | Command | Touches |
|---|---|---|
| 1 | `supabase start -x realtime,storage-api,imgproxy,mailpit,postgres-meta,studio,edge-runtime,logflare,vector,supavisor` (in `cari1-tenant-test`) | local Docker |
| 2 | `.\dump_live_schema.ps1 -PoolerHost <aws-N-region.pooler.supabase.com> -ProjectRef <project ref> -SslRootCert <ca.crt>` (you run it; you type the password into pg_dump's own prompt; it is never an argument, environment variable or file). Check the script first with `.\dump_live_schema.ps1 -SelfTestLocal` | **live, read-only** `pg_dump --schema-only` |
| 3 | `.\prepare_local.ps1` | local: `db reset`, restore, schema check, local roles snapshot |
| 4 | Save the live output of `05_roles_and_privileges.sql` as `cari1-tenant-test\readonly\roles_live.txt`, then run `.\compare_roles.ps1` | live read-only query |

## Runs

Every run starts with `.\prepare_local.ps1`, which resets the database.

### Run A: live-like data (16 users, 251 moved rows, 759 rows in 13 tables)

```
.\run_stage.ps1 -Stage T0
.\run_stage.ps1 -Stage T1   # FORWARD MIGRATION
.\run_stage.ps1 -Stage T2
.\run_stage.ps1 -Stage T3
.\run_stage.ps1 -Stage T4   # ROLLBACK
.\run_stage.ps1 -Stage T5
```

### Run B: extended data (adds banks, cheques, transactions and collection matches, plus rollback case A; 261 moved rows, 769 rows)

The same stages as Run A, with `-Extended` on T0: `.\run_stage.ps1 -Stage T0 -Extended`.

### Run C: locks (T6)

```
.\prepare_local.ps1 ; .\run_stage.ps1 -Stage T0 ; .\50_lock_timeout.ps1
```

### Run D: old build vs new build (needs disk space, see below)

| Step | Database state | Command | Expectation |
|---|---|---|---|
| S1 | T0 | `start_app.ps1 -Code old`, smoke `--label old-T0` (no `--write`: rows written here would change the T0 row set that T1 compares against) | today's live behaviour, the control group |
| | | `run_stage.ps1 -Stage T1` | |
| S2 | T1 | old build, smoke `--label old-T1 --write` | invoices and products visible. Known breaks: categories and warehouses lists, cari, safe, bank and cheque detail |
| S3 | T1 | `start_app.ps1 -Code new`, smoke `--label new-T1 --write` | everything works |
| | | `run_stage.ps1 -Stage T4` | rollback, independent checks |
| S4 | T4 | old build, smoke `--label old-T4` | same as S1, plus the rows created in S2 and S3 |
| S5 | T4 | new build, smoke `--label new-T4` | **expected failure**: invoices not visible. This is why the deploy and rollback order matters |

## What each stage checks

| Stage | File | Checks |
|---|---|---|
| T0 | 11 | counts; rows at user id = 251 (or 261); 7 orphans; metadata; old objects; RLS per user and table = rows at the user id |
| T1 | 12 | counts unchanged; every row at the exact expected tenant; backup tables complete (constraint included); app_metadata = T0 + tenant_id; schema diff = exactly the intended set (stock functions and triggers unchanged; among constraints only `current_accounts_tenant_check`, now `CHECK ((tenant_id = app_tenant_id()))`); EXECUTE matrix; RLS with fresh and with old tokens |
| T2 | 20, 21 | sign-up through `supabase_auth_admin`; user_metadata tampering; 21 user actions through `SET ROLE authenticated` + JWT claims (new and old build styles, RPCs, new users); admin change and delete; every result is checked against the behaviour the app needs |
| T3 | 30 | 33 cross-tenant and privilege attempts, all rolled back, including RLS-bypassing SECURITY DEFINER code stopped by the replaced CHECK (n28-n30) and forged or stale JWT tenant claims ignored, a database tenant change applied immediately (n31-n33) |
| T4 | 14 | schema fingerprint = T0; `current_accounts_tenant_check` exactly back (definition, validated, no-inherit); no row lost; R2 counts = T2 actions; every pre-existing row back at its T0 tenant; post-migration rows per table rule; every user's metadata = T0 exactly; cases A, B and C; RLS = old model |
| T5 | 16 | both files abort on a second run; both abort at the pre-flight guard with JWT claims set, with `SET ROLE authenticated`, and when logged in as another role (`session_user` supabase_admin, `SET ROLE postgres`); nothing changes |
| perf | 60 | separate, rolled back: cost of three app_tenant_id() variants in RLS (index, sequential scan, direct vs `(SELECT ...)`) and in the CHECK |
| T6 | 50, 52 | 55P03 after ~5 s on a read lock and on a write lock, with no trace left; a paused migration blocks reads of the 12 ACCESS EXCLUSIVE tables (e.g. categories, invoices) but not of safes, blocks writes everywhere, with no deadlock; rollback lock timeout; rollback succeeds |

Logs: `cari1-tenant-test\logs\*.log`. Results: `SELECT * FROM tenant_test.results WHERE NOT ok;`.
