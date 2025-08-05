# Autonomous Development Team MCP Server

A comprehensive Model Context Protocol (MCP) server that enables clients (Cursor, Claude Code, etc.) to delegate tasks to specialized subagents forming an autonomous development team. The system takes a Product Requirements Document (PRD) and produces a working prototype through coordinated agent collaboration.

## 🚀 Features

### Core Capabilities
- **End-to-End Project Execution**: From PRD to working prototype
- **Multi-Agent Coordination**: Specialized agents for each development phase
- **Comprehensive Tooling**: 10+ MCP tools for various development tasks
- **Quality Assurance**: Built-in validation and testing at every phase
- **Production Ready**: Generates deployable code with CI/CD pipelines

### Agent Team Structure
- **Product Manager**: Analyzes PRDs, creates user stories, defines acceptance criteria
- **Tech Lead**: Designs system architecture, selects tech stack, creates API contracts
- **Developer**: Implements features, writes clean code, follows best practices
- **QA Engineer**: Creates test plans, writes comprehensive test suites
- **DevOps**: Sets up deployment, CI/CD pipelines, infrastructure as code
- **Orchestrator**: Coordinates all agents, manages project phases and workflow

### Supported Technologies
- **Frontend**: React, Vue, Angular, Next.js
- **Backend**: Node.js/Express, Python/FastAPI, Go
- **Databases**: PostgreSQL, MongoDB, SQLite
- **Deployment**: Docker, Kubernetes, GitHub Actions, GitLab CI
- **LLM Providers**: OpenAI, Anthropic, OpenRouter, Gemini, Local models

## 📋 MCP Tools

### 1. `execute_project`
Execute a complete project from PRD to working prototype.

**Parameters:**
- `prd`: Product Requirements Document
- `projectName`: Name of the project
- `projectDescription`: Optional project description
- `llmConfig`: LLM provider configuration

### 2. `analyze_requirements`
Analyze PRD and create user stories with acceptance criteria.

**Parameters:**
- `prd`: Product Requirements Document
- `projectName`: Optional project name
- `projectDescription`: Optional project description

### 3. `create_architecture`
Design system architecture and tech stack based on user stories.

**Parameters:**
- `userStories`: Array of user stories
- `projectName`: Project name
- `projectDescription`: Project description

### 4. `implement_feature`
Implement a specific feature with code generation.

**Parameters:**
- `feature`: Feature name/description
- `architecture`: System architecture
- `userStories`: Related user stories

### 5. `create_tests`
Create comprehensive test plans and test suites.

**Parameters:**
- `features`: Array of implemented features
- `architecture`: System architecture

### 6. `setup_deployment`
Set up deployment configuration and CI/CD pipelines.

**Parameters:**
- `projectName`: Project name
- `architecture`: System architecture
- `features`: Array of features

### 7. `review_code`
Perform comprehensive code review with AI analysis.

**Parameters:**
- `code`: Code to review
- `context`: Optional context information

### 8. `update_documentation`
Update project documentation.

**Parameters:**
- `projectContext`: Current project context
- `documentationType`: Type of documentation (readme, api, deployment, architecture)

### 9. `get_project_status`
Get current project status and task history.

### 10. `initialize_services`
Initialize LLM services and project environment.

**Parameters:**
- `llmConfig`: LLM provider configuration

## 🎯 MCP Prompts

### 1. `review-code`
AI-powered code review with comprehensive analysis.

### 2. `review-architecture`
Architecture review focusing on scalability, security, and best practices.

### 3. `analyze-requirements`
Requirements analysis with user story breakdown and technical recommendations.

## 📚 MCP Resources

### 1. `project-context://{projectId}`
Access current project context and state.

### 2. `task-history://{projectId}`
Access task execution history and status.

## 🛠️ Installation

### Prerequisites
- Node.js 18+
- npm or yarn
- Git

### Quick Start

1. **Clone the repository**
```bash
git clone <repository-url>
cd mcp-autonomous-dev-team
```

2. **Install dependencies**
```bash
npm install
```

3. **Build the project**
```bash
npm run build
```

4. **Install globally (optional)**
```bash
npm install -g .
```

## 🔧 Configuration

### LLM Provider Setup

The server supports multiple LLM providers. Configure your preferred provider:

#### OpenAI
```json
{
  "provider": "openai",
  "apiKey": "your-openai-api-key",
  "model": "gpt-4",
  "temperature": 0.7,
  "maxTokens": 4000
}
```

#### Anthropic
```json
{
  "provider": "anthropic",
  "apiKey": "your-anthropic-api-key",
  "model": "claude-3-sonnet-20240229",
  "temperature": 0.7,
  "maxTokens": 4000
}
```

#### OpenRouter
```json
{
  "provider": "openrouter",
  "apiKey": "your-openrouter-api-key",
  "model": "openai/gpt-4",
  "temperature": 0.7,
  "maxTokens": 4000
}
```

#### Gemini
```json
{
  "provider": "gemini",
  "apiKey": "your-google-api-key",
  "model": "gemini-1.5-pro",
  "temperature": 0.7,
  "maxTokens": 4000
}
```

#### Local Models
```json
{
  "provider": "local",
  "baseUrl": "http://localhost:11434/v1",
  "model": "llama2",
  "temperature": 0.7,
  "maxTokens": 4000
}
```

## 🚀 Usage

### Basic Usage

