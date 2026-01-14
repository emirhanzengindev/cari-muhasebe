import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
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

    // Supabase'te yeni kullanıcı oluştur
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || email,
          companyName: companyName || '',
          tenantId: uuidv4(),
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