// Simple Authentication Debugging Script
// Copy and paste this entire script into your browser console

(function() {
  console.log('🔍 Starting authentication debug...');
  
  // Check for Supabase in window
  if (!window.supabase) {
    console.log('❌ No global supabase client found in window');
    
    // Try to find any Supabase-related objects
    const supabaseKeys = Object.keys(window).filter(key => 
      key.toLowerCase().includes('supabase') || 
      key.toLowerCase().includes('auth')
    );
    
    if (supabaseKeys.length > 0) {
      console.log('🔑 Found potential Supabase-related objects:', supabaseKeys);
    }
  } else {
    console.log('✅ Found global supabase client');
  }
  
  // Check local storage for auth tokens
  console.log('🔐 Checking local storage for auth tokens...');
  const authItems = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.includes('supabase') || key.includes('auth')) {
      try {
        const value = localStorage.getItem(key);
        authItems[key] = value;
      } catch (e) {
        authItems[key] = 'Error reading value';
      }
    }
  }
  
  console.log('🗝️ Auth items in local storage:', authItems);
  
  // Create a simple display in the page
  const debugDiv = document.createElement('div');
  debugDiv.style.position = 'fixed';
  debugDiv.style.top = '20px';
  debugDiv.style.right = '20px';
  debugDiv.style.backgroundColor = 'white';
  debugDiv.style.border = '1px solid #ccc';
  debugDiv.style.borderRadius = '5px';
  debugDiv.style.padding = '15px';
  debugDiv.style.zIndex = '10000';
  debugDiv.style.maxWidth = '400px';
  debugDiv.style.boxShadow = '0 0 10px rgba(0,0,0,0.2)';
  
  let debugContent = '<h3 style="margin-top:0">Auth Debug Info</h3>';
  
  // Check URL for clues
  debugContent += `<p><strong>Current URL:</strong> ${window.location.href}</p>`;
  
  // Look for user info in the DOM
  const userElements = Array.from(document.querySelectorAll('*')).filter(el => 
    el.textContent && 
    (el.textContent.includes('HOMEOWNER') || 
     el.textContent.includes('CONTRACTOR') ||
     el.textContent.toLowerCase().includes('user:'))
  );
  
  if (userElements.length > 0) {
    debugContent += '<p><strong>User info in DOM:</strong></p><ul>';
    userElements.forEach(el => {
      debugContent += `<li>${el.textContent.trim()}</li>`;
    });
    debugContent += '</ul>';
  }
  
  // Add local storage info
  debugContent += '<p><strong>Auth in localStorage:</strong></p>';
  if (Object.keys(authItems).length > 0) {
    debugContent += '<ul>';
    for (const [key, value] of Object.entries(authItems)) {
      let displayValue = value;
      if (value && value.length > 50) {
        displayValue = value.substring(0, 50) + '...';
      }
      debugContent += `<li><strong>${key}:</strong> ${displayValue}</li>`;
    }
    debugContent += '</ul>';
  } else {
    debugContent += '<p>No auth items found in localStorage</p>';
  }
  
  // Add button to check current user
  debugContent += '<button id="check-auth-btn" style="background-color: #4CAF50; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-top: 10px;">Check Current User</button>';
  
  // Add close button
  debugContent += '<button id="close-debug-btn" style="background-color: #f44336; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-top: 10px; margin-left: 10px;">Close</button>';
  
  debugDiv.innerHTML = debugContent;
  document.body.appendChild(debugDiv);
  
  // Add event listeners
  document.getElementById('check-auth-btn').addEventListener('click', function() {
    // Try to find any auth module in the app
    console.log('🔍 Searching for auth module...');
    
    // Look for common auth patterns in React apps
    const authComponents = Array.from(document.querySelectorAll('[class*="auth"],[id*="auth"],[data-*="auth"]'));
    console.log('🧩 Found potential auth components:', authComponents);
    
    // Try to extract user info from React devtools
    console.log('⚛️ Tip: Open React DevTools to inspect auth state in components');
    
    // Add message to the debug div
    const msgDiv = document.createElement('div');
    msgDiv.style.marginTop = '10px';
    msgDiv.style.padding = '8px';
    msgDiv.style.backgroundColor = '#f8f9fa';
    msgDiv.style.border = '1px solid #ddd';
    msgDiv.style.borderRadius = '4px';
    
    msgDiv.innerHTML = `
      <p>Check browser console for detailed information.</p>
      <p>To find the current user:</p>
      <ol>
        <li>Open React DevTools (if available)</li>
        <li>Look for components with "Auth" in the name</li>
        <li>Check localStorage tokens in the Application tab</li>
      </ol>
    `;
    
    // Add before the buttons
    const buttons = document.getElementById('check-auth-btn').parentNode;
    buttons.parentNode.insertBefore(msgDiv, buttons);
  });
  
  document.getElementById('close-debug-btn').addEventListener('click', function() {
    document.body.removeChild(debugDiv);
  });
  
  console.log('✅ Auth debugging complete. Check the panel in the top right corner.');
})();