# Cari Hareket Akisi

## Veri Modeli

### `current_account_movements`
- Cariye ait tum borclandirma/tahsilat hareketleri burada tutulur.
- `amount` her zaman pozitif tutulur.
- `direction` alaninda `1` veya `-1` saklanir.
- `signed_amount = amount * direction` degeri ile bakiyeye etki izlenir.
- `balance_after` ile hareket sonrasi bakiye saklanir.

### `collection_invoice_matches`
- Bir tahsilatin hangi faturalara ne kadar kapama yaptigi bu tabloda tutulur.
- Kismi tahsilat desteklenir.

## Is Kurali
- Satis faturasi: `direction = 1` (borc artar)
- Alis faturasi: `direction = -1` (borc azalir / tedarikci bakiyesi artiya yaklasir)
- Tahsilat: `direction = -1` (musteri borcu azalir)
- Tedarikci odemesi: `direction = 1` (negatif bakiye sifira yaklasir)

## RPC
- Fonksiyon: `record_current_account_movement`
- Islev:
1. Cari hesabi `FOR UPDATE` ile kilitler
2. Bakiyeyi atomik gunceller
3. Hareketi `current_account_movements` tablosuna kaydeder
4. Varsa fatura eslestirmelerini `collection_invoice_matches` tablosuna yazar

## API Akisi

### Fatura olusturma (`POST /api/invoices`)
1. Fatura kaydi olusur.
2. Otomatik olarak `record_current_account_movement` cagrilir.
3. Hareket kaydi basarisiz olursa fatura geri silinir (tutarlilik icin).

### Tahsilat/Odeme girisi (`POST /api/current-accounts/:id/collections`)
Ornek payload:

```json
{
  "movementType": "COLLECTION",
  "amount": 3000,
  "currency": "TRY",
  "documentNo": "BNK-2026-00045",
  "documentDate": "2026-03-04",
  "description": "Banka havalesi tahsilati",
  "matches": [
    { "invoiceId": "fatura-uuid-1", "amount": 2500 },
    { "invoiceId": "fatura-uuid-2", "amount": 500 }
  ]
}
```

