import { NextRequest } from 'next/server';
import { Pool } from 'pg';

// Direct database connection for testing JWT claims
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

export async function POST(request: NextRequest) {
  try {
    console.log('DEBUG: Direct DB test route called');
    
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    console.log('DEBUG: Auth header:', authHeader ? authHeader.substring(0, 50) + '...' : 'None');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return Response.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }
    
    const token = authHeader.substring(7);
    
    // Decode JWT to get user ID (without verification for testing)
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    const userId = payload.sub;
    console.log('DEBUG: Extracted user ID:', userId);
    
    // Test direct database connection with JWT claims
    const client = await pool.connect();
    
    try {
      // Set JWT claims in session
      await client.query('SET LOCAL "request.jwt.claim.sub" = $1', [userId]);
      await client.query('SET LOCAL "request.jwt.claim.tenant_id" = $1', [userId]);
      
      // Test JWT claims
      const claimsResult = await client.query(`
        SELECT 
          current_setting('request.jwt.claim.tenant_id', true) AS tenant_id,
          current_setting('request.jwt.claim.sub', true) AS user_id
      `);
      
      console.log('DEBUG: JWT Claims in DB:', claimsResult.rows[0]);
      
      // Test insert with proper tenant context
      const testAccount = {
        name: 'Direct DB Test Account',
        phone: '+1234567890',
        address: 'Test Address',
        tax_number: '123456789',
        tax_office: 'Test Tax Office',
        company: 'Test Company',
        balance: 0,
        tenant_id: userId,
        user_id: userId,
        is_active: true,
        account_type: 'CUSTOMER'
      };
      
      const insertResult = await client.query(
        `INSERT INTO current_accounts 
         (name, phone, address, tax_number, tax_office, company, balance, tenant_id, user_id, is_active, account_type)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING id`,
        [
          testAccount.name, testAccount.phone, testAccount.address, testAccount.tax_number,
          testAccount.tax_office, testAccount.company, testAccount.balance, testAccount.tenant_id,
          testAccount.user_id, testAccount.is_active, testAccount.account_type
        ]
      );
      
      console.log('DEBUG: Insert successful:', insertResult.rows[0]);
      
      // Clean up test record
      await client.query('DELETE FROM current_accounts WHERE id = $1', [insertResult.rows[0].id]);
      console.log('DEBUG: Test record cleaned up');
      
      return Response.json({
        success: true,
        userId: userId,
        jwtClaims: claimsResult.rows[0],
        testInsertId: insertResult.rows[0].id
      });
      
    } finally {
      client.release();
    }
    
  } catch (error: any) {
    console.error('DEBUG: Direct DB test error:', error);
    return Response.json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}