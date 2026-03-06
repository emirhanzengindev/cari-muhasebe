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

type AccountStatementPdfRow = {
  date?: string;
  invoiceNo?: string;
  type?: string;
  description?: string;
  productName?: string;
  unit?: string;
  quantity?: number;
  unitPrice?: number;
  currency?: string;
  documentType?: string;
  debit?: number;
  credit?: number;
};

const trDate = (value?: string) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("tr-TR");
};

const trNumber = (value?: number) =>
  new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));

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
      trNumber(row.unitPrice),
      trNumber(row.total),
    ]),
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [32, 88, 152], textColor: 255 },
    theme: "grid",
  });

  const finalY = (doc as any).lastAutoTable?.finalY ?? 90;

  doc.setDrawColor(200, 200, 200);
  doc.rect(120, finalY + 4, 76, 34);
  doc.setFontSize(10);
  doc.text(`Ara Toplam: ${trNumber(invoice.subtotal)}`, 124, finalY + 12);
  doc.text(`Indirim: ${trNumber(invoice.discount)}`, 124, finalY + 18);
  doc.text(`KDV: ${trNumber(invoice.vatAmount)}`, 124, finalY + 24);
  doc.setFontSize(11);
  doc.text(`Genel Toplam: ${trNumber(invoice.totalAmount)}`, 124, finalY + 31);

  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text("Bu belge elektronik olarak olusturulmustur.", 14, 288);

  doc.save(`invoice-${sanitize(invoice.invoiceNumber || invoice.id)}.pdf`);
};

export const downloadAccountStatementPdf = async (
  account: AccountPdfData,
  rows: AccountStatementPdfRow[]
) => {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const normalizedRows = Array.isArray(rows) ? rows : [];
  const datedRows = normalizedRows
    .map((r) => ({ ...r, _d: r.date ? new Date(r.date) : null }))
    .sort((a, b) => {
      const at = a._d?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const bt = b._d?.getTime() ?? Number.MAX_SAFE_INTEGER;
      return at - bt;
    });

  const today = trDate(new Date().toISOString());
  const minDate = datedRows.find((x) => x._d && !Number.isNaN(x._d.getTime()))?._d;
  const maxDate = [...datedRows]
    .reverse()
    .find((x) => x._d && !Number.isNaN(x._d.getTime()))?._d;
  const rangeText =
    minDate && maxDate
      ? `${minDate.toLocaleDateString("tr-TR")} - ${maxDate.toLocaleDateString("tr-TR")}`
      : `${today} - ${today}`;

  doc.setFontSize(12);
  doc.text("CARI EKSTRE", 105, 18, { align: "center" });
  doc.setFontSize(10);
  doc.text(`Tarih: ${today}`, 105, 25, { align: "center" });
  doc.setFontSize(10);
  doc.text("Hesap Bilgileri:", 14, 40);
  doc.text(`Unvan: ${sanitize(account.name)}`, 14, 50);
  doc.text(`Tarih Araligi: ${sanitize(rangeText)}`, 14, 60);

  let running = 0;
  const body = (datedRows || []).map((tx) => {
    const debit = Number(tx.debit ?? 0);
    const credit = Number(tx.credit ?? 0);
    running += debit - credit;
    const currencySymbol = tx.currency === "USD" ? "$" : "₺";

    return [
      trDate(tx.date),
      sanitize(tx.invoiceNo || "-"),
      sanitize(tx.description || "-"),
      sanitize(tx.productName || "-"),
      sanitize(tx.unit || "-"),
      String(tx.quantity ?? "-"),
      tx.unitPrice !== undefined && tx.unitPrice !== null ? trNumber(tx.unitPrice) : "-",
      tx.currency ? currencySymbol : "-",
      sanitize(tx.documentType || tx.type || "-"),
      debit ? trNumber(debit) : "-",
      credit ? trNumber(credit) : "-",
      trNumber(running),
    ];
  });

  const statementRows =
    body.length > 0
      ? body
      : [["-", "-", "Hareket bulunamadi", "-", "-", "-", "-", "-", "-", trNumber(account.balance)]];

  autoTable(doc, {
    startY: 70,
    head: [[
      "Tarih",
      "Fatura No",
      "Aciklama",
      "Urun",
      "Birim",
      "Miktar",
      "Fiyat",
      "Para",
      "Evrak Turu",
      "Borc",
      "Alacak",
      "Kalan",
    ]],
    body: statementRows,
    styles: { fontSize: 7, cellPadding: 1.5, overflow: "ellipsize" },
    headStyles: { fillColor: [210, 210, 210], textColor: 0 },
    columnStyles: {
      0: { cellWidth: 16 }, // Tarih
      1: { cellWidth: 14 }, // Fatura No
      2: { cellWidth: 38 }, // Aciklama
      3: { cellWidth: 20 }, // Urun
      4: { cellWidth: 10 }, // Birim
      5: { cellWidth: 9 },  // Miktar
      6: { cellWidth: 12 }, // Fiyat
      7: { cellWidth: 8 },  // Para
      8: { cellWidth: 18 }, // Evrak Turu
      9: { cellWidth: 13 }, // Borc
      10: { cellWidth: 13 }, // Alacak
      11: { cellWidth: 13 }, // Kalan
    },
    theme: "grid",
    margin: { left: 10, right: 10 },
  });

  const finalY = (doc as any).lastAutoTable?.finalY ?? 95;
  const endingBalance = running !== 0 ? running : Number(account.balance ?? 0);
  doc.setFontSize(9);
  doc.text(
    `Toplam Bakiye: ${trNumber(endingBalance)}`,
    196,
    finalY + 16,
    { align: "right" }
  );

  doc.save(`cari-ekstre-${sanitize(account.name || account.id)}.pdf`);
};

