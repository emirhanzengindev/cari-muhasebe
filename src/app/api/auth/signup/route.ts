import { NextRequest } from "next/server";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name, companyName } = body;

    if (!email || !password) {
      return Response.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Create server client (auth operations don't require cookie handling)
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => [],
          setAll: () => {},
        },
      }
    );

    // Supabase'te yeni kullanıcı oluştur
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || email,
          companyName: companyName || '',
        }
      }
    });

    if (error) {
      return Response.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return Response.json(
      { 
        message: "User created successfully", 
        user: data.user 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}