import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Veritabanı seed işlemi başlıyor...');

  // Şifreyi hashle
  const hashedPassword = await bcrypt.hash('123456', 10);

  // Test kullanıcısı ve tenant oluştur
  const user = await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: {},
    create: {
      email: 'admin@test.com',
      name: 'Admin Kullanıcı',
      password: hashedPassword,
      tenantId: 'tenant-1',
    },
  });

  console.log('✅ Kullanıcı oluşturuldu:', user.email);

  // Tenant oluştur
  const tenant = await prisma.tenant.upsert({
    where: { id: 'tenant-1' },
    update: {},
    create: {
      id: 'tenant-1',
      name: 'Demo İşletme',
      userId: user.id,
    },
  });

  console.log('✅ Tenant oluşturuldu:', tenant.name);

  // Örnek cari hesaplar
  const customers = await prisma.currentAccount.createMany({
    data: [
      {
        name: 'ABC Şirketi',
        email: 'abc@sirket.com',
        phone: '0532 111 22 33',
        address: 'İstanbul',
        taxOffice: 'Kadıköy',
        taxNumber: '1234567890',
        accountType: 'CUSTOMER',
        balance: 5000,
        tenantId: tenant.id,
      },
      {
        name: 'XYZ Ltd.',
        email: 'xyz@ltd.com',
        phone: '0533 444 55 66',
        address: 'Ankara',
        taxOffice: 'Çankaya',
        taxNumber: '0987654321',
        accountType: 'SUPPLIER',
        balance: -3000,
        tenantId: tenant.id,
      },
      {
        name: 'Demo Müşteri',
        email: 'demo@musteri.com',
        phone: '0534 777 88 99',
        accountType: 'CUSTOMER',
        balance: 2500,
        tenantId: tenant.id,
      },
    ],
  });

  console.log(`✅ ${customers.count} cari hesap oluşturuldu`);

  console.log('\n🎉 Seed işlemi tamamlandı!');
  console.log('\n📧 Giriş Bilgileri:');
  console.log('   Email: admin@test.com');
  console.log('   Şifre: 123456');
}

main()
  .catch((e) => {
    console.error('❌ Hata:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
