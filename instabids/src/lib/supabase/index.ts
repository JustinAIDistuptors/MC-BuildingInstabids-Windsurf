/**
 * Supabase Client Provider
 * 
 * This module provides a centralized approach to working with Supabase
 * across both server and client components, with proper type safety.
 */

// Re-export server and client implementations for direct access
export { createClient as createServerClient } from './server';
export { createClient as createBrowserClient } from './client';

// Type-safe database access utilities will be added here as the schema develops
