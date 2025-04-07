/**
 * Mock Supabase Configuration
 * 
 * This script provides mock Supabase credentials and functions for local development
 * This helps us test the auth flow without an actual Supabase instance
 */

const MOCK_USERS = {
  homeowner: {
    id: 'c4f35d0e-8e91-4a17-8fb9-47edc2ccd567',
    email: 'homeowner@example.com',
    password: 'password123',
    full_name: 'John Homeowner',
    user_type: 'homeowner',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  contractor: {
    id: '8a7b6c5d-4e3f-2a1b-0c9d-8e7f6a5b4c3d',
    email: 'contractor@example.com',
    password: 'password123',
    full_name: 'Mike Contractor',
    user_type: 'contractor',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  'property-manager': {
    id: '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d',
    email: 'property@example.com',
    password: 'password123',
    full_name: 'Sarah Property',
    user_type: 'property-manager',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  'labor-contractor': {
    id: '9c8b7a6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d',
    email: 'labor@example.com',
    password: 'password123',
    full_name: 'Luis Labor',
    user_type: 'labor-contractor',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
};

// In-memory database to track registered users
const registeredUsers = [...Object.values(MOCK_USERS)];

// Mock Supabase Auth API
const mockSupabaseAuth = {
  signUp: async ({ email, password, options }) => {
    // Check if user already exists
    const existingUser = registeredUsers.find(user => user.email === email);
    if (existingUser) {
      return {
        data: null,
        error: { message: 'User already exists' }
      };
    }
    
    // Create new user
    const newUser = {
      id: generateUUID(),
      email,
      password, // In a real app, this would be hashed
      ...options?.data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    registeredUsers.push(newUser);
    
    return {
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          user_metadata: {
            full_name: newUser.full_name,
            user_type: newUser.user_type
          },
          app_metadata: {},
          aud: 'authenticated'
        },
        session: {
          access_token: `mock-token-${newUser.id}`,
          refresh_token: `mock-refresh-${newUser.id}`,
          expires_at: Date.now() + 3600
        }
      },
      error: null
    };
  },
  
  signInWithPassword: async ({ email, password }) => {
    // Find user
    const user = registeredUsers.find(
      u => u.email === email && u.password === password
    );
    
    if (!user) {
      return {
        data: null,
        error: { message: 'Invalid login credentials' }
      };
    }
    
    return {
      data: {
        user: {
          id: user.id,
          email: user.email,
          user_metadata: {
            full_name: user.full_name,
            user_type: user.user_type
          },
          app_metadata: {},
          aud: 'authenticated'
        },
        session: {
          access_token: `mock-token-${user.id}`,
          refresh_token: `mock-refresh-${user.id}`,
          expires_at: Date.now() + 3600
        }
      },
      error: null
    };
  },
  
  signOut: async () => {
    return { error: null };
  },
  
  getSession: async () => {
    // Mock a session for testing
    return {
      data: {
        session: {
          user: MOCK_USERS.homeowner
        }
      },
      error: null
    };
  }
};

// Mock Supabase Database API
const mockSupabaseDB = {
  from: (tableName) => {
    return {
      select: (columns) => {
        return {
          eq: (column, value) => {
            if (tableName === 'profiles') {
              const user = registeredUsers.find(u => u[column] === value);
              return {
                single: () => ({
                  data: user,
                  error: user ? null : { message: 'User not found' }
                })
              };
            }
            return {
              data: [],
              error: null
            };
          }
        };
      },
      insert: (data) => {
        if (tableName === 'profiles') {
          // Check if profile already exists
          const existingProfile = registeredUsers.find(u => u.id === data.id);
          if (existingProfile) {
            return {
              data: null,
              error: { message: 'Profile already exists' }
            };
          }
          
          // Add new profile
          registeredUsers.push(data);
          return {
            data,
            error: null
          };
        }
        
        return {
          data,
          error: null
        };
      }
    };
  }
};

// Helper function to generate a UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Export the mock Supabase client
module.exports = {
  MOCK_USERS,
  registeredUsers,
  auth: mockSupabaseAuth,
  db: mockSupabaseDB
};
