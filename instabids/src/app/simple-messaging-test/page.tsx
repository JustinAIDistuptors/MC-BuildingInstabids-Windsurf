'use client';

import React, { useState } from 'react';
import SimpleMessaging from '@/components/messaging/SimpleMessaging';

export default function SimpleMessagingTestPage() {
  const [projectId] = useState('test-project-123');
  const [showComponent, setShowComponent] = useState(true);
  const [errorLog, setErrorLog] = useState<string[]>([]);

  // Reset component
  const resetComponent = () => {
    setShowComponent(false);
    setTimeout(() => setShowComponent(true), 100);
  };

  // Clear localStorage
  const clearStorage = () => {
    try {
      localStorage.removeItem(`contractors_${projectId}`);
      localStorage.removeItem(`messages_${projectId}`);
      setErrorLog(prev => [...prev, `${new Date().toLocaleTimeString()}: Local storage cleared`]);
      resetComponent();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setErrorLog(prev => [...prev, `${new Date().toLocaleTimeString()}: Error clearing storage: ${errorMessage}`]);
    }
  };

  // Page styles
  const styles = {
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: 'system-ui, sans-serif',
    },
    header: {
      marginBottom: '20px',
    },
    title: {
      fontSize: '24px',
      fontWeight: 'bold',
      marginBottom: '8px',
    },
    subtitle: {
      fontSize: '16px',
      color: '#666',
      marginBottom: '20px',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1fr)',
      gap: '20px',
      '@media (min-width: 768px)': {
        gridTemplateColumns: '3fr 1fr',
      },
    },
    card: {
      backgroundColor: '#fff',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      overflow: 'hidden',
    },
    cardHeader: {
      padding: '16px',
      borderBottom: '1px solid #eee',
      backgroundColor: '#f9f9f9',
    },
    cardTitle: {
      fontSize: '18px',
      fontWeight: 'bold',
      margin: 0,
    },
    cardContent: {
      padding: '16px',
    },
    button: {
      display: 'block',
      width: '100%',
      padding: '8px 16px',
      backgroundColor: '#0070f3',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      marginBottom: '12px',
      textAlign: 'center' as const,
    },
    logContainer: {
      backgroundColor: '#f5f5f5',
      padding: '12px',
      borderRadius: '4px',
      maxHeight: '300px',
      overflowY: 'auto' as const,
    },
    logItem: {
      padding: '4px 0',
      borderBottom: '1px solid #eee',
      fontSize: '14px',
      fontFamily: 'monospace',
    },
    emptyLog: {
      color: '#999',
      fontStyle: 'italic' as const,
    },
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Simple Messaging Test</h1>
        <p style={styles.subtitle}>
          A lightweight test page for the contractor messaging component
        </p>
      </header>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 3fr) minmax(0, 1fr)',
        gap: '20px',
      }}>
        <div>
          {showComponent ? (
            <SimpleMessaging 
              projectId={projectId} 
              projectTitle="Test Project" 
            />
          ) : (
            <div style={{
              height: '600px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f9f9f9',
              borderRadius: '8px',
            }}>
              <p>Resetting component...</p>
            </div>
          )}
        </div>

        <div>
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>Test Controls</h2>
            </div>
            <div style={styles.cardContent}>
              <button 
                onClick={resetComponent}
                style={styles.button}
              >
                Reset Component
              </button>
              
              <button 
                onClick={clearStorage}
                style={styles.button}
              >
                Clear Test Data
              </button>
              
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginTop: '20px', marginBottom: '8px' }}>
                Error Log
              </h3>
              
              <div style={styles.logContainer}>
                {errorLog.length > 0 ? (
                  errorLog.map((log, index) => (
                    <div key={index} style={styles.logItem}>
                      {log}
                    </div>
                  ))
                ) : (
                  <p style={styles.emptyLog}>No errors logged</p>
                )}
              </div>
            </div>
          </div>
          
          <div style={{ ...styles.card, marginTop: '20px' }}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>Component Info</h2>
            </div>
            <div style={styles.cardContent}>
              <p style={{ marginBottom: '12px' }}>
                This is a simplified version of the contractor messaging component that:
              </p>
              <ul style={{ paddingLeft: '20px', marginBottom: '12px' }}>
                <li>Uses inline styles instead of UI components</li>
                <li>Supports group and individual messaging</li>
                <li>Uses the same service layer for data</li>
                <li>Has simplified error handling</li>
              </ul>
              <p>
                Project ID: <code>{projectId}</code>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
