import fs from 'fs-extra';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ProjectContext, Feature, Architecture } from '../types.js';

export class FileSystemService {
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  async initializeProject(projectName: string): Promise<string> {
    const projectPath = path.join(this.projectRoot, projectName);
    
    // Create project directory
    await fs.ensureDir(projectPath);
    
    // Create standard project structure
    const directories = [
      'src',
      'tests',
      'docs',
      'config',
      'public',
      'scripts',
      'migrations'
    ];

    for (const dir of directories) {
      await fs.ensureDir(path.join(projectPath, dir));
    }

    return projectPath;
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    const fullPath = path.join(this.projectRoot, filePath);
    await fs.ensureDir(path.dirname(fullPath));
    await fs.writeFile(fullPath, content, 'utf8');
  }

  async readFile(filePath: string): Promise<string> {
    const fullPath = path.join(this.projectRoot, filePath);
    return await fs.readFile(fullPath, 'utf8');
  }

  async fileExists(filePath: string): Promise<boolean> {
    const fullPath = path.join(this.projectRoot, filePath);
    return await fs.pathExists(fullPath);
  }

  async createDirectory(dirPath: string): Promise<void> {
    const fullPath = path.join(this.projectRoot, dirPath);
    await fs.ensureDir(fullPath);
  }

  async listFiles(dirPath: string, recursive: boolean = false): Promise<string[]> {
    const fullPath = path.join(this.projectRoot, dirPath);
    
    if (!await fs.pathExists(fullPath)) {
      return [];
    }

    if (recursive) {
      const files: string[] = [];
      const walk = async (currentPath: string) => {
        const items = await fs.readdir(currentPath);
        for (const item of items) {
          const itemPath = path.join(currentPath, item);
          const relativePath = path.relative(fullPath, itemPath);
          const stat = await fs.stat(itemPath);
          
          if (stat.isDirectory()) {
            await walk(itemPath);
          } else {
            files.push(relativePath);
          }
        }
      };
      
      await walk(fullPath);
      return files;
    } else {
      const items = await fs.readdir(fullPath);
      const files: string[] = [];
      
      for (const item of items) {
        const itemPath = path.join(fullPath, item);
        const stat = await fs.stat(itemPath);
        if (stat.isFile()) {
          files.push(item);
        }
      }
      
      return files;
    }
  }

  async saveProjectContext(context: ProjectContext): Promise<void> {
    const contextPath = path.join(this.projectRoot, 'config', 'project-context.json');
    await fs.writeJson(contextPath, context, { spaces: 2 });
  }

  async loadProjectContext(): Promise<ProjectContext | null> {
    const contextPath = path.join(this.projectRoot, 'config', 'project-context.json');
    
    if (await fs.pathExists(contextPath)) {
      return await fs.readJson(contextPath);
    }
    
    return null;
  }

  async implementFeature(feature: Feature): Promise<void> {
    for (const file of feature.files) {
      await this.writeFile(file.path, file.content);
    }
  }

  async createPackageJson(projectName: string, architecture: Architecture): Promise<void> {
    const packageJson = {
      name: projectName.toLowerCase().replace(/\s+/g, '-'),
      version: '1.0.0',
      description: `Auto-generated project: ${projectName}`,
      main: 'src/index.js',
      scripts: {
        start: 'node src/index.js',
        dev: 'nodemon src/index.js',
        test: 'jest',
        build: 'npm run build:frontend && npm run build:backend',
        'build:frontend': 'cd frontend && npm run build',
        'build:backend': 'echo "Backend build completed"',
        lint: 'eslint src/**/*.js',
        'lint:fix': 'eslint src/**/*.js --fix'
      },
      dependencies: this.generateDependencies(architecture),
      devDependencies: this.generateDevDependencies(architecture),
      keywords: ['auto-generated', 'mcp', 'autonomous-development'],
      author: 'Autonomous Development Team',
      license: 'MIT'
    };

    await this.writeFile('package.json', JSON.stringify(packageJson, null, 2));
  }

  private generateDependencies(architecture: Architecture): Record<string, string> {
    const dependencies: Record<string, string> = {};

    // Backend dependencies
    if (architecture.techStack.backend.includes('express')) {
      dependencies.express = '^4.18.2';
      dependencies.cors = '^2.8.5';
      dependencies.helmet = '^7.1.0';
    }

    if (architecture.techStack.backend.includes('fastify')) {
      dependencies.fastify = '^4.24.3';
    }

    if (architecture.techStack.database === 'postgresql') {
      dependencies.pg = '^8.11.3';
      dependencies['pg-pool'] = '^3.6.1';
    }

    if (architecture.techStack.database === 'mongodb') {
      dependencies.mongodb = '^6.3.0';
      dependencies.mongoose = '^8.0.3';
    }

    if (architecture.techStack.database === 'sqlite') {
      dependencies.sqlite3 = '^5.1.6';
    }

    // Common dependencies
    dependencies.dotenv = '^16.3.1';
    dependencies.zod = '^3.22.4';
    dependencies.uuid = '^9.0.1';

    return dependencies;
  }