1. **Initialize services**
```bash
# Using the MCP tool
initialize_services({
  "llmConfig": {
    "provider": "openai",
    "apiKey": "your-api-key",
    "model": "gpt-4"
  }
})
```

2. **Execute a complete project**
```bash
# Using OpenAI
execute_project({
  "prd": "Create a task management application with user authentication, CRUD operations for tasks, and real-time updates.",
  "projectName": "TaskManager",
  "projectDescription": "A modern task management application",
  "llmConfig": {
    "provider": "openai",
    "apiKey": "your-api-key",
    "model": "gpt-4"
  }
})

# Using OpenRouter
execute_project({
  "prd": "Create a task management application with user authentication, CRUD operations for tasks, and real-time updates.",
  "projectName": "TaskManager",
  "projectDescription": "A modern task management application",
  "llmConfig": {
    "provider": "openrouter",
    "apiKey": "your-openrouter-api-key",
    "model": "openai/gpt-4"
  }
})

# Using Gemini
execute_project({
  "prd": "Create a task management application with user authentication, CRUD operations for tasks, and real-time updates.",
  "projectName": "TaskManager",
  "projectDescription": "A modern task management application",
  "llmConfig": {
    "provider": "gemini",
    "apiKey": "your-google-api-key",
    "model": "gemini-1.5-pro"
  }
})
```

### Step-by-Step Usage

1. **Analyze Requirements**
```bash
analyze_requirements({
  "prd": "Your PRD here...",
  "projectName": "MyProject"
})
```

2. **Create Architecture**
```bash
create_architecture({
  "userStories": [...],
  "projectName": "MyProject",
  "projectDescription": "Project description"
})
```

3. **Implement Features**
```bash
implement_feature({
  "feature": "User Authentication",
  "architecture": {...},
  "userStories": [...]
})
```

4. **Create Tests**
```bash
create_tests({
  "features": [...],
  "architecture": {...}
})
```

5. **Setup Deployment**
```bash
setup_deployment({
  "projectName": "MyProject",
  "architecture": {...},
  "features": [...]
})
```

## 📁 Project Structure

```
mcp-autonomous-dev-team/
├── src/
│   ├── agents/                 # Specialized agent implementations
│   │   ├── product-manager.ts  # Product Manager agent
│   │   ├── tech-lead.ts        # Tech Lead agent
│   │   ├── developer.ts        # Developer agent
│   │   ├── qa-engineer.ts      # QA Engineer agent
│   │   ├── devops.ts           # DevOps agent
│   │   └── orchestrator.ts     # Orchestrator agent
│   ├── services/               # Core services
│   │   ├── llm.ts             # LLM service
│   │   └── filesystem.ts      # File system service
│   ├── types.ts               # TypeScript type definitions
│   └── index.ts               # Main MCP server
├── dist/                      # Compiled JavaScript
├── package.json               # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
└── README.md                 # This file
```

## 🔄 Workflow

### Project Execution Phases

1. **Requirements Analysis** 📋
   - Product Manager analyzes PRD
   - Creates user stories with acceptance criteria
   - Validates requirements completeness

2. **Architecture Design** 🏗️
   - Tech Lead designs system architecture
   - Selects appropriate technology stack
   - Creates API contracts and database schema

3. **Development** 💻
   - Developer implements features
   - Generates clean, production-ready code
   - Includes proper error handling and validation

4. **Testing** 🧪
   - QA Engineer creates comprehensive test plans
   - Generates unit, integration, and e2e tests
   - Ensures quality and coverage

5. **Deployment** 🚀
   - DevOps sets up deployment configuration
   - Creates CI/CD pipelines
   - Configures monitoring and infrastructure

6. **Completion** ✅
   - Project documentation generated
   - Deployment artifacts created
   - Working prototype ready

## 🎯 Example Use Cases

### 1. Web Application Development
- E-commerce platforms
- Content management systems
- Social media applications
- Dashboard applications

### 2. API Development
- RESTful APIs
- GraphQL services
- Microservices architecture
- Backend services

### 3. Full-Stack Applications
- React + Node.js applications
- Vue + Python applications
- Angular + Go applications

## 🔒 Security Considerations

- API keys are handled securely
- No hardcoded credentials in generated code
- Security best practices in generated applications
- Input validation and sanitization
- Proper authentication and authorization

## 🧪 Testing

### Run Tests
```bash
npm test
```

### Test Coverage
```bash
npm run test:coverage
```

## 📈 Performance

- Optimized LLM interactions
- Efficient file system operations
- Parallel agent execution where possible
- Caching of intermediate results

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📚 Documentation

- [Project Summary](PROJECT_SUMMARY.md) - Complete project overview
- [LLM Providers Guide](LLM_PROVIDERS.md) - Detailed configuration for all supported AI providers
- [Examples](examples/) - Usage examples and demonstrations

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

For issues and questions:
1. Check the documentation
2. Search existing issues
3. Create a new issue with detailed information

## 🎉 Success Stories

This MCP server has been used to successfully generate:
- Task management applications
- E-commerce platforms
- API services
- Dashboard applications
- Content management systems

## 🔮 Future Enhancements

- Support for more LLM providers
- Enhanced code generation capabilities
- Integration with more deployment platforms
- Advanced project templates
- Real-time collaboration features
- Enhanced monitoring and analytics

---

**Built with ❤️ by the Autonomous Development Team**