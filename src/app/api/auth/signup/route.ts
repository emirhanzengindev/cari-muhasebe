import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

// Mock user storage
let mockUsers: any[] = [];
let mockTenants: any[] = [];

export async function POST(request: Request) {
  try {
    const { name, email, password, companyName } = await request.json();

    // Validasyon
    if (!name || !email || !password || !companyName) {
      return NextResponse.json(
        { error: "Tüm alanlar zorunludur" },
        { status: 400 }
      );
    }

    // E-posta kontrolü
    const existingUser = mockUsers.find(user => user.email === email);

    if (existingUser) {
      return NextResponse.json(
        { error: "Bu e-posta adresi zaten kullanılıyor" },
        { status: 400 }
      );
    }

    // Şifreyi hashle
    const hashedPassword = await bcrypt.hash(password, 10);

    // Unique tenant ID oluştur
    const tenantId = `tenant-${Date.now()}`;

    // Kullanıcı oluştur
    const user = {
      id: `user-${Date.now()}`,
      name,
      email,
      password: hashedPassword,
      tenantId,
    };

    mockUsers.push(user);

    // Tenant oluştur
    const tenant = {
      id: tenantId,
      name: companyName,
      userId: user.id,
    };

    mockTenants.push(tenant);

    return NextResponse.json(
      { 
        message: "Kayıt başarılı",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Kayıt hatası:", error);
    return NextResponse.json(
      { error: "Kayıt sırasında bir hata oluştu" },
      { status: 500 }
    );
  }
}