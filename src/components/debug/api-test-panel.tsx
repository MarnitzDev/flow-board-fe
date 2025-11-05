'use client';

import { useState } from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { apiClient } from '@/lib/api';

export function ApiTestPanel() {
  const [email, setEmail] = useState('admin@flowboard.com');
  const [password, setPassword] = useState('admin123');
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testLogin = async () => {
    setLoading(true);
    setResult('');
    
    try {
      console.log('Testing login with:', { email, password });
      const response = await apiClient.login(email, password);
      console.log('Login response:', response);
      
      setResult(`✅ Login successful! Token: ${response.token?.substring(0, 20)}...`);
      
      // Show user info from login response
      setResult(prev => prev + `\n✅ User: ${JSON.stringify(response.user, null, 2)}`);
      
    } catch (error) {
      console.error('Test failed:', error);
      setResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const testProjects = async () => {
    setLoading(true);
    setResult('');
    
    try {
      console.log('Testing projects fetch...');
      const response = await apiClient.getProjects();
      console.log('Projects response:', response);
      
      setResult(`✅ Projects fetch successful! Count: ${Array.isArray(response.data) ? response.data.length : 0}\n${JSON.stringify(response.data, null, 2)}`);
      
    } catch (error) {
      console.error('Projects test failed:', error);
      setResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">API Connection Test</h3>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <InputText 
          placeholder="Email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)}
        />
        <InputText 
          placeholder="Password" 
          type="password"
          value={password} 
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      
      <div className="flex gap-2 mb-4">
        <Button 
          label="Test Login" 
          onClick={testLogin} 
          loading={loading}
          size="small"
        />
        <Button 
          label="Test Projects (requires login)" 
          onClick={testProjects} 
          loading={loading}
          size="small"
          severity="secondary"
        />
      </div>
      
      {result && (
        <div className="bg-gray-100 p-3 rounded text-sm font-mono whitespace-pre-wrap max-h-64 overflow-y-auto">
          {result}
        </div>
      )}
    </div>
  );
}