  private generateDevDependencies(architecture: Architecture): Record<string, string> {
    const devDependencies: Record<string, string> = {
      nodemon: '^3.0.2',
      jest: '^29.7.0',
      eslint: '^8.55.0',
      '@types/node': '^20.10.5'
    };

    if (architecture.techStack.backend.includes('typescript')) {
      devDependencies.typescript = '^5.3.3';
      devDependencies['@types/express'] = '^4.17.21';
      devDependencies['ts-node'] = '^10.9.2';
    }

    return devDependencies;
  }

  async createDockerfile(architecture: Architecture): Promise<void> {
    const dockerfile = `FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]`;

    await this.writeFile('Dockerfile', dockerfile);
  }

  async createDockerCompose(architecture: Architecture): Promise<void> {
    let dockerCompose = `version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production`;

    if (architecture.techStack.database === 'postgresql') {
      dockerCompose += `
    depends_on:
      - postgres

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: app
      POSTGRES_USER: app
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"`;
    }

    if (architecture.techStack.database === 'mongodb') {
      dockerCompose += `
    depends_on:
      - mongodb

  mongodb:
    image: mongo:7
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password
    volumes:
      - mongodb_data:/data/db
    ports:
      - "27017:27017"`;
    }

    dockerCompose += `

volumes:`;

    if (architecture.techStack.database === 'postgresql') {
      dockerCompose += `
  postgres_data:`;
    }

    if (architecture.techStack.database === 'mongodb') {
      dockerCompose += `
  mongodb_data:`;
    }

    await this.writeFile('docker-compose.yml', dockerCompose);
  }

  async createGitignore(): Promise<void> {
    const gitignore = `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Build outputs
dist/
build/
*.tsbuildinfo

# Logs
logs
*.log

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# nyc test coverage
.nyc_output

# Dependency directories
jspm_packages/

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Microbundle cache
.rpt2_cache/
.rts2_cache_cjs/
.rts2_cache_es/
.rts2_cache_umd/

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# Next.js build output
.next

# Nuxt.js build / generate output
.nuxt
dist

# Gatsby files
.cache/
public

# Storybook build outputs
.out
.storybook-out

# Temporary folders
tmp/
temp/

# Editor directories and files
.vscode/
.idea/
*.swp
*.swo
*~

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Database files
*.db
*.sqlite
*.sqlite3

# Docker
.dockerignore`;

    await this.writeFile('.gitignore', gitignore);
  }

  async createREADME(projectName: string, context: ProjectContext): Promise<void> {
    const readme = `# ${projectName}

Auto-generated by Autonomous Development Team MCP Server.

## Description

${context.description}

## Features

${context.userStories.map((story: any) => `- ${story.title}`).join('\n')}

## Tech Stack

${context.architecture ? `
- **Frontend**: ${context.architecture.techStack.frontend.join(', ')}
- **Backend**: ${context.architecture.techStack.backend.join(', ')}
- **Database**: ${context.architecture.techStack.database}
- **Deployment**: ${context.architecture.techStack.deployment.join(', ')}
` : 'Architecture not yet defined'}

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
${context.architecture?.techStack.database === 'postgresql' ? '- PostgreSQL' : ''}
${context.architecture?.techStack.database === 'mongodb' ? '- MongoDB' : ''}

### Installation

1. Clone the repository
\`\`\`bash
git clone <repository-url>
cd ${projectName.toLowerCase().replace(/\s+/g, '-')}
\`\`\`

2. Install dependencies
\`\`\`bash
npm install
\`\`\`

3. Set up environment variables
\`\`\`bash
cp .env.example .env
# Edit .env with your configuration
\`\`\`

4. Start the development server
\`\`\`bash
npm run dev
\`\`\`

## Testing

\`\`\`bash
npm test
\`\`\`

## Building for Production

\`\`\`bash
npm run build
\`\`\`

## Deployment

### Using Docker

\`\`\`bash
docker-compose up -d
\`\`\`

### Manual Deployment

1. Build the application
\`\`\`bash
npm run build
\`\`\`

2. Start the production server
\`\`\`bash
npm start
\`\`\`

## API Documentation

${context.architecture?.apiSpecs ? context.architecture.apiSpecs.map((api: any) => 
  `### ${api.method.toUpperCase()} ${api.endpoint}
${api.description}
`).join('\n') : 'API documentation not yet available'}

## Project Structure

\`\`\`
${context.architecture?.projectStructure ? context.architecture.projectStructure.join('\n') : 'Project structure not yet defined'}
\`\`\`

## Contributing

This project was auto-generated by the Autonomous Development Team MCP Server.

## License

MIT License - see LICENSE file for details.
`;

    await this.writeFile('README.md', readme);
  }

  async createEnvironmentFile(architecture: Architecture): Promise<void> {
    let envContent = `# Application Configuration
NODE_ENV=development
PORT=3000

# Database Configuration
`;

    if (architecture.techStack.database === 'postgresql') {
      envContent += `DATABASE_URL=postgresql://app:password@localhost:5432/app
`;
    } else if (architecture.techStack.database === 'mongodb') {
      envContent += `MONGODB_URI=mongodb://admin:password@localhost:27017/app?authSource=admin
`;
    } else if (architecture.techStack.database === 'sqlite') {
      envContent += `DATABASE_URL=./data/app.db
`;
    }

    envContent += `
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h

# API Configuration
API_VERSION=v1
CORS_ORIGIN=http://localhost:3000

# Logging
LOG_LEVEL=info
`;

    await this.writeFile('.env.example', envContent);
  }
}