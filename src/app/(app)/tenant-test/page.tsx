'use client';

import { useState, useEffect } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase';

export default function TenantTestPage() {
  const [testResults, setTestResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runTenantTest = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const supabase = getSupabaseBrowser();
      
      // Test the API endpoint we created
      const response = await fetch('/api/test-tenant-context', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'API request failed');
      }
      
      setTestResults(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/test-tenant-context', {
        method: 'GET',
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'API request failed');
      }
      
      setTestResults(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Tenant Context Test</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Operations</h2>
          <div className="flex gap-4">
            <button
              onClick={runTenantTest}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Run Complete Test'}
            </button>
            <button
              onClick={fetchAccounts}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Fetch Accounts'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="text-red-800 font-medium">Error:</h3>
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {testResults && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Test Results</h2>
            
            {testResults.tenantContext && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-800">Tenant Context</h3>
                <pre className="text-sm text-blue-600 mt-2">
                  {JSON.stringify(testResults.tenantContext, null, 2)}
                </pre>
              </div>
            )}

            {testResults.account && (
              <div className="mb-6 p-4 bg-green-50 rounded-lg">
                <h3 className="font-medium text-green-800">Created Account</h3>
                <pre className="text-sm text-green-600 mt-2">
                  {JSON.stringify(testResults.account, null, 2)}
                </pre>
              </div>
            )}

            {testResults.transaction && (
              <div className="mb-6 p-4 bg-yellow-50 rounded-lg">
                <h3 className="font-medium text-yellow-800">Created Transaction</h3>
                <pre className="text-sm text-yellow-600 mt-2">
                  {JSON.stringify(testResults.transaction, null, 2)}
                </pre>
              </div>
            )}

            {testResults.balance && (
              <div className="mb-6 p-4 bg-purple-50 rounded-lg">
                <h3 className="font-medium text-purple-800">Balance View</h3>
                <pre className="text-sm text-purple-600 mt-2">
                  {JSON.stringify(testResults.balance, null, 2)}
                </pre>
                <div className="mt-2 p-2 bg-purple-100 rounded">
                  <span className="font-medium">Balance Amount:</span> 
                  <span className="ml-2 text-lg font-bold text-purple-700">
                    {testResults.balance.balance?.toFixed(2) || '0.00'} TRY
                  </span>
                </div>
              </div>
            )}

            {testResults.accounts && (
              <div className="p-4 bg-indigo-50 rounded-lg">
                <h3 className="font-medium text-indigo-800">All Accounts ({testResults.accounts.length})</h3>
                <div className="mt-2 space-y-2">
                  {testResults.accounts.map((account: any) => (
                    <div key={account.id} className="p-3 bg-white rounded border">
                      <div className="font-medium">{account.name}</div>
                      <div className="text-sm text-gray-600">
                        Balance: {account.balance?.toFixed(2) || '0.00'} TRY
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}