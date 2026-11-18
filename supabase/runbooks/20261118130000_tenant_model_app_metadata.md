# Canlı migration planı: 20261118130000_tenant_model_app_metadata

İleri: `supabase/migrations/20261118130000_tenant_model_app_metadata.sql`
Geri: `supabase/rollbacks/20261118130000_tenant_model_app_metadata.down.sql`
Yerel test: `supabase/tests/tenant-migration/run_order.md` (Run A, B, C, D geçti, 2026-11-18)

**Her canlı adım ayrı onayla çalışır.** Bu belge hiçbir şeyi çalıştırmaz.

## Özet

| | |
|---|---|
| Ne değişir | Tenant kimliği: kullanıcı ID → firma ID (`app_metadata.tenant_id`). Kullanıcı ID'sinde duran satırlar firma ID'sine taşınır. 20 politika yenilenir, 28 politika `(SELECT app_tenant_id())` ile sarılır. Fonksiyonlar, varsayılanlar (default), 4 tetikleyici (trigger) ve `current_accounts_tenant_check` güncellenir. Stok mantığına dokunulmaz. |
| Süre | Yerelde 0,2 s. Kilitler bu süre boyunca tutulur. |
| Kilit etkisi | 12 tabloda ACCESS EXCLUSIVE (okuma ve yazma bekler); `safes` tablosunda SHARE ROW EXCLUSIVE (okuma serbest, yazma bekler). Biri kilidi tutuyorsa 5 s sonra `55P03` ile hiçbir şey yapmadan durur; sonra tekrar denenir. |
| Kullanıcılar | Yeniden giriş gerekmez: `app_tenant_id()` tenant'ı veritabanından okur, eski token'lar doğru firmaya çözülür (T1 testi, `old` token). |
| Sıra | **Önce migration, hemen ardından yeni kodun deploy'u.** Geri dönüşte **önce eski kod, sonra rollback SQL.** |

Ara durumlarda ne olur (Run D):
- Eski kod + yeni şema (migration ile deploy arası): faturalar ve ürünler görünür; kategori ve depo listeleri boş, cari/kasa/banka/çek detayı açılmaz. Eski kodun yazdığı satırlar doğru firmaya gider.
- Yeni kod + eski şema: faturalar, ürünler ve stok hareketleri **görünmez**. Bu yüzden yeni kod migration'dan önce yayına alınmaz.

## Bağlantı yöntemi

Şema dökümünde kullanılan yöntemin aynısı kullanılır: yerel `supabase/postgres` imajındaki `psql`, session pooler (port 5432), `sslmode=verify-full`, şifre yalnızca `psql -W` isteminde yazılır. Şifre argümanda, ortam değişkeninde ya da dosyada yer almaz. Dashboard'daki SQL Editor kullanılmaz: rol taklidi (role impersonation) ön kontrolde zaten durdurulur, ama `psql` ve `ON_ERROR_STOP` davranışı yerelde test edilen yoldur.

```powershell
# <POOLER_HOST>: Dashboard -> Connect -> Session pooler (aws-N-<region>.pooler.supabase.com)
# <PROJECT_REF>: Dashboard -> Project Settings -> General -> Project ID
$ca = "$env:USERPROFILE\Desktop\cari1-tenant-test\certs\prod-ca-2021.crt"   # Dashboard -> Database -> SSL Configuration
$sb = "$env:USERPROFILE\Desktop\cari1\supabase"
$logs = "$env:USERPROFILE\Desktop\cari1-tenant-test\logs"
# <DOSYA> = /work/... ve <LOG> = /out/....txt (aşağıdaki adımlarda verilir)
docker run --rm -it -e PGHOST=<POOLER_HOST> -e PGPORT=5432 -e PGUSER=postgres.<PROJECT_REF> -e PGDATABASE=postgres -e PGSSLMODE=verify-full -e PGSSLROOTCERT=/certs/ca.crt -e PGAPPNAME=tenant_migration -v "${ca}:/certs/ca.crt:ro" -v "${sb}:/work:ro" -v "${logs}:/out" --entrypoint psql public.ecr.aws/supabase/postgres:17.11.0.006 -W -X -P pager=off -v ON_ERROR_STOP=1 -L <LOG> -f <DOSYA>
```

