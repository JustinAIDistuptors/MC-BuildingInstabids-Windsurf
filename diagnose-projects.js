// Diagnostic script to check projects and media data
require('dotenv').config({ path: './instabids/.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function runDiagnostics() {
  console.log('=== INSTABIDS PROJECT DIAGNOSTICS ===');
  console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('Checking database connection...');
  
  try {
    // 1. Check projects table
    console.log('\n=== PROJECTS TABLE ===');
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*');
    
    if (projectsError) {
      console.error('❌ Error querying projects table:', projectsError.message);
    } else {
      console.log(`✅ Found ${projects?.length || 0} projects in the database`);
      
      if (projects && projects.length > 0) {
        console.log('\nPROJECTS:');
        projects.forEach((project, index) => {
          console.log(`${index + 1}. ID: ${project.id}`);
          console.log(`   Title: ${project.title}`);
          console.log(`   Status: ${project.status}`);
          console.log(`   Created: ${project.created_at}`);
          console.log('---');
        });
      } else {
        console.log('⚠️ No projects found in the database');
      }
    }
    
    // 2. Check project_media table
    console.log('\n=== PROJECT MEDIA TABLE ===');
    const { data: media, error: mediaError } = await supabase
      .from('project_media')
      .select('*');
    
    if (mediaError) {
      console.error('❌ Error querying project_media table:', mediaError.message);
    } else {
      console.log(`✅ Found ${media?.length || 0} media items in the database`);
      
      if (media && media.length > 0) {
        console.log('\nMEDIA ITEMS:');
        media.forEach((item, index) => {
          console.log(`${index + 1}. ID: ${item.id}`);
          console.log(`   Project ID: ${item.project_id}`);
          console.log(`   URL: ${item.media_url}`);
          console.log('---');
        });
        
        // Check if media items are associated with projects
        if (projects && projects.length > 0) {
          console.log('\n=== PROJECT-MEDIA ASSOCIATIONS ===');
          const projectsWithMedia = projects.filter(project => 
            media.some(item => item.project_id === project.id)
          );
          
          console.log(`✅ Found ${projectsWithMedia.length} projects with associated media`);
          
          projectsWithMedia.forEach((project, index) => {
            const mediaForProject = media.filter(item => item.project_id === project.id);
            console.log(`${index + 1}. Project "${project.title}" (ID: ${project.id}) has ${mediaForProject.length} media items`);
          });
        }
      } else {
        console.log('⚠️ No media items found in the database');
      }
    }
    
    // 3. Check if the activeTab filter is working correctly
    if (projects && projects.length > 0) {
      console.log('\n=== ACTIVE TAB FILTER CHECK ===');
      
      const activeProjects = projects.filter(project => 
        project.status === 'active' || project.status === 'accepting_bids'
      );
      
      const draftProjects = projects.filter(project => 
        project.status === 'draft'
      );
      
      const completedProjects = projects.filter(project => 
        project.status === 'completed'
      );
      
      console.log(`Active projects: ${activeProjects.length}`);
      console.log(`Draft projects: ${draftProjects.length}`);
      console.log(`Completed projects: ${completedProjects.length}`);
      console.log(`Other status projects: ${projects.length - activeProjects.length - draftProjects.length - completedProjects.length}`);
      
      if (projects.length > 0 && activeProjects.length === 0 && draftProjects.length === 0 && completedProjects.length === 0) {
        console.log('\n⚠️ WARNING: No projects match the status filters used in the UI');
        console.log('Project statuses found:');
        const statuses = [...new Set(projects.map(p => p.status))];
        statuses.forEach(status => console.log(`- "${status}"`));
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error during diagnostics:', error.message);
  }
}

runDiagnostics();
