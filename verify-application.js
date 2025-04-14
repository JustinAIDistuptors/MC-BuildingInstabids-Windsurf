// Comprehensive verification script for InstaBids application
require('dotenv').config({ path: './instabids/.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Utility function to log results
function logResult(test, result, details = '') {
  const status = result ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${test}`);
  if (details) {
    console.log(`   ${details}`);
  }
  return result;
}

async function verifyApplication() {
  console.log('\n=== INSTABIDS APPLICATION VERIFICATION ===\n');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  
  let allTestsPassed = true;
  
  try {
    // 1. Verify Supabase connection
    console.log('\n--- SUPABASE CONNECTION ---');
    try {
      const { data, error } = await supabase.from('projects').select('count').single();
      if (error) throw error;
      allTestsPassed &= logResult('Supabase connection', true, 'Successfully connected to Supabase');
    } catch (error) {
      allTestsPassed &= logResult('Supabase connection', false, `Error: ${error.message}`);
    }
    
    // 2. Verify projects table
    console.log('\n--- PROJECTS TABLE ---');
    try {
      const { data: projects, error } = await supabase.from('projects').select('*');
      
      if (error) throw error;
      
      allTestsPassed &= logResult(
        'Projects table exists and is accessible', 
        true, 
        `Found ${projects.length} projects`
      );
      
      // Check project structure
      if (projects.length > 0) {
        const project = projects[0];
        const requiredFields = ['id', 'title', 'status', 'created_at'];
        const missingFields = requiredFields.filter(field => !(field in project));
        
        allTestsPassed &= logResult(
          'Project structure validation', 
          missingFields.length === 0,
          missingFields.length === 0 
            ? 'All required fields present'
            : `Missing fields: ${missingFields.join(', ')}`
        );
        
        // Log project statuses
        const statuses = [...new Set(projects.map(p => p.status))];
        console.log(`   Project statuses found: ${statuses.join(', ')}`);
      }
    } catch (error) {
      allTestsPassed &= logResult('Projects table check', false, `Error: ${error.message}`);
    }
    
    // 3. Verify project_media table
    console.log('\n--- PROJECT MEDIA TABLE ---');
    try {
      const { data: media, error } = await supabase.from('project_media').select('*');
      
      if (error) throw error;
      
      allTestsPassed &= logResult(
        'Project_media table exists and is accessible', 
        true, 
        `Found ${media.length} media items`
      );
      
      // Check media structure
      if (media.length > 0) {
        const mediaItem = media[0];
        const requiredFields = ['id', 'project_id', 'media_url', 'file_name'];
        const missingFields = requiredFields.filter(field => !(field in mediaItem));
        
        allTestsPassed &= logResult(
          'Media structure validation', 
          missingFields.length === 0,
          missingFields.length === 0 
            ? 'All required fields present'
            : `Missing fields: ${missingFields.join(', ')}`
        );
      }
      
      // Check project-media associations
      if (media.length > 0) {
        const { data: projects } = await supabase.from('projects').select('id');
        const projectIds = projects.map(p => p.id);
        const mediaProjectIds = [...new Set(media.map(m => m.project_id))];
        const orphanedMedia = mediaProjectIds.filter(id => !projectIds.includes(id));
        
        allTestsPassed &= logResult(
          'Project-media associations', 
          orphanedMedia.length === 0,
          orphanedMedia.length === 0 
            ? 'All media items are associated with existing projects'
            : `Found ${orphanedMedia.length} media items with non-existent project IDs`
        );
      }
    } catch (error) {
      allTestsPassed &= logResult('Project_media table check', false, `Error: ${error.message}`);
    }
    
    // 4. Verify storage bucket
    console.log('\n--- STORAGE BUCKET ---');
    try {
      const { data: buckets, error } = await supabase.storage.listBuckets();
      
      if (error) throw error;
      
      const projectMediaBucket = buckets.find(b => b.name === 'project-media');
      allTestsPassed &= logResult(
        'Project-media storage bucket', 
        !!projectMediaBucket,
        projectMediaBucket 
          ? 'Project-media bucket exists'
          : 'Project-media bucket not found'
      );
      
      if (projectMediaBucket) {
        // Check bucket permissions
        allTestsPassed &= logResult(
          'Storage bucket public access', 
          projectMediaBucket.public,
          projectMediaBucket.public 
            ? 'Bucket is publicly accessible as required'
            : 'Bucket is not publicly accessible'
        );
      }
    } catch (error) {
      allTestsPassed &= logResult('Storage bucket check', false, `Error: ${error.message}`);
    }
    
    // 5. Verify file structure
    console.log('\n--- APPLICATION FILE STRUCTURE ---');
    
    // Check critical files
    const criticalFiles = [
      './instabids/src/app/dashboard/homeowner/projects/page.tsx',
      './instabids/src/app/dashboard/homeowner/projects/[id]/page.tsx',
      './instabids/src/components/forms/bid-card/BidCardForm.tsx',
      './instabids/src/services/bid-card-service.ts'
    ];
    
    for (const file of criticalFiles) {
      allTestsPassed &= logResult(
        `File exists: ${file}`, 
        fs.existsSync(file),
        fs.existsSync(file) 
          ? 'File exists'
          : 'File not found'
      );
    }
    
    // 6. Verify Next.js build
    console.log('\n--- NEXT.JS BUILD ---');
    const buildDir = './instabids/.next';
    allTestsPassed &= logResult(
      'Next.js build directory', 
      fs.existsSync(buildDir),
      fs.existsSync(buildDir) 
        ? 'Build directory exists'
        : 'Build directory not found - application may not be built properly'
    );
    
    // 7. Summary
    console.log('\n=== VERIFICATION SUMMARY ===');
    console.log(allTestsPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
    console.log('See details above for specific issues that need to be addressed.');
    
    if (!allTestsPassed) {
      console.log('\n=== RECOMMENDED ACTIONS ===');
      console.log('1. Check Supabase connection and credentials');
      console.log('2. Verify database tables structure');
      console.log('3. Ensure storage bucket is properly configured');
      console.log('4. Rebuild the Next.js application: cd instabids && npm run build');
      console.log('5. Restart the development server: cd instabids && npm run dev');
    }
    
  } catch (error) {
    console.error('Unexpected error during verification:', error);
  }
}

// Run the verification
verifyApplication();
