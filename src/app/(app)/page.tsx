"use client";

import Link from "next/link";
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
export default function Dashboard() {
  const user = { name: "Demo User" }; // Mock user
  
  // Memoize the component to prevent unnecessary re-renders
  console.log('DASHBOARD: Rendering with user:', !!user);
  
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
    <div className="min-h-screen bg-gray-50">
      {/* Dashboard Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Package className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">Hoş geldiniz, {user?.name || 'Kullanıcı'}!</span>
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                {user?.name?.charAt(0) || 'U'}
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* Quick Stats */}
      <section className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Toplam Cari</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">+12% geçen aydan beri</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Stok Değeri</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₺45.230</div>
              <p className="text-xs text-muted-foreground">+5.3% geçen aydan beri</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Bu Ay Satış</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₺124.560</div>
              <p className="text-xs text-muted-foreground">+18% geçen aydan beri</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Bekleyen Faturalar</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">₺12.450 toplam</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Hızlı Eylemler</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link href="/current-accounts">
                  <Button className="w-full justify-start" variant="outline">
                    <Users className="mr-2 h-4 w-4" />
                    Yeni Cari Hesap
                  </Button>
                </Link>
                <Link href="/inventory">
                  <Button className="w-full justify-start" variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Ürün Ekle
                  </Button>
                </Link>
                <Link href="/quick-sales">
                  <Button className="w-full justify-start" variant="outline">
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Hızlı Satış
                  </Button>
                </Link>
                <Link href="/invoices">
                  <Button className="w-full justify-start" variant="outline">
                    <FileText className="mr-2 h-4 w-4" />
                    Yeni Fatura
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Son Aktiviteler</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="bg-green-100 p-2 rounded-full mr-3">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Yeni müşteri eklendi</p>
                    <p className="text-xs text-muted-foreground">2 dakika önce</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="bg-blue-100 p-2 rounded-full mr-3">
                    <ShoppingCart className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Satış işlemi tamamlandı</p>
                    <p className="text-xs text-muted-foreground">15 dakika önce</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="bg-purple-100 p-2 rounded-full mr-3">
                    <FileText className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Fatura oluşturuldu</p>
                    <p className="text-xs text-muted-foreground">1 saat önce</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}