"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Layers, Package } from "lucide-react";
import { Alert, Avatar, Card, CardHead, DetailGrid, PageHeader, Spinner, Status, tl, ui } from "@/components/app-ui/ui";

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

const back = { href: "/inventory", label: "Stok Yönetimi" };

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
        setError("Ürün detayı alınamadı.");
      } finally {
        setLoading(false);
      }
    };

    if (params?.id) {
      load();
    }
  }, [params?.id]);

  if (loading) return <Spinner />;

  if (error || !product) {
    return (
      <div className={ui.page}>
        <PageHeader title="Ürün" back={back} />
        <Alert>{error || "Ürün bulunamadı."}</Alert>
      </div>
    );
  }

  const name = product.name || "Ürün";
  const stock = Number(product.stock_quantity ?? 0);
  const critical = Number(product.critical_level ?? 0);

  return (
    <div className={ui.page}>
      <PageHeader
        back={back}
        title={
          <span className="flex items-center gap-3">
            <Avatar name={name} square size={36} />
            {name}
          </span>
        }
        description={[product.sku && `SKU ${product.sku}`, product.barcode && `Barkod ${product.barcode}`].filter(Boolean).join(" · ") || undefined}
        actions={
          <Link href="/inventory" className={ui.btn}>
            Listeye dön
          </Link>
        }
      />

      <div className="mb-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Satış fiyatı", value: tl(Number(product.sell_price ?? 0)) },
          { label: "Alış fiyatı", value: tl(Number(product.buy_price ?? 0)) },
          { label: "KDV", value: `%${product.vat_rate ?? 0}` },
          {
            label: "Stok",
            value: (
              <span className="flex items-center gap-2">
                {stock.toLocaleString("tr-TR")}
                {stock <= 0 ? <Status tone="red">Tükendi</Status> : stock <= critical ? <Status tone="amber">Kritik</Status> : null}
              </span>
            ),
          },
        ].map((stat) => (
          <Card key={stat.label} className="p-4">
            <small className={`block ${ui.soft}`}>{stat.label}</small>
            <b className="mt-1 block text-[18px] font-semibold tabular-nums">{stat.value}</b>
          </Card>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card>
          <CardHead icon={<Package aria-hidden="true" />} title="Ürün bilgileri" />
          <DetailGrid
            items={[
              { label: "SKU", value: product.sku || null },
              { label: "Barkod", value: product.barcode || null },
              { label: "Kritik seviye", value: critical },
              { label: "Birim", value: product.unit || null },
            ]}
          />
        </Card>
        <Card>
          <CardHead icon={<Layers aria-hidden="true" />} title="Kumaş detayları" />
          <DetailGrid
            items={[
              { label: "Renk", value: product.color || null },
              { label: "Desen", value: product.pattern || null },
              { label: "Kompozisyon", value: product.composition || null },
              { label: "Genişlik", value: product.width ? `${product.width} cm` : null },
              { label: "Ağırlık", value: product.weight ? `${product.weight} GSM` : null },
            ]}
          />
        </Card>
      </div>

      {product.description ? (
        <Card className="mt-3">
          <CardHead title="Açıklama" />
          <p className={`px-4 pb-4 ${ui.soft}`}>{product.description}</p>
        </Card>
      ) : null}
    </div>
  );
}
