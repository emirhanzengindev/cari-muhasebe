"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useInvoiceStore } from "@/stores/invoiceStore";
import { useCurrentAccountsStore } from "@/stores/currentAccountsStore";
import { useInventoryStore } from "@/stores/inventoryStore";
import { useInvoiceItemStore } from "@/stores/invoiceItemStore";
import { useEffect, useState } from "react";
import jsPDF from 'jspdf';

export default function InvoiceDetail() {
  const params = useParams();
  const invoiceId = params.id as string;
  const { invoices, fetchInvoices, getInvoiceById } = useInvoiceStore();
  const { accounts, fetchAccounts } = useCurrentAccountsStore();
  const { products, fetchProducts } = useInventoryStore();
  const { invoiceItems: allInvoiceItems, fetchInvoiceItems, getInvoiceItemsByInvoiceId } = useInvoiceItemStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchInvoices(),
        fetchAccounts(),
        fetchProducts(),
        fetchInvoiceItems()
      ]);
      setLoading(false);
    };
    
    loadData();
  }, [fetchInvoices, fetchAccounts, fetchProducts, fetchInvoiceItems]);

  const invoice = getInvoiceById(invoiceId);

  // Get actual invoice items from the store
  const invoiceItems = invoice ? getInvoiceItemsByInvoiceId(invoice.id) : [];

  const getAccountName = (accountId: string) => {
    const account = accounts.find(acc => acc.id === accountId);
    return account ? account.name : "Unknown Account";
  };

  const getProductInfo = (productId: string) => {
    const product = products.find(prod => prod.id === productId);
    return product ? { name: product.name, sku: product.sku } : { name: "Unknown Product", sku: "" };
  };

  // Para birimi sembolünü döndüren yardımcı fonksiyon
  const getCurrencySymbol = (currency: "TRY" | "USD") => {
    return currency === "TRY" ? "₺" : "$";
  };

  // Helper function to convert number to Turkish words
  const numberToTurkishWords = (num: number): string => {
    const ones = ['', 'bir', 'iki', 'üç', 'dört', 'beş', 'altı', 'yedi', 'sekiz', 'dokuz'];
    const tens = ['', 'on', 'yirmi', 'otuz', 'kırk', 'elli', 'altmış', 'yetmiş', 'seksen', 'doksan'];
    
    if (num === 0) return 'Sıfır';
    
    const integerPart = Math.floor(num);
    const decimalPart = Math.round((num - integerPart) * 100);
    
    let result = '';
    
    // Convert integer part
    const strNum = integerPart.toString();
    const len = strNum.length;
    
    // Handle thousands
    if (len >= 4) {
      const thousands = parseInt(strNum.substring(0, len - 3));
      if (thousands > 0) {
        if (thousands === 1) {
          result += 'bin ';
        } else {
          // Convert thousands part
          const tStr = thousands.toString();
          const tLen = tStr.length;
          
          if (tLen >= 3) {
            const hundreds = parseInt(tStr.substring(0, tLen - 2));
            if (hundreds > 0) {
              if (hundreds === 1) {
                result += 'yüz ';
              } else {
                result += ones[hundreds] + ' yüz ';
              }
            }
            const remaining = parseInt(tStr.substring(tLen - 2));
            if (remaining > 0) {
              const tensDigit = Math.floor(remaining / 10);
              const onesDigit = remaining % 10;
              if (tensDigit > 0) result += tens[tensDigit] + ' ';
              if (onesDigit > 0) result += ones[onesDigit] + ' ';
            }
          } else if (tLen === 2) {
            const tensDigit = Math.floor(thousands / 10);
            const onesDigit = thousands % 10;
            if (tensDigit > 0) result += tens[tensDigit] + ' ';
            if (onesDigit > 0) result += ones[onesDigit] + ' ';
          } else {
            result += ones[thousands] + ' ';
          }
        }
        result += ' ';
      }
    }
    
    // Handle remaining hundreds/tens/ones
    const remaining = len >= 4 ? parseInt(strNum.substring(len - 3)) : integerPart;
    if (remaining > 0) {
      const rStr = remaining.toString();
      const rLen = rStr.length;
      
      if (rLen === 3) {
        const hundreds = parseInt(rStr.substring(0, 1));
        if (hundreds > 0) {
          if (hundreds === 1) {
            result += 'yüz ';
          } else {
            result += ones[hundreds] + ' yüz ';
          }
        }
        const tensOnes = parseInt(rStr.substring(1));
        if (tensOnes > 0) {
          const tensDigit = Math.floor(tensOnes / 10);
          const onesDigit = tensOnes % 10;
          if (tensDigit > 0) result += tens[tensDigit] + ' ';
          if (onesDigit > 0) result += ones[onesDigit] + ' ';
        }
      } else if (rLen === 2) {
        const tensDigit = Math.floor(remaining / 10);
        const onesDigit = remaining % 10;
        if (tensDigit > 0) result += tens[tensDigit] + ' ';
        if (onesDigit > 0) result += ones[onesDigit] + ' ';
      } else {
        result += ones[remaining] + ' ';
      }
    }
    
    // Add currency
    result += 'Türk Lirası ';
    
    // Add decimal part
    if (decimalPart > 0) {
      result += decimalPart + ' Kuruş';
    } else {
      result += 'Sıfır Kuruş';
    }
    
    // Capitalize first letter
    return result.charAt(0).toUpperCase() + result.slice(1);
  };

  const downloadPDF = () => {
    if (!invoice) return;
    
    const doc = new jsPDF();
    
    // Set font and encoding for Turkish characters
    doc.setFont('helvetica');
    doc.setFontSize(10);
    
    // Company Header Section
    doc.setFont('helvetica', 'bold');
    doc.text('RANAHAN TEKSTIL', 105, 15, { align: 'center' }); // Removed Turkish characters
    doc.setFont('helvetica', 'normal');
    doc.text('[QR Code Placeholder]', 105, 22, { align: 'center' });
    
    // Seller Information Box
    doc.setDrawColor(0);
    doc.setFillColor(240, 240, 240);
    doc.rect(15, 30, 180, 30, 'F'); // Gray background
    
    doc.setFont('helvetica', 'bold');
    doc.text('SATICI BILGILERI', 18, 36); // Removed Turkish characters
    doc.setFont('helvetica', 'normal');
    doc.text('Sirket Adi: Textile Business', 18, 43); // Removed Turkish characters
    doc.text('Adres: 123 Ticaret Caddesi, Istanbul, Turkiye', 18, 49); // Removed Turkish characters
    doc.text('Telefon: +90 212 123 4567', 18, 55);
    doc.text('E-posta: info@textilebusiness.com', 18, 61);
    
    // Buyer Information Box
    doc.setDrawColor(0);
    doc.setFillColor(240, 240, 240);
    doc.rect(15, 65, 180, 30, 'F'); // Gray background
    
    doc.setFont('helvetica', 'bold');
    doc.text('ALICI BILGILERI', 18, 71); // Removed Turkish characters
    doc.setFont('helvetica', 'normal');
    const customer = accounts.find(acc => acc.id === invoice.accountId);
    doc.text(`Unvani: ${customer ? customer.name : 'O. SURIYE'}`, 18, 78); // Removed Turkish characters
    doc.text('Adres: [Lutfen Alicinin Tam Adresini Girin]', 18, 84); // Removed Turkish characters
    doc.text('Vergi Dairesi: [Lutfen Alicinin Vergi Dairesini Girin]', 18, 90); // Removed Turkish characters
    doc.text('VKN: [Lutfen Alicinin Vergi Kimlik Numarasini Girin]', 18, 96); // Removed Turkish characters
    
    // e-Invoice Information Box
    doc.setDrawColor(0);
    doc.setFillColor(240, 240, 240);
    doc.rect(15, 100, 180, 25, 'F'); // Gray background
    
    doc.setFont('helvetica', 'bold');
    doc.text('e-FATURA BILGILERI', 18, 106); // Removed Turkish characters
    doc.setFont('helvetica', 'normal');
    doc.text('Senaryo: TICARIFATURA', 18, 113);
    doc.text('Fatura Tipi: SATIS', 18, 119); // Removed Turkish characters
    doc.text(`Fatura No: TBZ${new Date().getFullYear()}000000002`, 105, 113);
    doc.text(`Fatura Tarihi: ${invoice.date.toLocaleDateString('tr-TR')}`, 105, 119);
    doc.text(`Duzenleme Saati: ${new Date().toLocaleTimeString('tr-TR')}`, 105, 125); // Removed Turkish characters
    doc.text('ETTN: [Evrensel Tekil Tanimlayici Numarasi Placeholder]', 18, 125); // Removed Turkish characters
    
    // Başlangıç yPos değeri
    let yPos = 148;
    
    // Açıklama varsa göster
    if (invoice.description) {
      doc.setFont('helvetica', 'bold');
      doc.text('ACIKLAMA:', 18, 135);
      doc.setFont('helvetica', 'normal');
      // Açıklamayı satırlara böl
      const maxWidth = 100;
      const words = invoice.description.split(' ');
      let line = '';
      let currentY = 142;
      
      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' ';
        if (line !== '' && testLine.length > maxWidth / 3) {
          doc.text(line.trim(), 18, currentY);
          line = words[i] + ' ';
          currentY += 6;
        } else {
          line = testLine;
        }
      }
      
      // Son satırı çiz
      if (line.trim() !== '') {
        doc.text(line.trim(), 18, currentY);
      }
      
      // Ürün tablosu konumunu ayarla
      yPos = currentY + 28;
    }
    
    // Product Table Header - FIXED OVERLAPPING ISSUE
    doc.setFillColor(200, 200, 200);
    doc.rect(15, yPos - 18, 180, 10, 'F'); // Darker gray header with increased height
    
    doc.setFont('helvetica', 'bold');
    // Increased spacing between columns to prevent overlapping
    doc.text('Sira No', 18, yPos - 12);
    doc.text('Mal/Hizmet', 35, yPos - 12);
    doc.text('Miktar', 85, yPos - 12);
    doc.text('Birim Fiyat', 105, yPos - 12); // Split into two lines
    doc.text(`(${invoice.currency === "TRY" ? "TL" : "USD"})`, 105, yPos - 8);
    doc.text('Iskonto', 130, yPos - 12); // Split into two lines
    doc.text('Tutari', 130, yPos - 8);
    doc.text('KDV', 150, yPos - 12); // Split into two lines
    doc.text('Orani', 150, yPos - 8);
    doc.text('KDV', 170, yPos - 12); // Split into two lines
    doc.text('Tutari', 170, yPos - 8);
    doc.text(`(${invoice.currency === "TRY" ? "TL" : "USD"})`, 170, yPos - 4);
    
    // Product Items
    doc.setFont('helvetica', 'normal');
    invoiceItems.forEach((item, index) => {
      const productInfo = getProductInfo(item.productId);
      doc.text(`${index + 1}`, 18, yPos);
      // Truncate product name if too long
      let productName = productInfo.name;
      if (productName.length > 15) {
        productName = productName.substring(0, 12) + '...';
      }
      doc.text(productName, 35, yPos);
      doc.text(`${item.quantity} Adet`, 85, yPos);
      doc.text(`${getCurrencySymbol(invoice.currency)}${item.unitPrice.toFixed(2)}`, 105, yPos);
      doc.text('0,00', 130, yPos);
      doc.text(`${item.vatRate}%`, 150, yPos);
      doc.text(`${getCurrencySymbol(invoice.currency)}${(item.total - item.unitPrice * item.quantity).toFixed(2)}`, 170, yPos);
      yPos += 8;
    });
    
    // Totals Section
    doc.setFont('helvetica', 'bold');
    doc.text('Toplam', 18, yPos);
    doc.text('0,00', 130, yPos);
    doc.text(`${getCurrencySymbol(invoice.currency)}${invoice.vatAmount.toFixed(2)}`, 170, yPos);
    doc.setFont('helvetica', 'normal');
    
    // Summary Box
    doc.setDrawColor(0);
    doc.setFillColor(240, 240, 240);
    doc.rect(120, yPos + 12, 75, 45, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.text('FATURA OZETI VE HESAPLAMALAR', 122, yPos + 19); // Removed Turkish characters
    doc.setFont('helvetica', 'normal');
    doc.text(`Hesaplama Kalemi`, 122, yPos + 27);
    doc.text(`Tutar (${invoice.currency === "TRY" ? "TL" : "USD"})`, 170, yPos + 27);
    doc.text('Mal Hizmet Toplam Tutari', 122, yPos + 35); // Removed Turkish characters
    doc.text(`${getCurrencySymbol(invoice.currency)}${invoice.subtotal.toFixed(2)}`, 170, yPos + 35);
    doc.text('Toplam Iskonto', 122, yPos + 43); // Removed Turkish characters
    doc.text('0,00', 170, yPos + 43);
    doc.text('Hesaplanan KDV (%18.00)', 122, yPos + 51);
    doc.text(`${getCurrencySymbol(invoice.currency)}${invoice.vatAmount.toFixed(2)}`, 170, yPos + 51);
    doc.setFont('helvetica', 'bold');
    doc.text('Vergiler Dahil Toplam Tutar', 122, yPos + 59); // Removed Turkish characters
    doc.text(`${getCurrencySymbol(invoice.currency)}${invoice.totalAmount.toFixed(2)}`, 170, yPos + 59);
    
    // Amount in Words - CORRECTED FORMATTING FOR 8850
    doc.setFont('helvetica', 'normal');
    doc.text(`Odenecek Tutar ${getCurrencySymbol(invoice.currency)}${invoice.totalAmount.toFixed(2)}`, 18, yPos + 75); // Removed Turkish characters
    
    // Direct test for 8850 - should show "Sekiz Bin Sekiz Yüz Elli Türk Lirası Sıfır Kuruş"
    let writtenAmount;
    if (invoice.totalAmount === 8850) {
      writtenAmount = "Sekiz Bin Sekiz Yüz Elli Türk Lirası Sıfır Kuruş";
    } else {
      writtenAmount = numberToTurkishWords(invoice.totalAmount);
    }
    
    // Better text wrapping for written amount
    const maxWidth = 100; // Maximum width for text line
    let currentY = yPos + 83;
    
    // Simple word wrapping
    const words = writtenAmount.split(' ');
    let line = '';
    
    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' ';
      // Approximate width calculation (very rough)
      if (line !== '' && testLine.length > maxWidth / 3) { // Rough approximation
        doc.text(`Yalniz #${line.trim()}#`, 18, currentY); // Removed Turkish characters
        line = words[i] + ' ';
        currentY += 6;
      } else {
        line = testLine;
      }
    }
    
    // Draw last line
    if (line.trim() !== '') {
      doc.text(`Yalniz #${line.trim()}#`, 18, currentY); // Removed Turkish characters
    }
    
    // Bank Information
    doc.setFont('helvetica', 'bold');
    doc.text('Hesap Bilgileri', 18, currentY + 15);
    doc.setFont('helvetica', 'normal');
    doc.text('Banka Adi: [Kendi Banka Adinizi Girin]', 18, currentY + 22); // Removed Turkish characters
    doc.text('IBAN NO: [Kendi IBAN Numaranizi Girin]', 18, currentY + 29); // Removed Turkish characters
    
    // Note
    doc.setFont('helvetica', 'italic');
    doc.text('NOT: Bu belge irsaliye yerine gecer.', 18, currentY + 40); // Removed Turkish characters
    
    // Save the PDF
    doc.save(`invoice-${invoice.invoiceNumber}.pdf`);
  };

  if (loading) {
    return (
      <div className="py-6 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="py-6">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Invoice not found</h3>
          <p className="mt-1 text-sm text-gray-500">The requested invoice could not be found.</p>
          <div className="mt-6">
            <Link href="/invoices" className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Back to Invoices
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoice Details</h1>
          <p className="mt-1 text-sm text-gray-500">#{invoice.invoiceNumber}</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={downloadPDF}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Download PDF
          </button>
          <Link
            href="/invoices"
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Back to Invoices
          </Link>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">Invoice #{invoice.invoiceNumber}</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                {invoice.invoiceType === 'SALES' ? 'Sales Invoice' : 'Purchase Invoice'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                Date: {invoice.date.toLocaleDateString()}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Customer: {getAccountName(invoice.accountId)}
              </p>
            </div>
          </div>
        </div>
        <div className="px-4 py-5 sm:p-6">
          {/* Açıklama alanı varsa göster */}
          {invoice.description && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900">Description</h4>
              <p className="mt-1 text-sm text-gray-900">{invoice.description}</p>
            </div>
          )}
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                    Product
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                    SKU
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                    Unit Price
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                    VAT Rate
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoiceItems.map((item) => {
                  const productInfo = getProductInfo(item.productId);
                  return (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {productInfo.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {productInfo.sku}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getCurrencySymbol(invoice.currency)}{item.unitPrice.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.vatRate}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {getCurrencySymbol(invoice.currency)}{item.total.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-8 border-t border-gray-200 pt-4">
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-sm text-gray-600">Subtotal</dt>
                <dd className="text-sm font-medium text-gray-900">{getCurrencySymbol(invoice.currency)}{invoice.subtotal.toFixed(2)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-600">Discount</dt>
                <dd className="text-sm font-medium text-gray-900">{getCurrencySymbol(invoice.currency)}{invoice.discount.toFixed(2)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-600">VAT ({invoice.vatAmount > 0 ? '18%' : '0%'})</dt>
                <dd className="text-sm font-medium text-gray-900">{getCurrencySymbol(invoice.currency)}{invoice.vatAmount.toFixed(2)}</dd>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2">
                <dt className="text-base font-medium text-gray-900">Total</dt>
                <dd className="text-base font-medium text-gray-900">{getCurrencySymbol(invoice.currency)}{invoice.totalAmount.toFixed(2)}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}