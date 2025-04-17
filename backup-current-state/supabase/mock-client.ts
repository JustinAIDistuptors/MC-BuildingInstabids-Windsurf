/**
 * Mock Supabase Client
 * 
 * This file provides a complete mock implementation of the Supabase client
 * for local development and testing, without requiring actual Supabase credentials.
 */
import { UserType } from '../auth/types';

// Pre-defined test users
export const TEST_USERS = {
  homeowner: {
    id: 'c4f35d0e-8e91-4a17-8fb9-47edc2ccd567',
    email: 'homeowner@example.com',
    password: 'password123',
    full_name: 'John Homeowner',
    user_type: 'homeowner' as UserType,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  contractor: {
    id: '8a7b6c5d-4e3f-2a1b-0c9d-8e7f6a5b4c3d',
    email: 'contractor@example.com',
    password: 'password123',
    full_name: 'Mike Contractor',
    user_type: 'contractor' as UserType,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  'property-manager': {
    id: '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d',
    email: 'property@example.com',
    password: 'password123',
    full_name: 'Sarah Property',
    user_type: 'property-manager' as UserType,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  'labor-contractor': {
    id: '9c8b7a6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d',
    email: 'labor@example.com',
    password: 'password123',
    full_name: 'Luis Labor',
    user_type: 'labor-contractor' as UserType,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
};

// In-memory database
let registeredUsers = Object.values(TEST_USERS);
let currentUser: any = null;

// Mock Auth API
const auth = {
  getUser: async () => {
    return { data: { user: currentUser }, error: null };
  },
  
  getSession: async () => {
    if (!currentUser) {
      return { data: { session: null }, error: null };
    }
    return { 
      data: { 
        session: {
          user: currentUser,
          access_token: `mock-token-${currentUser.id}`,
          refresh_token: `mock-refresh-${currentUser.id}`,
          expires_at: Date.now() + 3600000
        } 
      }, 
      error: null 
    };
  },
  
  signUp: async ({ email, password, options }: any) => {
    console.log('MOCK: Signing up with:', { email, userType: options?.data?.user_type });
    
    // Check if user already exists
    const existingUser = registeredUsers.find(user => user.email === email);
    if (existingUser) {
      return { data: null, error: { message: 'User already exists' } };
    }
    
    // Create new user
    const newUser = {
      id: generateUUID(),
      email,
      password,
      full_name: options?.data?.full_name || '',
      user_type: options?.data?.user_type || 'homeowner',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    registeredUsers.push(newUser);
    currentUser = {
      id: newUser.id,
      email: newUser.email,
      user_metadata: {
        full_name: newUser.full_name,
        user_type: newUser.user_type
      },
      app_metadata: {}
    };
    
    console.log('MOCK: User created:', currentUser);
    
    return {
      data: {
        user: currentUser,
        session: {
          access_token: `mock-token-${newUser.id}`,
          refresh_token: `mock-refresh-${newUser.id}`,
          expires_at: Date.now() + 3600000
        }
      },
      error: null
    };
  },
  
  signInWithPassword: async ({ email, password }: any) => {
    console.log('MOCK: Signing in with:', { email });
    
    // Find user
    const user = registeredUsers.find(u => u.email === email && u.password === password);
    
    if (!user) {
      return { data: null, error: { message: 'Invalid login credentials' } };
    }
    
    currentUser = {
      id: user.id,
      email: user.email,
      user_metadata: {
        full_name: user.full_name,
        user_type: user.user_type
      },
      app_metadata: {},
      aud: 'authenticated'
    };
    
    console.log('MOCK: User signed in:', currentUser);
    
    return {
      data: {
        user: currentUser,
        session: {
          access_token: `mock-token-${user.id}`,
          refresh_token: `mock-refresh-${user.id}`,
          expires_at: Date.now() + 3600000
        }
      },
      error: null
    };
  },
  
  signOut: async () => {
    console.log('MOCK: Signing out user:', currentUser?.email);
    currentUser = null;
    return { error: null };
  }
};

// Mock Database API
const tables: Record<string, any[]> = {
  profiles: registeredUsers.map(user => ({
    id: user.id,
    full_name: user.full_name,
    user_type: user.user_type,
    created_at: user.created_at,
    updated_at: user.updated_at
  })),
  projects: [],
  bids: [],
  messages: []
};

const from = (tableName: string) => {
  console.log(`MOCK: Accessing table ${tableName}`);
  
  return {
    select: (columns?: string) => {
      return {
        eq: (column: string, value: any) => {
          const records = tables[tableName] || [];
          const filteredRecords = records.filter(record => record[column] === value);
          
          return {
            single: () => {
              const record = filteredRecords[0] || null;
              console.log(`MOCK: Retrieved record:`, record);
              return {
                data: record,
                error: record ? null : { message: 'Record not found' }
              };
            }
          };
        },
        order: () => ({
          limit: () => ({
            data: tables[tableName] || [],
            error: null
          })
        })
      };
    },
    insert: (data: any) => {
      console.log(`MOCK: Inserting into ${tableName}:`, data);
      
      if (!tables[tableName]) {
        tables[tableName] = [];
      }
      
      if (Array.isArray(data)) {
        tables[tableName].push(...data);
      } else {
        tables[tableName].push(data);
      }
      
      return {
        data,
        error: null
      };
    },
    update: (data: any) => {
      return {
        eq: (column: string, value: any) => {
          const table = tables[tableName] || [];
          const index = table.findIndex(record => record[column] === value);
          
          if (index >= 0) {
            tables[tableName][index] = { ...tables[tableName][index], ...data };
            return {
              data: tables[tableName][index],
              error: null
            };
          }
          
          return {
            data: null,
            error: { message: 'Record not found' }
          };
        }
      };
    },
    delete: () => {
      return {
        eq: (column: string, value: any) => {
          const table = tables[tableName] || [];
          const index = table.findIndex(record => record[column] === value);
          
          if (index >= 0) {
            const deleted = tables[tableName].splice(index, 1)[0];
            return {
              data: deleted,
              error: null
            };
          }
          
          return {
            data: null,
            error: { message: 'Record not found' }
          };
        }
      };
    }
  };
};

// Mock Storage API
const storage = {
  from: (bucketName: string) => {
    console.log(`MOCK: Accessing storage bucket ${bucketName}`);
    
    return {
      upload: (path: string, file: any) => {
        console.log(`MOCK: Uploading file to ${bucketName}/${path}`);
        return {
          data: { path },
          error: null
        };
      },
      getPublicUrl: (path: string) => {
        return {
          data: { publicUrl: `https://mock-storage.example.com/${bucketName}/${path}` }
        };
      }
    };
  }
};

// Helper function to generate UUID
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Create the mock Supabase client
export const createMockSupabaseClient = () => {
  return {
    auth,
    from,
    storage,
    // Add any other Supabase methods that your app uses
    rpc: (functionName: string, params: any) => {
      console.log(`MOCK: Calling RPC function ${functionName} with params:`, params);
      return {
        data: null,
        error: null
      };
    }
  };
};

// Log that the mock client is being used
console.log('🔧 Using MOCK Supabase client for development');
