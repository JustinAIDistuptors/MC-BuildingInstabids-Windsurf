'use client';

import React, { useState, useEffect } from 'react';
import { ContractorMessagingService, ContractorWithAlias, FormattedMessage } from '@/services/ContractorMessagingService';

export default function TestServicePage() {
  const [contractors, setContractors] = useState<ContractorWithAlias[]>([]);
  const [messages, setMessages] = useState<FormattedMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  
  // Test project ID
  const projectId = 'test-project-123';
  
  // Log function for tracking operations
  const log = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };
  
  // Load data on mount
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        log('Loading contractors...');
        
        // Get contractors
        const contractorsData = await ContractorMessagingService.getContractorsWithAliases(projectId);
        setContractors(contractorsData);
        log(`Loaded ${contractorsData.length} contractors`);
        
        // Get messages
        log('Loading messages...');
        const messagesData = await ContractorMessagingService.getMessages(projectId);
        setMessages(messagesData);
        log(`Loaded ${messagesData.length} messages`);
        
        setLoading(false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        log(`Error: ${errorMessage}`);
        setError(`Failed to load data: ${errorMessage}`);
        setLoading(false);
      }
    }
    
    loadData();
  }, []);
  
  // Send a test message
  const sendTestMessage = async (messageType: 'individual' | 'group') => {
    try {
      log(`Sending ${messageType} message...`);
      
      // Select recipient for individual message
      const recipientId = messageType === 'individual' && contractors.length > 0
        ? contractors[0].id
        : null;
      
      // Send message
      const success = await ContractorMessagingService.sendMessage(
        projectId,
        `Test ${messageType} message sent at ${new Date().toLocaleTimeString()}`,
        messageType,
        recipientId
      );
      
      if (success) {
        log('Message sent successfully');
        
        // Refresh messages
        const updatedMessages = await ContractorMessagingService.getMessages(projectId);
        setMessages(updatedMessages);
        log(`Messages updated, now have ${updatedMessages.length} messages`);
        
        // Simulate response after 1 second
        setTimeout(async () => {
          log('Simulating response...');
          await ContractorMessagingService.simulateResponse(
            projectId,
            messageType,
            contractors,
            recipientId
          );
          
          // Refresh messages again
          const messagesWithResponse = await ContractorMessagingService.getMessages(projectId);
          setMessages(messagesWithResponse);
          log(`Response received, now have ${messagesWithResponse.length} messages`);
        }, 1000);
      } else {
        log('Failed to send message');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      log(`Error: ${errorMessage}`);
      setError(`Failed to send message: ${errorMessage}`);
    }
  };
  
  // Clear all test data
  const clearTestData = () => {
    try {
      log('Clearing test data...');
      localStorage.removeItem(`contractors_${projectId}`);
      localStorage.removeItem(`messages_${projectId}`);
      
      // Reset state
      setContractors([]);
      setMessages([]);
      
      log('Test data cleared successfully');
      
      // Reload data
      setTimeout(async () => {
        const contractorsData = await ContractorMessagingService.getContractorsWithAliases(projectId);
        setContractors(contractorsData);
        
        const messagesData = await ContractorMessagingService.getMessages(projectId);
        setMessages(messagesData);
        
        log('Data reloaded with defaults');
      }, 500);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      log(`Error: ${errorMessage}`);
      setError(`Failed to clear data: ${errorMessage}`);
    }
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Contractor Messaging Service Test</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          <p className="font-medium">Error</p>
          <p>{error}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium mb-4">Contractors</h2>
            {loading ? (
              <p>Loading contractors...</p>
            ) : contractors.length === 0 ? (
              <p>No contractors found</p>
            ) : (
              <ul className="divide-y">
                {contractors.map(contractor => (
                  <li key={contractor.id} className="py-3">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium">Contractor {contractor.alias}</p>
                        <p className="text-sm text-gray-500">{contractor.full_name}</p>
                      </div>
                      {contractor.bid_amount && (
                        <p className="text-sm font-medium">${contractor.bid_amount.toLocaleString()}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">Test Controls</h2>
            <div className="space-y-4">
              <button
                onClick={() => sendTestMessage('individual')}
                disabled={loading || contractors.length === 0}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded disabled:opacity-50"
              >
                Send Individual Message
              </button>
              
              <button
                onClick={() => sendTestMessage('group')}
                disabled={loading || contractors.length === 0}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded disabled:opacity-50"
              >
                Send Group Message
              </button>
              
              <button
                onClick={clearTestData}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded"
              >
                Clear Test Data
              </button>
            </div>
          </div>
        </div>
        
        <div>
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium mb-4">Messages</h2>
            {loading ? (
              <p>Loading messages...</p>
            ) : messages.length === 0 ? (
              <p>No messages found</p>
            ) : (
              <ul className="divide-y">
                {messages.map(message => (
                  <li key={message.id} className="py-3">
                    <div className={`${message.isOwn ? 'text-right' : ''}`}>
                      <p className="text-sm text-gray-500">
                        {message.isOwn ? 'You' : message.senderName} • {ContractorMessagingService.formatTimestamp(message.created_at)}
                      </p>
                      <p className="mt-1">{message.content}</p>
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-500">Attachments: {message.attachments.length}</p>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">Operation Log</h2>
            <div className="bg-gray-50 p-3 rounded-md h-[300px] overflow-y-auto text-xs font-mono">
              {logs.length > 0 ? (
                <ul className="space-y-1">
                  {logs.map((log, index) => (
                    <li key={index}>{log}</li>
                  ))}
                </ul>
              ) : (
                <p>No operations logged yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
