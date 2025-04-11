'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { runMigration } from '@/scripts/migrate-projects-to-supabase';
import { projectService } from '@/services/ProjectService';

/**
 * Migration Tool Component
 * 
 * This component provides an admin interface for migrating projects
 * from localStorage to Supabase.
 */
export function MigrationTool() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean;
    message?: string;
    migratedCount?: number;
  }>({});

  // Handler for running the migration
  const handleMigrate = async () => {
    try {
      setIsLoading(true);
      setResult({});

      // Run the migration
      await runMigration();

      // Update the flag in localStorage to use Supabase going forward
      localStorage.setItem('use_supabase', 'true');

      // Set success result
      setResult({
        success: true,
        message: 'Migration completed successfully',
        migratedCount: 0 // This will be updated by the migration script
      });
    } catch (error) {
      console.error('Migration failed:', error);
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        migratedCount: 0
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Data Migration Tool</CardTitle>
        <CardDescription>
          Migrate project data from localStorage to Supabase database
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              1
            </div>
            <div>
              <h3 className="font-medium">Backup Data</h3>
              <p className="text-sm text-muted-foreground">
                Your localStorage data will be preserved during migration
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              2
            </div>
            <div>
              <h3 className="font-medium">Migrate to Supabase</h3>
              <p className="text-sm text-muted-foreground">
                All projects will be copied to the Supabase database
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              3
            </div>
            <div>
              <h3 className="font-medium">Switch Data Source</h3>
              <p className="text-sm text-muted-foreground">
                The application will start using Supabase for all operations
              </p>
            </div>
          </div>
          
          {result.success !== undefined && (
            <Alert variant={result.success ? "default" : "destructive"}>
              <div className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertTitle>
                  {result.success ? "Success" : "Error"}
                </AlertTitle>
              </div>
              <AlertDescription>
                {result.message}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleMigrate} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></span>
              Migrating...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              Migrate to Supabase
              <ArrowRight className="h-4 w-4" />
            </span>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

export default MigrationTool;