Notlar (2026-11-18 ön kontrolünden):
- **`-P pager=off` şart.** Yoksa geniş tablolar sayfalayıcıda (pager) açılır ve `q` basılana kadar transaction açık kalır. Migration sırasında bu, 12 tablodaki ACCESS EXCLUSIVE kilidinin `q`'ya basılana kadar sürmesi demektir.
- **Komut yapıştırınca kendiliğinden başlarsa Enter'a basma.** Basılan Enter şifre istemine boş şifre olarak gider (`fe_sendauth: no password supplied`).
- **Pooler üzerinden `session_user` ve `current_user` = `postgres`**, yani migration'ın ön kontrolü geçer (canlıda doğrulandı).

## Adım 0: Hazırlık (migration'dan önceki gün)

1. **Yedek:** Dashboard → Database → Backups bölümünde son günlük yedeğin tarihine bak. PITR varsa açık olduğunu doğrula. Plan izin veriyorsa elle bir yedek al.
2. **Yeni kod hazır:** `fix/faz0-guvenlik` dalının build'i hazır olsun (Vercel'de preview deployment; "Promote" tek tıkla yapılabilsin). Preview, canlı veritabanına bağlıysa adresini kimseyle paylaşma (yeni kod + eski şema = faturalar görünmez).
3. **Bir önceki production deployment'ı not et:** geri dönüşte "Instant Rollback" ile buna dönülecek.
4. **Ön kontrol sorgusu** (salt okunur, ayrı onayla): `<DOSYA>` = `/work/runbooks/20261118130000_preflight.sql`, `<LOG>` = `/out/live_preflight.txt`. Yalnızca sayı döndürür, kayıt içeriği döndürmez.
   - **2026-11-18 canlı sonucu:**
     - 16 kullanıcının 16'sı eşleşti; 11'i kendi firma satırını gösteriyor, 5'inin firma satırı yok.
     - `meta_other_owner`, `shared_tenant` ve `tenant_is_other_user` hepsi 0.
     - Taşınacak satır: **251** (current_account_movements 232, current_accounts 16, categories 1, safes 1, warehouses 1).
     - Uzun süredir açık transaction yok.

   Durma koşulları:

| Kontrol | Beklenen | Değilse |
|---|---|---|
| `session_user`, `current_user` | `postgres`, `postgres` | Dur. Migration'ın ön kontrolü de durur (değişiklik olmaz), ama bağlantı yöntemini düzelt. |
| `not_yet_run` | `true` | Migration daha önce çalışmış. Dur. |
| `check_def` | `CHECK ((tenant_id = get_jwt_tenant()))` | Kısıt beklenenden farklı; migration da durur. Dur, incele. |
| `meta_not_own_tenant` | `0` | **Dur.** `user_metadata.tenant_id` değeri, kullanıcının kendi `tenants` satırını göstermeyen kullanıcılar var (kullanıcının kendisi değiştirmiş olabilir). Migration bu değeri firma olarak alır. Elle incele. |
| `shared_tenant`, `tenant_is_other_user` | `0`, `0` | Migration durur. Dur, incele. |
| `rows_to_move` (tablo başına) | Not al | Migration sonunda `Migration OK: N rows moved` ile karşılaştırılır. |
| `long_tx` | 0 satır | 30 s'den uzun açık transaction var. Kilit bekler, 5 s sonra `55P03`. Bitmesini bekle. |

## Adım 1: Migration (bakım penceresi, düşük trafik saati)

1. Ön kontrolü (Adım 0.4) tekrar çalıştır; değerler aynı olmalı.
2. Migration'ı çalıştır: `<DOSYA>` = `/work/migrations/20261118130000_tenant_model_app_metadata.sql`, `<LOG>` = `/out/live_migration.txt`
3. Beklenen son satırlar:
   - `NOTICE:  Migration OK: <N> rows moved, <M> users updated`
   - `COMMIT`
   - N = ön kontroldeki `rows_to_move` toplamı, M = `users_mapped`.
