// Test Component for INSERT Verification
// Place this in your Next.js app to test the current accounts INSERT functionality

'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function TestInsertComponent() {
  const [result, setResult] = useState<{success: boolean; message: string; data: any; userId: string} | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{message: string; code?: string; details?: string} | null>(null);

  const testInsert = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      
      // Get current user to verify auth context
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      
      console.log('Current user:', user?.id);
      
      // Test INSERT
      const { data, error: insertError } = await supabase
        .from('current_accounts')
        .insert({
          name: 'Frontend Test Account',
          code: 'FE001',
          type: 'CUSTOMER',
          tenant_id: user?.id,
          user_id: user?.id
        })
        .select()
        .single();

      if (insertError) throw insertError;
      
      setResult({
        success: true,
        message: 'INSERT successful!',
        data: data,
        userId: user?.id || 'unknown'
      });
      
      // Clean up test record
      if (data?.id) {
        await supabase
          .from('current_accounts')
          .delete()
          .eq('id', data.id);
        console.log('Test record cleaned up');
      }
      
    } catch (err: any) {
      setError({
        message: err.message,
        code: err.code,
        details: err.details
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg max-w-md">
      <h2 className="text-xl font-bold mb-4">Test Current Accounts INSERT</h2>
      
      <button
        onClick={testInsert}
        disabled={loading}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test INSERT'}
      </button>

      {result && (
        <div className="mt-4 p-3 bg-green-100 rounded">
          <h3 className="font-bold text-green-800">Success!</h3>
          <p className="text-green-700">{result.message}</p>
          <p className="text-sm mt-2">User ID: {result.userId}</p>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-100 rounded">
          <h3 className="font-bold text-red-800">Error</h3>
          <p className="text-red-700">{error.message}</p>
          <p className="text-sm mt-2">Code: {error.code}</p>
          {error.details && <p className="text-sm">Details: {error.details}</p>}
        </div>
      )}
    </div>
  );
}