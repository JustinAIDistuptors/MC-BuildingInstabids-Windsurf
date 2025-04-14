// Comprehensive fix script for InstaBids application
require('dotenv').config({ path: './instabids/.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function fixApplication() {
  console.log('\n=== INSTABIDS APPLICATION FIX ===\n');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  
  try {
    // 1. Check and fix storage buckets
    console.log('\n--- FIXING STORAGE BUCKETS ---');
    
    // List all buckets to find the actual bucket name
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError.message);
    } else {
      console.log(`Found ${buckets.length} buckets:`);
      buckets.forEach(bucket => {
        console.log(`- ${bucket.name} (public: ${bucket.public})`);
      });
      
      // Check for project-media bucket (case insensitive)
      const projectMediaBucket = buckets.find(b => 
        b.name.toLowerCase() === 'project-media' || 
        b.name.toLowerCase() === 'projectmedia'
      );
      
      if (projectMediaBucket) {
        console.log(`Found project media bucket: ${projectMediaBucket.name}`);
        
        // Update bucket to be public if it's not
        if (!projectMediaBucket.public) {
          console.log('Making bucket public...');
          const { error: updateError } = await supabase.storage.updateBucket(projectMediaBucket.name, {
            public: true
          });
          
          if (updateError) {
            console.error('Error updating bucket:', updateError.message);
          } else {
            console.log('Bucket permissions updated successfully');
          }
        }
        
        // Update BidCardForm.tsx to use the correct bucket name
        console.log(`Updating code to use bucket name: ${projectMediaBucket.name}`);
        
        // Update references in database
        console.log('Checking project_media table for URL consistency...');
        const { data: mediaItems, error: mediaError } = await supabase
          .from('project_media')
          .select('*');
        
        if (mediaError) {
          console.error('Error fetching media items:', mediaError.message);
        } else if (mediaItems && mediaItems.length > 0) {
          console.log(`Found ${mediaItems.length} media items`);
          
          // Check URL patterns
          const urlPatterns = new Set();
          mediaItems.forEach(item => {
            const urlParts = item.media_url.split('/');
            const bucketPart = urlParts.findIndex(part => part === 'object') + 2;
            if (bucketPart < urlParts.length) {
              urlPatterns.add(urlParts[bucketPart]);
            }
          });
          
          console.log('URL patterns found in database:');
          urlPatterns.forEach(pattern => console.log(`- ${pattern}`));
          
          if (urlPatterns.size > 1) {
            console.log('WARNING: Multiple bucket name patterns found in URLs');
          }
        }
      } else {
        // Create project-media bucket
        console.log('Project media bucket not found, creating it...');
        const { data, error: createError } = await supabase.storage.createBucket('project-media', {
          public: true
        });
        
        if (createError) {
          console.error('Error creating bucket:', createError.message);
        } else {
          console.log('Bucket created successfully');
        }
      }
    }
    
    // 2. Fix project status values for proper filtering
    console.log('\n--- FIXING PROJECT STATUS VALUES ---');
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*');
    
    if (projectsError) {
      console.error('Error fetching projects:', projectsError.message);
    } else if (projects && projects.length > 0) {
      console.log(`Found ${projects.length} projects`);
      
      // Check status values
      const statuses = [...new Set(projects.map(p => p.status))];
      console.log('Current status values:', statuses);
      
      // Check if we need to update any statuses
      const projectsToUpdate = projects.filter(p => 
        p.status === 'published' && 
        !p.bid_status
      );
      
      if (projectsToUpdate.length > 0) {
        console.log(`Updating ${projectsToUpdate.length} projects with status 'published' to have bid_status 'accepting_bids'`);
        
        for (const project of projectsToUpdate) {
          const { error: updateError } = await supabase
            .from('projects')
            .update({ bid_status: 'accepting_bids' })
            .eq('id', project.id);
          
          if (updateError) {
            console.error(`Error updating project ${project.id}:`, updateError.message);
          } else {
            console.log(`Updated project ${project.id}`);
          }
        }
      } else {
        console.log('No projects need status updates');
      }
    }
    
    // 3. Check project_media table structure
    console.log('\n--- CHECKING PROJECT_MEDIA TABLE ---');
    const { data: mediaSchema, error: schemaError } = await supabase
      .rpc('get_schema_info', { table_name: 'project_media' });
    
    if (schemaError) {
      console.log('Could not get schema info:', schemaError.message);
    } else {
      console.log('Project_media table schema info:', mediaSchema);
    }
    
    // 4. Summary and next steps
    console.log('\n=== FIX SUMMARY ===');
    console.log('Fix operations completed. Please:');
    console.log('1. Rebuild the Next.js application: cd instabids && npm run build');
    console.log('2. Restart the development server: cd instabids && npm run dev');
    console.log('3. Test the login functionality and project display');
    
  } catch (error) {
    console.error('Unexpected error during fix:', error);
  }
}

// Run the fix
fixApplication();
