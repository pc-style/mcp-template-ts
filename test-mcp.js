#!/usr/bin/env node

/**
 * Simple test script for the Autonomous Development Team MCP Server
 */

import { spawn } from 'child_process';
import path from 'path';

// Test the MCP server
async function testMCPServer() {
  console.log('🧪 Testing Autonomous Development Team MCP Server...\n');

  // Start the MCP server
  const serverProcess = spawn('node', ['dist/index.js'], {
    stdio: ['pipe', 'pipe', 'pipe']
  });

  // Test message
  const testMessage = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: {},
        resources: {},
        prompts: {}
      },
      clientInfo: {
        name: 'test-client',
        version: '1.0.0'
      }
    }
  };

  // Send test message
  serverProcess.stdin.write(JSON.stringify(testMessage) + '\n');

  // Handle response
  serverProcess.stdout.on('data', (data) => {
    const response = data.toString().trim();
    console.log('✅ Server Response:', response);
    
    try {
      const parsed = JSON.parse(response);
      if (parsed.result) {
        console.log('✅ MCP Server initialized successfully!');
      }
    } catch (error) {
      console.log('⚠️ Non-JSON response:', response);
    }
  });

  // Handle errors
  serverProcess.stderr.on('data', (data) => {
    console.error('❌ Server Error:', data.toString());
  });

  // Handle process exit
  serverProcess.on('close', (code) => {
    console.log(`\n🏁 Server process exited with code ${code}`);
  });

  // Cleanup after 5 seconds
  setTimeout(() => {
    serverProcess.kill();
    console.log('\n✅ Test completed!');
  }, 5000);
}

// Run the test
testMCPServer().catch(console.error);