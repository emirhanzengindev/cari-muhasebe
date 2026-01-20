import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({ status: 'ok' }, { 
      headers: { 'Content-Type': 'application/json' } 
    });
  } catch (err: any) {
    console.error('Health check error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}