import autoTable from "jspdf-autotable";

type InvoicePdfData = {
  id: string;
  invoiceNumber: string;
  invoiceType: string;
  date?: string;
  totalAmount: number;
  subtotal?: number;
  discount?: number;
  vatAmount?: number;
  description?: string;
  accountName?: string;
};

type InvoiceItemPdfRow = {
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

type AccountPdfData = {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  taxNumber?: string;
  taxOffice?: string;
  accountType?: string;
  balance?: number;
};

type TransactionPdfRow = {
  date?: string;
  type?: string;
  description?: string;
  amount?: number;
};

const trDate = (value?: string) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("tr-TR");
};

const trMoney = (value?: number) =>
  new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(
    Number(value ?? 0)
  );

const sanitize = (input?: string) =>
  String(input ?? "")
    .replace(/İ/g, "I")
    .replace(/ı/g, "i")
    .replace(/Ğ/g, "G")
    .replace(/ğ/g, "g")
    .replace(/Ü/g, "U")
    .replace(/ü/g, "u")
    .replace(/Ş/g, "S")
    .replace(/ş/g, "s")
    .replace(/Ö/g, "O")
    .replace(/ö/g, "o")
    .replace(/Ç/g, "C")
    .replace(/ç/g, "c");

const drawHeader = (doc: any, title: string, subtitle?: string) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFillColor(25, 57, 102);
  doc.rect(0, 0, pageWidth, 34, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text(sanitize(title), 14, 14);

  doc.setFontSize(9);
  doc.text("ON MUHASEBE", 14, 21);
  doc.text(`Olusturma Tarihi: ${trDate(new Date().toISOString())}`, 14, 27);

  if (subtitle) {
    doc.setFontSize(9);
    doc.text(sanitize(subtitle), pageWidth - 14, 21, { align: "right" });
  }

  doc.setTextColor(20, 20, 20);
};

export const downloadInvoicePdf = async (
  invoice: InvoicePdfData,
  items: InvoiceItemPdfRow[]
) => {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  drawHeader(doc, "FATURA", `No: ${sanitize(invoice.invoiceNumber)}`);

  doc.setFontSize(10);
  doc.text(`Musteri/Tedarikci: ${sanitize(invoice.accountName || "-")}`, 14, 44);
  doc.text(`Fatura Tipi: ${sanitize(invoice.invoiceType)}`, 14, 50);
  doc.text(`Fatura Tarihi: ${trDate(invoice.date)}`, 14, 56);
  doc.text(`Aciklama: ${sanitize(invoice.description || "-")}`, 14, 62);

  autoTable(doc, {
    startY: 70,
    head: [["#", "Urun/Hizmet", "Miktar", "Birim Fiyat", "Tutar"]],
    body: (items || []).map((row, idx) => [
      String(idx + 1),
      sanitize(row.productName || "Kalem"),
      String(row.quantity ?? 0),
      trMoney(row.unitPrice),
      trMoney(row.total),
    ]),
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [32, 88, 152], textColor: 255 },
    theme: "grid",
  });

  const finalY = (doc as any).lastAutoTable?.finalY ?? 90;

  doc.setDrawColor(200, 200, 200);
  doc.rect(120, finalY + 4, 76, 34);
  doc.setFontSize(10);
  doc.text(`Ara Toplam: ${trMoney(invoice.subtotal)}`, 124, finalY + 12);
  doc.text(`Indirim: ${trMoney(invoice.discount)}`, 124, finalY + 18);
  doc.text(`KDV: ${trMoney(invoice.vatAmount)}`, 124, finalY + 24);
  doc.setFontSize(11);
  doc.text(`Genel Toplam: ${trMoney(invoice.totalAmount)}`, 124, finalY + 31);

  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text("Bu belge elektronik olarak olusturulmustur.", 14, 288);

  doc.save(`invoice-${sanitize(invoice.invoiceNumber || invoice.id)}.pdf`);
};

export const downloadAccountStatementPdf = async (
  account: AccountPdfData,
  transactions: TransactionPdfRow[]
) => {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  drawHeader(doc, "CARI HESAP EKSTRESI", sanitize(account.name));

  doc.setFontSize(10);
  doc.text(`Cari Adi: ${sanitize(account.name)}`, 14, 44);
  doc.text(`Telefon: ${sanitize(account.phone || "-")}`, 14, 50);
  doc.text(`Vergi Dairesi/No: ${sanitize(account.taxOffice || "-")} / ${sanitize(account.taxNumber || "-")}`, 14, 56);
  doc.text(`Tur: ${sanitize(account.accountType || "-")}`, 14, 62);

  let running = 0;
  const body = (transactions || []).map((tx) => {
    const amount = Number(tx.amount ?? 0);
    const upperType = String(tx.type || "").toUpperCase();
    const isPayment = upperType.includes("PAYMENT") || upperType.includes("ODEME") || amount < 0;

    const borc = isPayment ? 0 : Math.abs(amount);
    const alacak = isPayment ? Math.abs(amount) : 0;
    running += borc - alacak;

    return [
      trDate(tx.date),
      sanitize(tx.type || "-"),
      sanitize(tx.description || "-"),
      borc ? trMoney(borc) : "-",
      alacak ? trMoney(alacak) : "-",
      trMoney(running),
    ];
  });

  autoTable(doc, {
    startY: 70,
    head: [["Tarih", "Islem", "Aciklama", "Borc", "Alacak", "Bakiye"]],
    body,
    styles: { fontSize: 8.5, cellPadding: 2 },
    headStyles: { fillColor: [26, 142, 89], textColor: 255 },
    theme: "grid",
  });

  const finalY = (doc as any).lastAutoTable?.finalY ?? 95;
  doc.setDrawColor(200, 200, 200);
  doc.rect(120, finalY + 5, 76, 18);
  doc.setFontSize(11);
  doc.text(`Guncel Bakiye: ${trMoney(account.balance)}`, 124, finalY + 16);

  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text("Bu ekstre bilgi amaclidir.", 14, 288);

  doc.save(`cari-ekstre-${sanitize(account.name || account.id)}.pdf`);
};