4. Hata alırsan: dosya tek bir transaction. `ERROR` görülürse **hiçbir şey uygulanmamıştır**.
   - `55P03 lock timeout` → birkaç dakika sonra tekrar dene.
   - `Abort: ...` veya `Check failed: ...` → dur, mesajı bana getir.

## Adım 2: Yeni kodu yayına al (migration'dan hemen sonra)

1. Hazır build'i promote et (Vercel → Deployments → Promote to Production).
2. Arada geçen süre boyunca eski kod çalışır; yukarıdaki "ara durum" tablosuna bak. Bu süre ne kadar kısa olursa o kadar iyi.

## Adım 3: Kontrol (deploy sonrası)

1. **Salt okunur son kontrol:** `<DOSYA>` = `/work/runbooks/20261118130000_postcheck.sql`, `<LOG>` = `/out/live_postcheck.txt`
   - `moved_rows` = N
   - `users_with_app_tenant` = M
   - `rows_left_at_user_id` = 0
   - `check_def` = `CHECK ((tenant_id = app_tenant_id()))`
   - `normalize_triggers` = 4
2. **Uygulamada elle kontrol, kendi hesabınla:** fatura listesi, ürünler, stok hareketleri, kategoriler, depolar, cari detay, kasa ve banka listesi. Bir test cari kaydı ekleyip sil.
3. **30 dakika log izle:** Supabase → Logs → Postgres / API. `42501` (RLS), `23514` (CHECK) ve `permission denied` hatalarına bak.

## Geri dönüş (gerekirse)

Ne zaman: migration COMMIT olduktan sonra uygulamada düzeltilemeyen bir kopukluk varsa. (Migration hata verdiyse geri dönüşe gerek yoktur; hiçbir şey uygulanmamıştır.)

1. **Önce kodu geri al:** Vercel → Instant Rollback ile bir önceki production deployment'a dön.
2. **Sonra rollback SQL'i çalıştır:** `<DOSYA>` = `/work/rollbacks/20261118130000_tenant_model_app_metadata.down.sql`, `<LOG>` = `/out/live_rollback.txt`
3. Beklenen çıktı:
   - `R2: <a> reverted, <b> skipped, <c> missing` notice'ları ve tablo başına özet satırları;
   - `skipped`: migration sonrası başka tenant'a taşınmış satırlar. Üzerine yazılmaz, `backup.tenant_rollback_20261118_rows` tablosunda listelenir.
   - `missing`: migration sonrası silinmiş satırlar.
4. Migration sonrası oluşan satırlar:
   - `invoices`, `invoice_items`, `products` ve `stock_movements` tablolarında firma ID'sinde kalır;
   - diğer 9 tabloda, satırı oluşturanın kullanıcı ID'sine döner.
5. **Elle bak:** `backup.tenant_rollback_20261118_users` tablosunda `C_new_user_conflict_app_tenant_kept` olarak işaretli kullanıcılar varsa (migration sonrası kayıt olmuş ve `user_metadata` alanını değiştirmiş kullanıcılar), bunlar elle karar ister.

## Sonra

- `backup` şemasındaki tablolar en az 30 gün tutulur, sonra ayrı onayla silinir.
- Bu migration'ın kapsamı dışındaki bulgular:
  - **Canlıda fatura silme açığı:** `DELETE /api/invoices/[id]`, cari bağlantısı olmayan faturayı her kullanıcıya sildiriyor. Yeni kodda düzeltildi, ama yeni kod migration'a bağlı. Migration'ı beklemeden kapatmak için yalnızca bu route'un düzeltmesi `main` dalına ayrı bir hotfix olarak alınabilir.
  - **Tahsilatta yarım kayıt:** tahsilat route'u `transactions.transaction_type` sütununa yazıyor, ama sütun şemada yok. Cari hareketi oluşuyor, finans işlemi oluşmuyor. Eski ve yeni kodda aynı.
  - Başka firmanın cari detayı istendiğinde 404 yerine 500 dönüyor (veri sızmıyor).
