"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type ProductDetail = {
  id: string;
  name?: string;
  sku?: string;
  barcode?: string;
  buy_price?: number;
  sell_price?: number;
  vat_rate?: number;
  stock_quantity?: number;
  critical_level?: number;
  color?: string;
  unit?: string;
  pattern?: string;
  composition?: string;
  width?: number;
  weight?: number;
  description?: string;
};

export default function InventoryProductDetailPage() {
  const params = useParams<{ id: string }>();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/products/${params.id}`, {
          credentials: "include",
        });
        if (!res.ok) {
          throw new Error(await res.text());
        }
        setProduct(await res.json());
      } catch {
        setError("Urun detayi alinamadi.");
      } finally {
        setLoading(false);
      }
    };

    if (params?.id) {
      load();
    }
  }, [params?.id]);

  if (loading) {
    return <div className="py-6">Yukleniyor...</div>;
  }

  if (error || !product) {
    return (
      <div className="py-6">
        <p className="text-red-600">{error || "Urun bulunamadi."}</p>
        <Link href="/inventory" className="text-blue-600 underline">
          Envantere don
        </Link>
      </div>
    );
  }

  return (
    <div className="py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{product.name || "Urun"}</h1>
        <Link href="/inventory" className="px-3 py-2 rounded border">
          Envantere don
        </Link>
      </div>

      <div className="bg-white shadow rounded p-4 space-y-2">
        <p><strong>SKU:</strong> {product.sku || "-"}</p>
        <p><strong>Barkod:</strong> {product.barcode || "-"}</p>
        <p><strong>Alis:</strong> {(product.buy_price ?? 0).toFixed(2)}</p>
        <p><strong>Satis:</strong> {(product.sell_price ?? 0).toFixed(2)}</p>
        <p><strong>KDV:</strong> %{product.vat_rate ?? 0}</p>
        <p><strong>Stok:</strong> {product.stock_quantity ?? 0}</p>
        <p><strong>Kritik seviye:</strong> {product.critical_level ?? 0}</p>
        <p><strong>Renk:</strong> {product.color || "-"}</p>
        <p><strong>Birim:</strong> {product.unit || "-"}</p>
        <p><strong>Desen:</strong> {product.pattern || "-"}</p>
        <p><strong>Kompozisyon:</strong> {product.composition || "-"}</p>
        <p><strong>Genislik:</strong> {product.width ?? "-"}</p>
        <p><strong>Agirlik:</strong> {product.weight ?? "-"}</p>
        <p><strong>Aciklama:</strong> {product.description || "-"}</p>
      </div>
    </div>
  );
}
