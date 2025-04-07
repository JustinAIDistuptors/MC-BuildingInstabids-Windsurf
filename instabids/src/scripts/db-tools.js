#!/usr/bin/env node
/**
 * InstaBids Database Management Tools
 * 
 * This script provides a command-line interface to manage the InstaBids
 * Supabase database, including creating tables, viewing data, and testing
 * functionality.
 * 
 * Usage:
 *   node src/scripts/db-tools.js setup          # Setup required tables
 *   node src/scripts/db-tools.js list-tables    # List existing tables
 *   node src/scripts/db-tools.js view <table>   # View data in a table
 *   node src/scripts/db-tools.js create-user    # Create a test user
 *   node src/scripts/db-tools.js get-user <email> # Get user by email
 */

const dbAdmin = require('../lib/supabase/db-admin');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function main() {
  const command = process.argv[2];
  
  if (!command) {
    console.log('Please provide a command. Available commands:');
    console.log('  setup          - Setup required tables');
    console.log('  list-tables    - List existing tables');
    console.log('  view <table>   - View data in a table');
    console.log('  create-user    - Create a test user');
    console.log('  get-user <email> - Get user by email');
    rl.close();
    return;
  }
  
  try {
    switch (command) {
      case 'setup':
        await dbAdmin.setupDatabase();
        break;
        
      case 'list-tables':
        const tables = await dbAdmin.listTables();
        console.log('Tables:');
        console.log(tables);
        break;
        
      case 'view':
        const tableName = process.argv[3];
        if (!tableName) {
          console.log('Please provide a table name.');
          break;
        }
        await dbAdmin.viewTableData(tableName);
        break;
        
      case 'create-user':
        const email = await askQuestion('Email: ');
        const password = await askQuestion('Password: ');
        const fullName = await askQuestion('Full Name: ');
        const userType = await askQuestion('User Type (homeowner, contractor, property-manager, labor-contractor): ');
        
        const result = await dbAdmin.createUser({
          email,
          password,
          fullName,
          userType
        });
        
        console.log('Create user result:');
        console.log(result);
        break;
        
      case 'get-user':
        const userEmail = process.argv[3];
        if (!userEmail) {
          console.log('Please provide a user email.');
          break;
        }
        const user = await dbAdmin.getUserByEmail(userEmail);
        console.log('User:');
        console.log(user);
        break;
        
      default:
        console.log(`Unknown command: ${command}`);
        break;
    }
  } catch (error) {
    console.error('Error executing command:', error.message);
  }
  
  rl.close();
}

main();
