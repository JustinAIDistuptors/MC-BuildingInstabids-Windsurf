// Script to clear projects from localStorage
// Run this in the browser console to immediately clear all projects

function clearProjects() {
  try {
    // Remove projects from localStorage
    localStorage.setItem('mock_projects', JSON.stringify([]));
    console.log('✅ All projects have been cleared from localStorage');
    
    // Force refresh the page to show the changes
    window.location.reload();
    
    return true;
  } catch (error) {
    console.error('❌ Error clearing projects:', error);
    return false;
  }
}

// Execute the function
clearProjects();
