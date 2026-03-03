"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

export default function EditInvoicePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  return (
    <div className="py-6">
      <h1 className="text-2xl font-bold text-gray-900">Fatura Duzenle</h1>
      <p className="mt-3 text-sm text-gray-700">
        Bu sayfa olusturuldu. Fatura duzenleme formu henuz implement edilmedi.
      </p>
      <div className="mt-4 flex gap-4">
        <Link href={`/invoices/${id}`} className="text-blue-600 hover:text-blue-800">
          Fatura detayina git
        </Link>
        <Link href="/invoices" className="text-gray-700 hover:text-gray-900">
          Fatura listesine don
        </Link>
      </div>
    </div>
  );
}

