#!/usr/bin/env node

/**
 * Example: Basic Usage of Autonomous Development Team MCP Server
 * 
 * This example demonstrates how to use the MCP server to create
 * a simple task management application from a PRD.
 */

// Example PRD for a Task Management Application
const taskManagerPRD = `
Product Requirements Document: Task Management Application

Overview:
Create a modern task management application that allows users to create, organize, and track tasks efficiently.

Core Features:
1. User Authentication
   - User registration and login
   - Password reset functionality
   - Session management

2. Task Management
   - Create, read, update, and delete tasks
   - Task categorization and tagging
   - Priority levels (High, Medium, Low)
   - Due dates and reminders

3. Task Organization
   - Project-based task grouping
   - Status tracking (Todo, In Progress, Done)
   - Search and filtering capabilities
   - Bulk operations

4. User Interface
   - Responsive web interface
   - Drag-and-drop task reordering
   - Real-time updates
   - Mobile-friendly design

5. Notifications
   - Email notifications for due dates
   - In-app notifications
   - Reminder system

Technical Requirements:
- Modern web application
- RESTful API backend
- Database persistence
- Real-time capabilities
- Secure authentication
- Scalable architecture

Success Criteria:
- Users can successfully register and login
- Users can create and manage tasks
- Tasks can be organized by projects and status
- Real-time updates work correctly
- Application is responsive on mobile devices
- All CRUD operations work as expected
`;

// Example LLM Configurations
const openaiConfig = {
  provider: "openai",
  apiKey: process.env.OPENAI_API_KEY || "your-api-key-here",
  model: "gpt-4",
  temperature: 0.7,
  maxTokens: 4000
};

const openrouterConfig = {
  provider: "openrouter",
  apiKey: process.env.OPENROUTER_API_KEY || "your-openrouter-api-key-here",
  model: "openai/gpt-4",
  temperature: 0.7,
  maxTokens: 4000
};

const geminiConfig = {
  provider: "gemini",
  apiKey: process.env.GEMINI_API_KEY || "your-google-api-key-here",
  model: "gemini-1.5-pro",
  temperature: 0.7,
  maxTokens: 4000
};

// Default config
const llmConfig = openaiConfig;

// Example usage functions
async function exampleUsage() {
  console.log("🚀 Autonomous Development Team MCP Server - Example Usage\n");

  try {
    // Step 1: Initialize services
    console.log("1. Initializing services...");
    // This would be done via MCP tool call in actual usage
    // initialize_services({ llmConfig })

    // Step 2: Execute complete project
    console.log("2. Executing complete project...");
    // This would be done via MCP tool call in actual usage
    // execute_project({
    //   prd: taskManagerPRD,
    //   projectName: "TaskManager",
    //   projectDescription: "A modern task management application",
    //   llmConfig: llmConfig
    // })

    // Step 3: Get project status
    console.log("3. Getting project status...");
    // This would be done via MCP tool call in actual usage
    // get_project_status()

    console.log("\n✅ Example completed successfully!");
    console.log("\nTo use this in practice:");
    console.log("1. Set up your LLM API key in environment variables");
    console.log("2. Use the MCP tools through your MCP client (Cursor, Claude Code, etc.)");
    console.log("3. Call the tools with the parameters shown in the comments above");

  } catch (error) {
    console.error("❌ Example failed:", error);
  }
}

