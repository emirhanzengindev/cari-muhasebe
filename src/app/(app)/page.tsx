"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Package, 
  ShoppingCart, 
  FileText, 
  BarChart3, 
  Users, 
  Shield,
  ArrowRight,
  CheckCircle,
  Plus,
  TrendingUp
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getSupabaseBrowser } from "@/lib/supabase";

type DashboardSummary = {
  totalAccounts: number;
  stockValue: number;
  monthlySales: number;
  pendingInvoicesCount: number;
  pendingInvoicesTotal: number;
  overdueInvoicesCount: number;
  overdueInvoicesTotal: number;
  totalReceivable: number;
  totalDebt: number;
  netBalance: number;
  warnings?: string[];
};

type CurrentAccountOption = {
  id: string;
  name?: string;
  isActive?: boolean;
  is_active?: boolean;
};

type FinanceAccountOption = {
  id: string;
  name?: string;
  balance?: number;
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState("");
  const [accounts, setAccounts] = useState<CurrentAccountOption[]>([]);
  const [safes, setSafes] = useState<FinanceAccountOption[]>([]);
  const [banks, setBanks] = useState<FinanceAccountOption[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAccountId, setPaymentAccountId] = useState("");
  const [paymentType, setPaymentType] = useState<"COLLECTION" | "PAYMENT">("COLLECTION");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "BANK" | "OTHER">("CASH");
  const [paymentSafeId, setPaymentSafeId] = useState("");
  const [paymentBankId, setPaymentBankId] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentDescription, setPaymentDescription] = useState("");
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [paymentSuccess, setPaymentSuccess] = useState("");
  
  // Memoize the component to prevent unnecessary re-renders
  console.log('DASHBOARD: Rendering with user:', !!user);

  const activeAccounts = useMemo(
    () =>
      accounts.filter((account) => account.isActive ?? account.is_active ?? true),
    [accounts]
  );

  const getAuthHeaders = useCallback(async (): Promise<Record<string, string>> => {
    const supabase = getSupabaseBrowser();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) return {};
    return { Authorization: `Bearer ${session.access_token}` };
  }, []);

  const fetchJson = useCallback(
    async <T,>(endpoint: string, fallback: T): Promise<T> => {
      const headers = await getAuthHeaders();
      const response = await fetch(endpoint, {
        headers,
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 404) return fallback;
        throw new Error(await response.text());
      }

      return response.json();
    },
    [getAuthHeaders]
  );

  const loadDashboardData = useCallback(async () => {
    if (!user) return;

    setSummaryLoading(true);
    setSummaryError("");
    try {
      const [summaryBody, accountsBody, safesBody, banksBody] = await Promise.all([
        fetchJson<DashboardSummary>("/api/dashboard/summary", {
          totalAccounts: 0,
          stockValue: 0,
          monthlySales: 0,
          pendingInvoicesCount: 0,
          pendingInvoicesTotal: 0,
          overdueInvoicesCount: 0,
          overdueInvoicesTotal: 0,
          totalReceivable: 0,
          totalDebt: 0,
          netBalance: 0,
          warnings: [],
        }),
        fetchJson<CurrentAccountOption[]>("/api/current-accounts", []),
        fetchJson<FinanceAccountOption[]>("/api/safes", []),
        fetchJson<FinanceAccountOption[]>("/api/banks", []),
      ]);

      setSummary(summaryBody);
      setAccounts(Array.isArray(accountsBody) ? accountsBody : []);
      setSafes(Array.isArray(safesBody) ? safesBody : []);
      setBanks(Array.isArray(banksBody) ? banksBody : []);
    } catch (error) {
      console.error("Dashboard data load error:", error);
      setSummaryError("Dashboard verileri alınamadı.");
    } finally {
      setSummaryLoading(false);
    }
  }, [fetchJson, user]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  useEffect(() => {
    if (activeAccounts.length > 0 && !paymentAccountId) {
      setPaymentAccountId(activeAccounts[0].id);
    }
  }, [activeAccounts, paymentAccountId]);

  useEffect(() => {
    if (safes.length > 0 && !paymentSafeId) {
      setPaymentSafeId(safes[0].id);
    }
  }, [safes, paymentSafeId]);

  useEffect(() => {
    if (banks.length > 0 && !paymentBankId) {
      setPaymentBankId(banks[0].id);
    }
  }, [banks, paymentBankId]);

  const resetPaymentForm = () => {
    setPaymentType("COLLECTION");
    setPaymentMethod("CASH");
    setPaymentAmount("");
    setPaymentDate(new Date().toISOString().split("T")[0]);
    setPaymentDescription("");
    setPaymentError("");
  };

  const handleSavePayment = async () => {
    setPaymentError("");
    setPaymentSuccess("");

    const amount = Number(paymentAmount);
    if (!paymentAccountId) {
      setPaymentError("Cari seçilmelidir.");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setPaymentError("Tutar 0'dan büyük olmalıdır.");
      return;
    }
    if (paymentMethod === "CASH" && !paymentSafeId) {
      setPaymentError("Nakit işlem için önce bir kasa hesabı seçin.");
      return;
    }
    if (paymentMethod === "BANK" && !paymentBankId) {
      setPaymentError("Banka işlem için önce bir banka hesabı seçin.");
      return;
    }

    try {
      setPaymentSaving(true);
      const headers = {
        ...(await getAuthHeaders()),
        "Content-Type": "application/json",
      };

      const response = await fetch(`/api/current-accounts/${paymentAccountId}/collections`, {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          movementType: paymentType,
          direction: -1,
          amount,
          documentDate: paymentDate,
          description: paymentDescription || undefined,
          currency: "TRY",
          paymentMethod,
          safeId: paymentMethod === "CASH" ? paymentSafeId : undefined,
          bankId: paymentMethod === "BANK" ? paymentBankId : undefined,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || "Tahsilat/ödeme kaydedilemedi.");
      }

      setShowPaymentModal(false);
      resetPaymentForm();
      setPaymentSuccess("Tahsilat/ödeme kaydedildi.");
      await loadDashboardData();
    } catch (error: any) {
      setPaymentError(error?.message || "Tahsilat/ödeme kaydedilemedi.");
    } finally {
      setPaymentSaving(false);
    }
  };
  
  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Giriş durumu kontrol ediliyor...</p>
        </div>
      </div>
    );
  }
  
  // If user is not authenticated, show landing page
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Landing page header */}
        <header className="bg-white shadow-sm">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Package className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">Cari Muhasebe</span>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link href="/auth/signin" className="text-gray-600 hover:text-blue-600 transition-colors">
                Giriş Yap
              </Link>
              <Link href="/auth/signup" className="text-gray-600 hover:text-blue-600 transition-colors">
                Kayıt Ol
              </Link>
            </nav>
            <div className="md:hidden">
              <Link href="/auth/signin">
                <Button variant="outline">Giriş</Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="container mx-auto px-4 py-16 md:py-24">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Profesyonel Cari ve 
              <span className="text-blue-600"> Muhasebe Yönetimi</span>
            </h1>
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
              İşletmenizin cari hesaplarını, stok yönetimini ve muhasebesini tek platformda yönetin. 
              Gelişmiş raporlama ve otomasyon özellikleriyle zaman kazanın.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                  Ücretsiz Başlayın
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/auth/signin">
                <Button size="lg" variant="outline">
                  Giriş Yap
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-white py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Tüm İşlemler Tek Yerde
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Cari hesap, stok, fatura ve raporlama işlemlerinizi entegre bir sistemle yönetin
              </p>
            </div>
          
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="bg-blue-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle>Cari Hesap Yönetimi</CardTitle>
                  <CardDescription>
                    Müşteri ve tedarikçi cari hesaplarınızı detaylı takip edin
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      Detaylı cari ekstreleri
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      Otomatik bakiye hesaplama
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      Hızlı cari arama
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="bg-green-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                    <Package className="h-6 w-6 text-green-600" />
                  </div>
                  <CardTitle>Stok Takibi</CardTitle>
                  <CardDescription>
                    Ürün stoğunuzu gerçek zamanlı olarak yönetin
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      Stok seviyesi uyarıları
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      Barkod desteği
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      Kategori bazlı filtreleme
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="bg-purple-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                    <FileText className="h-6 w-6 text-purple-600" />
                  </div>
                  <CardTitle>Fatura Yönetimi</CardTitle>
                  <CardDescription>
                    Satış ve alış faturalarınızı dijital ortamda oluşturun
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      Otomatik fatura oluşturma
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      Vergi hesaplamaları
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      PDF dışa aktarma
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="bg-orange-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                    <BarChart3 className="h-6 w-6 text-orange-600" />
                  </div>
                  <CardTitle>Raporlama</CardTitle>
                  <CardDescription>
                    Detaylı analiz ve raporlarla iş performansınızı ölçün
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      Satış analizleri
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      Kar-zarar raporları
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      Grafiksel gösterimler
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="bg-red-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                    <ShoppingCart className="h-6 w-6 text-red-600" />
                  </div>
                  <CardTitle>Hızlı Satış</CardTitle>
                  <CardDescription>
                    Hızlı satış işlemleriyle zaman kaybetmeden müşteriye hizmet verin
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      Tek tıkla satış
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      Otomatik stok düşümü
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      Anında fatura oluşturma
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="bg-indigo-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                    <Shield className="h-6 w-6 text-indigo-600" />
                  </div>
                  <CardTitle>Güvenli Veri</CardTitle>
                  <CardDescription>
                    Verileriniz SSL şifreleme ile güvenli şekilde saklanır
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      Günlük yedekleme
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      Rol bazlı erişim
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      GDPR uyumlu
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Product Visuals Section */}
        <section className="py-16 bg-gradient-to-b from-slate-50 to-white">
          <div className="container mx-auto px-4">
            <div className="mb-10 text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                Uygulamadan Gercek Moduller
              </h2>
              <p className="text-gray-700 max-w-3xl mx-auto">
                Cari hesap, stok, fatura ve finans akislarinizi tek panelde yonetebilirsiniz.
                Asagidaki bolumler gunluk is akislarina gore tasarlandi.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <article className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <img
                  src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80"
                  alt="Finans ve raporlama gostergeleri"
                  className="h-48 w-full object-cover"
                  loading="lazy"
                />
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-gray-900">Cari ve Finans Takibi</h3>
                  <p className="mt-2 text-sm text-gray-700">
                    Tahsilat, odeme, bakiye hareketleri ve borc-alacak dengesini anlik takip edin.
                  </p>
                </div>
              </article>

              <article className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <img
                  src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80"
                  alt="Depo ve stok yonetimi"
                  className="h-48 w-full object-cover"
                  loading="lazy"
                />
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-gray-900">Stok ve Depo Yonetimi</h3>
                  <p className="mt-2 text-sm text-gray-700">
                    Urun stoklari, kritik seviye uyarilari ve depo bazli takip tek ekranda.
                  </p>
                </div>
              </article>

              <article className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <img
                  src="https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1200&q=80"
                  alt="Satis ve fatura surecleri"
                  className="h-48 w-full object-cover"
                  loading="lazy"
                />
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-gray-900">Satis ve Fatura Sureci</h3>
                  <p className="mt-2 text-sm text-gray-700">
                    Hizli satis, otomatik fatura olusturma ve belge takibini hizlandirin.
                  </p>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* Workflow Section */}
        <section className="bg-white py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">
                  Is Akisiniz Icin Net Bir Yapi
                </h2>
                <p className="mt-4 text-gray-700">
                  Sistemi sadece veri tutmak icin degil, gunluk operasyonu hizlandirmak icin
                  kullaniyorsunuz. Bu nedenle moduller birbiriyle baglantili calisir.
                </p>
                <ul className="mt-6 space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
                    <span className="text-gray-800">Cari hareketleri otomatik bakiye etkisi olusturur.</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
                    <span className="text-gray-800">Satis islemleri stok miktarini aninda gunceller.</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
                    <span className="text-gray-800">Raporlama ekranlari gunluk kararlar icin hazir veri sunar.</span>
                  </li>
                </ul>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-slate-50 p-6 shadow-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl bg-white border border-gray-200 p-4">
                    <p className="text-xs text-gray-600">Aylik Satis</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">TRY 124.560</p>
                    <p className="text-xs text-green-700 mt-1">+18%</p>
                  </div>
                  <div className="rounded-xl bg-white border border-gray-200 p-4">
                    <p className="text-xs text-gray-600">Bekleyen Tahsilat</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">TRY 32.400</p>
                    <p className="text-xs text-amber-700 mt-1">12 cari hesap</p>
                  </div>
                  <div className="rounded-xl bg-white border border-gray-200 p-4 col-span-2">
                    <p className="text-xs text-gray-600 mb-2">Kritik Stok Uyarisi</p>
                    <div className="h-2 rounded bg-gray-200 overflow-hidden">
                      <div className="h-2 w-2/3 bg-rose-500"></div>
                    </div>
                    <p className="text-xs text-gray-700 mt-2">7 urun kritik seviyenin altinda</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-blue-600 py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Bugün Ücretsiz Denemeye Başlayın
            </h2>
            <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
              14 günlük ücretsiz deneme süresiyle tüm özelliklerden sınırsız şekilde yararlanın
            </p>
            <Link href="/auth/signup">
              <Button size="lg" variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100">
                Ücretsiz Hesap Oluştur
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <Package className="h-6 w-6 text-blue-400" />
                  <span className="text-xl font-bold">Cari Muhasebe</span>
                </div>
                <p className="text-gray-400">
                  Profesyonel cari ve muhasebe yönetimi çözümü
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-4">Ürün</h3>
                <ul className="space-y-2 text-gray-400">
                  <li><Link href="#" className="hover:text-white transition-colors">Özellikler</Link></li>
                  <li><Link href="#" className="hover:text-white transition-colors">Fiyatlandırma</Link></li>
                  <li><Link href="#" className="hover:text-white transition-colors">Entegrasyonlar</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-4">Destek</h3>
                <ul className="space-y-2 text-gray-400">
                  <li><Link href="#" className="hover:text-white transition-colors">Yardım Merkezi</Link></li>
                  <li><Link href="#" className="hover:text-white transition-colors">İletişim</Link></li>
                  <li><Link href="#" className="hover:text-white transition-colors">Dökümantasyon</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-4">Şirket</h3>
                <ul className="space-y-2 text-gray-400">
                  <li><Link href="#" className="hover:text-white transition-colors">Hakkımızda</Link></li>
                  <li><Link href="#" className="hover:text-white transition-colors">Blog</Link></li>
                  <li><Link href="#" className="hover:text-white transition-colors">Gizlilik</Link></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
              <p>&copy; 2024 Cari Muhasebe. Tüm hakları saklıdır.</p>
            </div>
          </div>
        </footer>
      </div>
    );
  }
  
  // Authenticated user dashboard
  return (
    <div className="min-h-full">
      {/* Dashboard Header */}
      <header className="mb-8 overflow-hidden rounded-2xl border border-[var(--line)] bg-[#173b4a] shadow-[0_16px_35px_rgba(23,59,74,0.12)]">
        <div className="px-6 py-7 sm:px-8 sm:py-9">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Package className="h-8 w-8 text-[#d9f1f1]" />
              <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            </div>
            <div className="hidden items-center space-x-4 sm:flex">
              <span className="text-gray-600">Hoş geldiniz, {user?.email || user?.name || 'Kullanıcı'}!</span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e7c88a] font-medium text-[#173b4a]">
                {(user?.name?.charAt(0) || user?.email?.charAt(0) || 'U').toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* Quick Stats */}
      <section className="mx-auto max-w-[1500px]">
        {summaryError && (
          <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {summaryError}
          </div>
        )}
        {paymentSuccess && (
          <div className="mb-6 rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            {paymentSuccess}
          </div>
        )}

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Toplam Cari</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summaryLoading ? "..." : summary?.totalAccounts ?? 0}
              </div>
              <p className="text-xs text-muted-foreground">Aktif tenant cari kayıtları</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Stok Değeri</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summaryLoading ? "..." : formatCurrency(summary?.stockValue ?? 0)}
              </div>
              <p className="text-xs text-muted-foreground">Stok miktarı ve alış maliyeti</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Bu Ay Satış</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summaryLoading ? "..." : formatCurrency(summary?.monthlySales ?? 0)}
              </div>
              <p className="text-xs text-muted-foreground">Bu ayki satış faturaları</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Bekleyen Faturalar</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summaryLoading ? "..." : summary?.pendingInvoicesCount ?? 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(summary?.pendingInvoicesTotal ?? 0)} toplam
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Toplam Alacak</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">
                {summaryLoading ? "..." : formatCurrency(summary?.totalReceivable ?? 0)}
              </div>
              <p className="text-xs text-muted-foreground">Cari hareket bakiyelerinden</p>
            </CardContent>
          </Card>

          <Card className="bg-[#fff3f1]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Vadesi Geçenler</CardTitle>
              <FileText className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-700">
                {summaryLoading ? "..." : summary?.overdueInvoicesCount ?? 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(summary?.overdueInvoicesTotal ?? 0)} açık bakiye
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Toplam Borç</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-700">
                {summaryLoading ? "..." : formatCurrency(summary?.totalDebt ?? 0)}
              </div>
              <p className="text-xs text-muted-foreground">Cari hareket bakiyelerinden</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Net Bakiye</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${
                  (summary?.netBalance ?? 0) >= 0 ? "text-green-700" : "text-red-700"
                }`}
              >
                {summaryLoading ? "..." : formatCurrency(summary?.netBalance ?? 0)}
              </div>
              <p className="text-xs text-muted-foreground">Alacak eksi borç</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Quick Actions */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Hızlı Eylemler</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Link href="/current-accounts/new">
                  <Button className="w-full justify-start" variant="outline">
                    <Users className="mr-2 h-4 w-4" />
                    Yeni Cari Hesap
                  </Button>
                </Link>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => {
                    setPaymentError("");
                    setPaymentSuccess("");
                    setShowPaymentModal(true);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Tahsilat / Ödeme
                </Button>
                <Link href="/quick-sales">
                  <Button className="w-full justify-start" variant="outline">
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Hızlı Satış
                  </Button>
                </Link>
                <Link href="/invoices/new">
                  <Button className="w-full justify-start" variant="outline">
                    <FileText className="mr-2 h-4 w-4" />
                    Yeni Fatura
                  </Button>
                </Link>
                <Link href="/inventory">
                  <Button className="w-full justify-start" variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Ürün Ekle
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Sistem Durumu</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <div className="flex items-center">
                  <div className="bg-green-100 p-2 rounded-full mr-3">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Dashboard gerçek veriden hesaplanıyor</p>
                    <p className="text-xs text-muted-foreground">Cari, stok ve fatura tabloları</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="bg-blue-100 p-2 rounded-full mr-3">
                    <FileText className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Kasa hesapları</p>
                    <p className="text-xs text-muted-foreground">
                      {safes.length > 0 ? `${safes.length} kasa tanımlı` : "Henüz kasa hesabı tanımlanmadı"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="bg-purple-100 p-2 rounded-full mr-3">
                    <ShoppingCart className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium">Banka hesapları</p>
                    <p className="text-xs text-muted-foreground">
                      {banks.length > 0 ? `${banks.length} banka hesabı tanımlı` : "Henüz banka hesabı bağlanmadı"}
                    </p>
                  </div>
                </div>
                {(summary?.warnings || []).map((warning) => (
                  <p key={warning} className="rounded bg-amber-50 px-3 py-2 text-xs text-amber-700">
                    {warning}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="dashboard-payment-title"
            className="w-full max-w-xl rounded-lg bg-white p-6 shadow-lg"
          >
            <div className="mb-5">
              <h2 id="dashboard-payment-title" className="text-lg font-semibold text-gray-900">
                Tahsilat / Ödeme
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Kayıt cari hareketlere işlenir; kasa veya banka seçilirse finans bakiyesi de güncellenir.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">Cari</label>
                <select
                  value={paymentAccountId}
                  onChange={(event) => setPaymentAccountId(event.target.value)}
                  className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm"
                >
                  {activeAccounts.length === 0 ? (
                    <option value="">Cari hesap bulunamadı</option>
                  ) : (
                    activeAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name || "Adsız cari"}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">İşlem Türü</label>
                <select
                  value={paymentType}
                  onChange={(event) => setPaymentType(event.target.value as "COLLECTION" | "PAYMENT")}
                  className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm"
                >
                  <option value="COLLECTION">Tahsilat</option>
                  <option value="PAYMENT">Ödeme</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Ödeme Yöntemi</label>
                <select
                  value={paymentMethod}
                  onChange={(event) => setPaymentMethod(event.target.value as "CASH" | "BANK" | "OTHER")}
                  className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm"
                >
                  <option value="CASH">Nakit</option>
                  <option value="BANK">Banka</option>
                  <option value="OTHER">Diğer</option>
                </select>
              </div>

              {paymentMethod === "CASH" && (
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">Kasa Hesabı</label>
                  <select
                    value={paymentSafeId}
                    onChange={(event) => setPaymentSafeId(event.target.value)}
                    className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm"
                  >
                    {safes.length === 0 ? (
                      <option value="">Henüz kasa hesabı tanımlanmadı</option>
                    ) : (
                      safes.map((safe) => (
                        <option key={safe.id} value={safe.id}>
                          {safe.name || "Kasa"} - {formatCurrency(Number(safe.balance || 0))}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              )}

              {paymentMethod === "BANK" && (
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">Banka Hesabı</label>
                  <select
                    value={paymentBankId}
                    onChange={(event) => setPaymentBankId(event.target.value)}
                    className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm"
                  >
                    {banks.length === 0 ? (
                      <option value="">Henüz banka hesabı bağlanmadı</option>
                    ) : (
                      banks.map((bank) => (
                        <option key={bank.id} value={bank.id}>
                          {bank.name || "Banka"} - {formatCurrency(Number(bank.balance || 0))}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Tutar</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(event) => setPaymentAmount(event.target.value)}
                  className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Tarih</label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(event) => setPaymentDate(event.target.value)}
                  className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">Açıklama</label>
                <textarea
                  value={paymentDescription}
                  onChange={(event) => setPaymentDescription(event.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
            </div>

            {paymentMethod === "BANK" && banks.length === 0 && (
              <p className="mt-4 rounded bg-amber-50 px-3 py-2 text-sm text-amber-700">
                Banka entegrasyonu veya manuel banka hesabı henüz tanımlanmadı.
              </p>
            )}
            {paymentMethod === "CASH" && safes.length === 0 && (
              <p className="mt-4 rounded bg-amber-50 px-3 py-2 text-sm text-amber-700">
                Nakit işlem kaydetmek için önce finans bölümünde kasa hesabı tanımlayın.
              </p>
            )}
            {paymentError && <p className="mt-4 text-sm text-red-600">{paymentError}</p>}

            <div className="mt-6 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowPaymentModal(false);
                  resetPaymentForm();
                }}
                disabled={paymentSaving}
              >
                Vazgeç
              </Button>
              <Button
                type="button"
                onClick={handleSavePayment}
                disabled={paymentSaving || activeAccounts.length === 0}
              >
                {paymentSaving ? "Kaydediliyor..." : "Kaydet"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
