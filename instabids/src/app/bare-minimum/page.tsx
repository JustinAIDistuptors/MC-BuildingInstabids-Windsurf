'use client';

import React, { useState, useEffect } from 'react';

export default function BareMinimumPage() {
  const [count, setCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  // Capture console logs
  useEffect(() => {
    try {
      const originalLog = console.log;
      const originalError = console.error;
      const originalWarn = console.warn;

      console.log = (...args) => {
        originalLog(...args);
        setLogs(prev => [...prev, `LOG: ${args.map(a => String(a)).join(' ')}`]);
      };

      console.error = (...args) => {
        originalError(...args);
        setLogs(prev => [...prev, `ERROR: ${args.map(a => String(a)).join(' ')}`]);
      };

      console.warn = (...args) => {
        originalWarn(...args);
        setLogs(prev => [...prev, `WARN: ${args.map(a => String(a)).join(' ')}`]);
      };

      console.log("Component mounted successfully");
      
      return () => {
        console.log = originalLog;
        console.error = originalError;
        console.warn = originalWarn;
      };
    } catch (e) {
      setError(`Error in useEffect: ${e instanceof Error ? e.message : String(e)}`);
    }
  }, []);

  const increment = () => {
    try {
      setCount(prev => prev + 1);
      console.log(`Count incremented to ${count + 1}`);
    } catch (e) {
      setError(`Error incrementing: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  return (
    <div style={{ 
      maxWidth: '600px', 
      margin: '0 auto', 
      padding: '20px', 
      fontFamily: 'system-ui, sans-serif'
    }}>
      <h1 style={{ color: '#333' }}>Bare Minimum Test Page</h1>
      
      {error && (
        <div style={{ 
          backgroundColor: '#ffdddd', 
          color: '#d8000c', 
          padding: '10px', 
          margin: '10px 0', 
          borderRadius: '4px' 
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}
      
      <div style={{ margin: '20px 0' }}>
        <p>Current count: {count}</p>
        <button 
          onClick={increment}
          style={{
            backgroundColor: '#4CAF50',
            border: 'none',
            color: 'white',
            padding: '10px 20px',
            textAlign: 'center',
            textDecoration: 'none',
            display: 'inline-block',
            fontSize: '16px',
            margin: '4px 2px',
            cursor: 'pointer',
            borderRadius: '4px'
          }}
        >
          Increment
        </button>
      </div>
      
      <div style={{
        backgroundColor: '#f8f9fa',
        border: '1px solid #ddd',
        borderRadius: '4px',
        padding: '10px',
        height: '200px',
        overflowY: 'auto',
        fontFamily: 'monospace',
        fontSize: '14px'
      }}>
        <h3>Console Output:</h3>
        {logs.length === 0 ? (
          <p>No logs yet.</p>
        ) : (
          logs.map((log, index) => (
            <div 
              key={index}
              style={{
                color: log.startsWith('ERROR') 
                  ? '#d8000c' 
                  : log.startsWith('WARN') 
                    ? '#9F6000' 
                    : '#333',
                margin: '2px 0'
              }}
            >
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