// Example of individual tool usage
async function individualToolExamples() {
  console.log("\n🔧 Individual Tool Examples:\n");

  // Example 1: Requirements Analysis
console.log("Example 1: Requirements Analysis");
console.log("Tool: analyze_requirements");
console.log("Parameters:");
console.log(JSON.stringify({
  prd: taskManagerPRD,
  projectName: "TaskManager",
  projectDescription: "A modern task management application"
}, null, 2));
console.log();

// Example 1b: Requirements Analysis with different providers
console.log("Example 1b: Requirements Analysis with OpenRouter");
console.log("Tool: analyze_requirements");
console.log("Parameters:");
console.log(JSON.stringify({
  prd: taskManagerPRD,
  projectName: "TaskManager",
  projectDescription: "A modern task management application",
  llmConfig: openrouterConfig
}, null, 2));
console.log();

console.log("Example 1c: Requirements Analysis with Gemini");
console.log("Tool: analyze_requirements");
console.log("Parameters:");
console.log(JSON.stringify({
  prd: taskManagerPRD,
  projectName: "TaskManager",
  projectDescription: "A modern task management application",
  llmConfig: geminiConfig
}, null, 2));
console.log();

  // Example 2: Architecture Creation
  console.log("Example 2: Architecture Creation");
  console.log("Tool: create_architecture");
  console.log("Parameters:");
  console.log(JSON.stringify({
    userStories: [
      {
        id: "us-001",
        title: "User Registration",
        description: "As a new user, I want to register for an account so that I can access the task management system",
        acceptanceCriteria: ["User can enter email and password", "System validates email format", "Password meets security requirements"],
        priority: "high"
      }
    ],
    projectName: "TaskManager",
    projectDescription: "A modern task management application"
  }, null, 2));
  console.log();

  // Example 3: Feature Implementation
  console.log("Example 3: Feature Implementation");
  console.log("Tool: implement_feature");
  console.log("Parameters:");
  console.log(JSON.stringify({
    feature: "User Authentication",
    architecture: {
      techStack: {
        frontend: ["React"],
        backend: ["Node.js", "Express"],
        database: "PostgreSQL"
      }
    },
    userStories: [
      {
        id: "us-001",
        title: "User Registration",
        description: "As a new user, I want to register for an account",
        acceptanceCriteria: ["User can enter email and password"],
        priority: "high"
      }
    ]
  }, null, 2));
  console.log();

  // Example 4: Code Review
  console.log("Example 4: Code Review");
  console.log("Tool: review_code");
  console.log("Parameters:");
  console.log(JSON.stringify({
    code: `
function createUser(userData) {
  const user = new User(userData);
  return user.save();
}
    `,
    context: "User authentication feature"
  }, null, 2));
  console.log();
}

// Example project structure that would be generated
function showGeneratedProjectStructure() {
  console.log("\n📁 Generated Project Structure:\n");
  
  const projectStructure = `
TaskManager/
├── src/
│   ├── components/
│   │   ├── Auth/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── ForgotPassword.jsx
│   │   ├── Tasks/
│   │   │   ├── TaskList.jsx
│   │   │   ├── TaskForm.jsx
│   │   │   └── TaskItem.jsx
│   │   └── Layout/
│   │       ├── Header.jsx
│   │       ├── Sidebar.jsx
│   │       └── Footer.jsx
│   ├── services/
│   │   ├── api.js
│   │   ├── auth.js
│   │   └── tasks.js
│   ├── utils/
│   │   ├── validation.js
│   │   └── helpers.js
│   └── App.jsx
├── server/
│   ├── routes/
│   │   ├── auth.js
│   │   ├── tasks.js
│   │   └── projects.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Task.js
│   │   └── Project.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── validation.js
│   └── server.js
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docs/
│   ├── API.md
│   ├── DEPLOYMENT.md
│   └── ARCHITECTURE.md
├── config/
│   ├── database.js
│   └── environment.js
├── package.json
├── package-lock.json
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
  `;
  
  console.log(projectStructure);
}

// Example generated files
function showGeneratedFiles() {
  console.log("\n📄 Example Generated Files:\n");
  
  console.log("1. package.json:");
  console.log(JSON.stringify({
    name: "task-manager",
    version: "1.0.0",
    description: "A modern task management application",
    main: "server/server.js",
    scripts: {
      start: "node server/server.js",
      dev: "nodemon server/server.js",
      test: "jest",
      build: "npm run build:frontend && npm run build:backend"
    },
    dependencies: {
      express: "^4.18.2",
      cors: "^2.8.5",
      helmet: "^7.1.0",
      pg: "^8.11.3",
      bcryptjs: "^2.4.3",
      jsonwebtoken: "^9.0.2",
      dotenv: "^16.3.1",
      zod: "^3.22.4"
    }
  }, null, 2));
  
  console.log("\n2. Dockerfile:");
  console.log(`
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
  `);
  
  console.log("\n3. API Routes (server/routes/tasks.js):");
  console.log(`
const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const auth = require('../middleware/auth');

// Get all tasks
router.get('/', auth, async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user.id });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create task
router.post('/', auth, async (req, res) => {
  try {
    const task = new Task({
      ...req.body,
      userId: req.user.id
    });
    await task.save();
    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ message: 'Invalid data' });
  }
});

module.exports = router;
  `);
}

// Run examples
if (require.main === module) {
  exampleUsage();
  individualToolExamples();
  showGeneratedProjectStructure();
  showGeneratedFiles();
}

module.exports = {
  exampleUsage,
  individualToolExamples,
  showGeneratedProjectStructure,
  showGeneratedFiles,
  taskManagerPRD,
  llmConfig,
  openaiConfig,
  openrouterConfig,
  geminiConfig
};