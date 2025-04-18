/**
 * Authentication Debugging Tool for InstaBids
 * 
 * This script helps diagnose authentication issues by:
 * 1. Checking the current authentication state
 * 2. Comparing it with the displayed user information
 * 3. Identifying any mismatches
 */

// Add this to any page where you want to debug authentication
function addAuthDebugButton() {
  const debugButton = document.createElement('button');
  debugButton.textContent = 'Debug Auth';
  debugButton.style.position = 'fixed';
  debugButton.style.bottom = '10px';
  debugButton.style.right = '10px';
  debugButton.style.zIndex = '9999';
  debugButton.style.padding = '8px 12px';
  debugButton.style.backgroundColor = '#f44336';
  debugButton.style.color = 'white';
  debugButton.style.border = 'none';
  debugButton.style.borderRadius = '4px';
  debugButton.style.cursor = 'pointer';
  
  debugButton.onclick = async () => {
    // Get Supabase client
    const { createClient } = window.supabaseJs;
    const supabaseUrl = 'https://heqifyikpitzpwyasvop.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlcWlmeWlrcGl0enB3eWFzdm9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4NjI3NjMsImV4cCI6MjA1OTQzODc2M30.5Ew9RyW6umw_xB-mubmcp30Qo9eWOQ8J4fuk8li7yzo';
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Check current authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    // Create debug info display
    const debugInfo = document.createElement('div');
    debugInfo.style.position = 'fixed';
    debugInfo.style.top = '50%';
    debugInfo.style.left = '50%';
    debugInfo.style.transform = 'translate(-50%, -50%)';
    debugInfo.style.padding = '20px';
    debugInfo.style.backgroundColor = 'white';
    debugInfo.style.border = '1px solid #ccc';
    debugInfo.style.borderRadius = '8px';
    debugInfo.style.zIndex = '10000';
    debugInfo.style.maxWidth = '80%';
    debugInfo.style.maxHeight = '80%';
    debugInfo.style.overflow = 'auto';
    debugInfo.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
    
    // Format debug info
    let infoHTML = '<h2>Authentication Debug Info</h2>';
    
    // Current URL info
    infoHTML += '<h3>URL Information</h3>';
    infoHTML += `<p>Current URL: ${window.location.href}</p>`;
    infoHTML += `<p>Path: ${window.location.pathname}</p>`;
    
    // Session info
    infoHTML += '<h3>Session Information</h3>';
    if (sessionError) {
      infoHTML += `<p style="color: red;">Session Error: ${sessionError.message}</p>`;
    } else if (!session) {
      infoHTML += '<p style="color: orange;">No active session found</p>';
    } else {
      infoHTML += `<p>Session ID: ${session.access_token.substring(0, 10)}...</p>`;
      infoHTML += `<p>Expires: ${new Date(session.expires_at * 1000).toLocaleString()}</p>`;
    }
    
    // User info
    infoHTML += '<h3>User Information</h3>';
    if (userError) {
      infoHTML += `<p style="color: red;">User Error: ${userError.message}</p>`;
    } else if (!user) {
      infoHTML += '<p style="color: orange;">No authenticated user found</p>';
    } else {
      infoHTML += `<p>User ID: ${user.id}</p>`;
      infoHTML += `<p>Email: ${user.email}</p>`;
      infoHTML += `<p>Created: ${new Date(user.created_at).toLocaleString()}</p>`;
      
      // User metadata
      infoHTML += '<h4>User Metadata</h4>';
      if (user.user_metadata && Object.keys(user.user_metadata).length > 0) {
        infoHTML += '<ul>';
        for (const [key, value] of Object.entries(user.user_metadata)) {
          infoHTML += `<li><strong>${key}:</strong> ${JSON.stringify(value)}</li>`;
        }
        infoHTML += '</ul>';
      } else {
        infoHTML += '<p>No user metadata found</p>';
      }
      
      // App metadata
      infoHTML += '<h4>App Metadata</h4>';
      if (user.app_metadata && Object.keys(user.app_metadata).length > 0) {
        infoHTML += '<ul>';
        for (const [key, value] of Object.entries(user.app_metadata)) {
          infoHTML += `<li><strong>${key}:</strong> ${JSON.stringify(value)}</li>`;
        }
        infoHTML += '</ul>';
      } else {
        infoHTML += '<p>No app metadata found</p>';
      }
    }
    
    // DOM info - look for user identification in the UI
    infoHTML += '<h3>UI Information</h3>';
    const userElements = Array.from(document.querySelectorAll('*')).filter(el => 
      el.textContent && 
      (el.textContent.includes('HOMEOWNER') || 
       el.textContent.includes('CONTRACTOR') ||
       el.textContent.toLowerCase().includes('user:'))
    );
    
    if (userElements.length > 0) {
      infoHTML += '<p>Found potential user identification in UI:</p>';
      infoHTML += '<ul>';
      userElements.forEach(el => {
        infoHTML += `<li>${el.textContent.trim()}</li>`;
      });
      infoHTML += '</ul>';
    } else {
      infoHTML += '<p>No user identification found in UI</p>';
    }
    
    // Local storage info
    infoHTML += '<h3>Local Storage</h3>';
    const authKeys = Object.keys(localStorage).filter(key => 
      key.includes('supabase') || 
      key.includes('auth') || 
      key.includes('user')
    );
    
    if (authKeys.length > 0) {
      infoHTML += '<ul>';
      authKeys.forEach(key => {
        const value = localStorage.getItem(key);
        infoHTML += `<li><strong>${key}:</strong> ${value ? value.substring(0, 50) + '...' : 'null'}</li>`;
      });
      infoHTML += '</ul>';
    } else {
      infoHTML += '<p>No authentication-related items found in local storage</p>';
    }
    
    // Add close button
    infoHTML += '<button id="close-debug-info" style="margin-top: 20px; padding: 8px 16px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">Close</button>';
    
    debugInfo.innerHTML = infoHTML;
    document.body.appendChild(debugInfo);
    
    // Add close button event listener
    document.getElementById('close-debug-info').addEventListener('click', () => {
      document.body.removeChild(debugInfo);
    });
  };
  
  document.body.appendChild(debugButton);
}

// Function to inject the debug button into the page
function injectDebugButton() {
  // Create script element to load Supabase JS
  const supabaseScript = document.createElement('script');
  supabaseScript.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
  supabaseScript.onload = function() {
    // Once Supabase JS is loaded, add the debug button
    addAuthDebugButton();
  };
  document.head.appendChild(supabaseScript);
}

// Execute the injection when the page is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectDebugButton);
} else {
  injectDebugButton();
}

// Instructions for use:
// 1. Open the browser console
// 2. Copy and paste this entire script
// 3. Press Enter to execute
// 4. Click the "Debug Auth" button that appears in the bottom right
// 5. Review the authentication information displayed