"use client";

import { useState } from "react";
import { signUpUser, signInUser, signOutUser, getCurrentUser } from "../../lib/auth/auth-utils";
import { UserType } from "../../lib/auth/types";

export default function TestAuthPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [email, setEmail] = useState("test@example.com");
  const [password, setPassword] = useState("Password123!");
  const [fullName, setFullName] = useState("Test User");
  const [userType, setUserType] = useState<UserType>("homeowner");

  // Add a log entry to the results
  const log = (message: string) => {
    console.log(message);
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()} - ${message}`]);
  };

  // Test user signup
  const testSignUp = async () => {
    setLoading(true);
    log(`Testing signup for ${userType}...`);
    
    try {
      const { data, error } = await signUpUser({
        email,
        password,
        fullName,
        userType
      });
      
      if (error) {
        log(`❌ Signup failed for ${userType}: ${error.message}`);
      } else {
        log(`✅ Signup successful for ${userType}!`);
        log(`User ID: ${data?.user?.id}`);
        log(`User Type: ${data?.user?.user_metadata?.user_type}`);
        setCurrentUser(data?.user);
      }
    } catch (err: any) {
      log(`❌ Error during signup: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Test user login
  const testSignIn = async () => {
    setLoading(true);
    log(`Testing login with ${email}...`);
    
    try {
      const { data, error } = await signInUser({
        email,
        password
      });
      
      if (error) {
        log(`❌ Login failed: ${error.message}`);
      } else {
        log(`✅ Login successful!`);
        log(`User ID: ${data?.user?.id}`);
        log(`User Type: ${data?.user?.user_metadata?.user_type}`);
        setCurrentUser(data?.user);
      }
    } catch (err: any) {
      log(`❌ Error during login: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Test getting the current user
  const testGetCurrentUser = async () => {
    setLoading(true);
    log(`Testing getCurrentUser...`);
    
    try {
      const { user, profile, error } = await getCurrentUser();
      
      if (error) {
        log(`❌ getCurrentUser failed: ${error.message}`);
      } else if (!user) {
        log(`❌ No user is currently logged in`);
      } else {
        log(`✅ getCurrentUser successful!`);
        log(`User ID: ${user.id}`);
        log(`User Email: ${user.email}`);
        log(`User Type: ${user.user_metadata?.user_type}`);
        
        if (profile) {
          log(`Profile Full Name: ${profile.full_name}`);
          log(`Profile User Type: ${profile.user_type}`);
        } else {
          log(`⚠️ No profile found for user`);
        }
        
        setCurrentUser(user);
      }
    } catch (err: any) {
      log(`❌ Error during getCurrentUser: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Test signing out
  const testSignOut = async () => {
    setLoading(true);
    log(`Testing signOut...`);
    
    try {
      const { error } = await signOutUser();
      
      if (error) {
        log(`❌ signOut failed: ${error.message}`);
      } else {
        log(`✅ signOut successful!`);
        setCurrentUser(null);
      }
    } catch (err: any) {
      log(`❌ Error during signOut: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">InstaBids Authentication Tester</h1>
      <p className="mb-6">Test authentication flows for all user types in the InstaBids platform.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="space-y-4 p-6 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Authentication Form</h2>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input 
                type="email" 
                className="w-full p-2 border rounded" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input 
                type="password" 
                className="w-full p-2 border rounded" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Full Name (for Signup)</label>
              <input 
                type="text" 
                className="w-full p-2 border rounded" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">User Type (for Signup)</label>
              <select 
                className="w-full p-2 border rounded"
                value={userType}
                onChange={(e) => setUserType(e.target.value as UserType)}
              >
                <option value="homeowner">Homeowner</option>
                <option value="contractor">Contractor</option>
                <option value="property-manager">Property Manager</option>
                <option value="labor-contractor">Labor Contractor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-4">
            <button 
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              onClick={testSignUp}
              disabled={loading}
            >
              Sign Up
            </button>
            
            <button 
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              onClick={testSignIn}
              disabled={loading}
            >
              Log In
            </button>
            
            <button 
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
              onClick={testGetCurrentUser}
              disabled={loading}
            >
              Get Current User
            </button>
            
            <button 
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              onClick={testSignOut}
              disabled={loading || !currentUser}
            >
              Sign Out
            </button>
          </div>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">Test Accounts</h2>
          <p className="text-sm">Use these accounts for testing once created:</p>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Password</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Homeowner</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">homeowner@instabids.com</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Password123!</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Contractor</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">contractor@instabids.com</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Password123!</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Property Manager</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">property@instabids.com</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Password123!</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Labor Contractor</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">labor@instabids.com</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Password123!</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Admin</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">admin@instabids.com</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Password123!</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <div>
        <h2 className="text-xl font-semibold mb-2">Test Results</h2>
        {currentUser && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded">
            <h3 className="font-medium text-green-800">Current User</h3>
            <pre className="mt-2 text-sm overflow-x-auto">
              {JSON.stringify(currentUser, null, 2)}
            </pre>
          </div>
        )}
        
        <div className="p-4 bg-gray-50 border border-gray-200 rounded h-80 overflow-y-auto">
          {results.length === 0 ? (
            <p className="text-gray-500">No results yet. Run a test to see output.</p>
          ) : (
            <div className="space-y-1">
              {results.map((result, index) => (
                <div 
                  key={index} 
                  className={`p-2 rounded text-sm font-mono ${
                    result.includes('❌') ? 'bg-red-50 text-red-800' : 
                    result.includes('✅') ? 'bg-green-50 text-green-800' : 
                    result.includes('⚠️') ? 'bg-yellow-50 text-yellow-800' : 
                    'bg-gray-50 text-gray-800'
                  }`}
                >
                  {result}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
