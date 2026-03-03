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

export const downloadInvoicePdf = async (
  invoice: InvoicePdfData,
  items: InvoiceItemPdfRow[]
) => {
  const { jsPDF } = await import("jspdf");
  await import("jspdf-autotable");

  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text("FATURA", 14, 18);
  doc.setFontSize(10);
  doc.text(`Fatura No: ${sanitize(invoice.invoiceNumber)}`, 14, 28);
  doc.text(`Fatura Tipi: ${sanitize(invoice.invoiceType)}`, 14, 34);
  doc.text(`Tarih: ${trDate(invoice.date)}`, 14, 40);
  doc.text(`Musteri/Tedarikci: ${sanitize(invoice.accountName || "-")}`, 14, 46);

  (doc as any).autoTable({
    startY: 54,
    head: [["Urun/Hizmet", "Miktar", "Birim Fiyat", "Tutar"]],
    body: (items || []).map((row) => [
      sanitize(row.productName || "-"),
      String(row.quantity ?? 0),
      trMoney(row.unitPrice),
      trMoney(row.total),
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [41, 128, 185] },
  });

  const finalY = (doc as any).lastAutoTable?.finalY ?? 70;
  doc.text(`Ara Toplam: ${trMoney(invoice.subtotal)}`, 140, finalY + 10);
  doc.text(`Indirim: ${trMoney(invoice.discount)}`, 140, finalY + 16);
  doc.text(`KDV: ${trMoney(invoice.vatAmount)}`, 140, finalY + 22);
  doc.setFontSize(12);
  doc.text(`Genel Toplam: ${trMoney(invoice.totalAmount)}`, 140, finalY + 30);
  doc.setFontSize(10);
  doc.text(`Aciklama: ${sanitize(invoice.description || "-")}`, 14, finalY + 24);

  doc.save(`invoice-${sanitize(invoice.invoiceNumber || invoice.id)}.pdf`);
};

export const downloadAccountStatementPdf = async (
  account: AccountPdfData,
  transactions: TransactionPdfRow[]
) => {
  const { jsPDF } = await import("jspdf");
  await import("jspdf-autotable");

  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("CARI HESAP EKSTRESI", 14, 18);
  doc.setFontSize(10);
  doc.text(`Hesap: ${sanitize(account.name)}`, 14, 28);
  doc.text(`Telefon: ${sanitize(account.phone || "-")}`, 14, 34);
  doc.text(`Vergi No: ${sanitize(account.taxNumber || "-")}`, 14, 40);
  doc.text(`Vergi Dairesi: ${sanitize(account.taxOffice || "-")}`, 14, 46);
  doc.text(`Tur: ${sanitize(account.accountType || "-")}`, 14, 52);
  doc.text(`Bakiye: ${trMoney(account.balance)}`, 14, 58);

  (doc as any).autoTable({
    startY: 66,
    head: [["Tarih", "Islem Tipi", "Aciklama", "Tutar"]],
    body: (transactions || []).map((t) => [
      trDate(t.date),
      sanitize(t.type || "-"),
      sanitize(t.description || "-"),
      trMoney(t.amount),
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [39, 174, 96] },
  });

  const finalY = (doc as any).lastAutoTable?.finalY ?? 80;
  doc.setFontSize(11);
  doc.text(`Guncel Bakiye: ${trMoney(account.balance)}`, 14, finalY + 12);

  doc.save(`cari-ekstre-${sanitize(account.name || account.id)}.pdf`);
};
