export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    return Response.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      message: 'API is working correctly'
    });
  } catch (error) {
    return Response.json({ error: 'Health check failed' }, { status: 500 });
  }
}