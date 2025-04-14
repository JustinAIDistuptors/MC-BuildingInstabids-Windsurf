// Script to fix the project form submission
require('dotenv').config({ path: './instabids/.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixProjectForm() {
  console.log('Fixing project form submission...');
  
  try {
    // 1. First, try to create a very basic project with minimal fields
    const basicProject = {
      title: 'Basic Test Project',
      description: 'This is a basic test project'
    };
    
    console.log('Attempting to create a basic project with minimal fields...');
    
    const { data: basicData, error: basicError } = await supabase
      .from('projects')
      .insert([basicProject])
      .select();
    
    if (basicError) {
      console.error('Error creating basic project:', basicError);
      
      if (basicError.code === '23502') {
        console.log('NOT NULL constraint violation. Some required fields are missing.');
        console.log('Details:', basicError.details);
        
        // Try to extract the column name from the error message
        const match = basicError.details?.match(/column "(.*?)" of relation/);
        if (match && match[1]) {
          console.log(`Missing required column: ${match[1]}`);
        }
      }
    } else {
      console.log('Basic project created successfully!');
      console.log('Project structure:', basicData[0]);
      
      // Update the BidCardForm component to match this structure
      updateBidCardForm(Object.keys(basicData[0]));
    }
    
    // 2. Try to get the table structure directly
    console.log('\nAttempting to get table structure directly...');
    
    // Try a different approach - create a SQL function to get column names
    const { error: functionError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION get_column_names(table_name text)
        RETURNS TABLE(column_name text, data_type text, is_nullable text)
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
          RETURN QUERY EXECUTE format('
            SELECT column_name::text, data_type::text, is_nullable::text
            FROM information_schema.columns
            WHERE table_name = %L
            ORDER BY ordinal_position
          ', table_name);
        END;
        $$;
      `
    });
    
    if (functionError) {
      console.error('Error creating SQL function:', functionError);
    } else {
      console.log('SQL function created successfully!');
      
      // Now call the function to get column names
      const { data: columns, error: columnsError } = await supabase.rpc('get_column_names', {
        table_name: 'projects'
      });
      
      if (columnsError) {
        console.error('Error getting column names:', columnsError);
      } else {
        console.log('Column names retrieved successfully!');
        console.log('Columns:', columns);
        
        // Update the BidCardForm component based on these columns
        const columnNames = columns.map(col => col.column_name);
        updateBidCardForm(columnNames);
      }
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

function updateBidCardForm(columns) {
  console.log('\nUpdating BidCardForm component with correct columns:', columns);
  
  // Create a fixed version of the form submission code
  const fixedCode = `
  // Handle form submission - only triggered by the submit button
  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);
      console.log('Form submitted with data:', data);
      console.log('Media files:', mediaFiles);
      
      // Save the submitted data
      setSubmittedData(data);
      
      // Create a properly formatted project object for Supabase
      // Only include fields that exist in the database
      const newProject = {
        title: data.title || 'Untitled Project',
        description: data.description || 'No description provided',
        status: 'published'${columns.includes('bid_status') ? `,
        bid_status: 'accepting_bids'` : ''}${columns.includes('budget_min') ? `,
        budget_min: data.job_size === 'small' ? 1000 : data.job_size === 'medium' ? 5000 : 10000` : ''}${columns.includes('budget_max') ? `,
        budget_max: data.job_size === 'small' ? 5000 : data.job_size === 'medium' ? 15000 : 30000` : ''}${columns.includes('zip_code') ? `,
        zip_code: data.zip_code || data.location?.zip_code || ''` : ''}${columns.includes('location') ? `,
        location: data.location?.city && data.location?.state ? 
          \`\${data.location.city}, \${data.location.state} \${data.location.zip_code || ''}\` : 
          data.zip_code || 'Not specified'` : ''}${columns.includes('type') ? `,
        type: data.job_type_id === 'renovation' ? 'Renovation' : 
              data.job_type_id === 'new_construction' ? 'New Construction' : 
              data.job_type_id === 'repair' ? 'Repair' : 'One-Time'` : ''}${columns.includes('created_at') ? `,
        created_at: new Date().toISOString()` : ''}${columns.includes('updated_at') ? `,
        updated_at: new Date().toISOString()` : ''}
      };
      
      console.log('Attempting to save project to Supabase:', newProject);
      
      // Save to Supabase
      const { data: savedProject, error } = await supabase
        .from('projects')
        .insert([newProject])
        .select()
        .single();
      
      if (error) {
        console.error('Error saving project to Supabase:', error);
        toast({
          title: 'Error',
          description: \`Failed to save your project: \${error.message}\`,
          variant: 'destructive',
        });
        return;
      }
      
      console.log('Project saved successfully to Supabase:', savedProject);
      
      // Handle media files if any
      if (mediaFiles.length > 0) {
        console.log(\`Attempting to upload \${mediaFiles.length} media files\`);
        
        // First, check if the storage bucket exists
        const { data: buckets } = await supabase.storage.listBuckets();
        const hasBucket = buckets?.some(b => b.name === 'Project Media');
        
        if (!hasBucket) {
          console.log('Creating Project Media bucket...');
          try {
            await supabase.storage.createBucket('Project Media', { public: true });
            console.log('Bucket created successfully');
          } catch (bucketError) {
            console.error('Error creating bucket:', bucketError);
          }
        }
        
        // Upload each media file to Supabase storage
        for (let i = 0; i < mediaFiles.length; i++) {
          const file = mediaFiles[i];
          if (!file) {
            console.log(\`File at index \${i} is undefined, skipping\`);
            continue;
          }
          
          console.log(\`Processing file \${i + 1}/\${mediaFiles.length}: \${file.name} (\${file.type})\`);
          
          const fileExt = file.name.split('.').pop();
          const fileName = \`\${savedProject.id}/\${Date.now()}_\${i}.\${fileExt}\`;
          
          console.log(\`Uploading to storage path: Project Media/\${fileName}\`);
          
          try {
            const { data: uploadData, error: uploadError } = await supabase
              .storage
              .from('Project Media')
              .upload(fileName, file);
            
            if (uploadError) {
              console.error(\`Error uploading file \${i + 1}:\`, uploadError);
              continue;
            }
            
            console.log(\`File \${i + 1} uploaded successfully:\`, uploadData);
            
            // Get the public URL for the uploaded file
            const { data: publicUrlData } = supabase
              .storage
              .from('Project Media')
              .getPublicUrl(fileName);
            
            console.log(\`Public URL for file \${i + 1}:\`, publicUrlData);
            
            // Store the media URL in localStorage since we might not have a project_media table
            try {
              const mediaKey = \`project_media_\${savedProject.id}\`;
              const existingMedia = JSON.parse(localStorage.getItem(mediaKey) || '[]');
              existingMedia.push({
                project_id: savedProject.id,
                media_url: publicUrlData?.publicUrl,
                media_type: file.type,
                file_name: file.name,
                created_at: new Date().toISOString()
              });
              localStorage.setItem(mediaKey, JSON.stringify(existingMedia));
              console.log(\`Saved media reference to localStorage for project \${savedProject.id}\`);
            } catch (storageError) {
              console.error('Error saving media reference to localStorage:', storageError);
            }
          } catch (fileError) {
            console.error(\`Unexpected error processing file \${i + 1}:\`, fileError);
          }
        }
      }
      
      // Show success screen
      setIsSubmitted(true);
      
      toast({
        title: 'Success',
        description: 'Your project has been created successfully.',
      });
      
    } catch (error) {
      console.error('Failed to save project:', error);
      toast({
        title: 'Error',
        description: \`An unexpected error occurred: \${error instanceof Error ? error.message : 'Unknown error'}\`,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  `;
  
  // Save the fixed code to a file
  fs.writeFileSync('fixed-form-submission.txt', fixedCode);
  console.log('Fixed form submission code saved to fixed-form-submission.txt');
}

// Run the fix
fixProjectForm();
