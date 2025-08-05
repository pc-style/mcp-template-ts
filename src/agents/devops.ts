import { BaseAgent } from './base-agent.js';
import { AgentContext, AgentResponse, DeploymentConfig, GeneratedFile } from '../types/shared.js';
import { FileOperations } from '../utils/file-operations.js';
import { GitOperations } from '../utils/git-operations.js';

export class DevOps extends BaseAgent {
  constructor(context: AgentContext) {
    super(context, 'DevOps', 'Deployment Configuration and CI/CD Setup');
  }

  async execute(input: { platform?: 'docker' | 'kubernetes' | 'serverless' | 'traditional'; environment?: 'development' | 'staging' | 'production' }): Promise<AgentResponse> {
    this.log('Setting up deployment configuration and CI/CD pipelines...');

    try {
      const { architecture, implementations } = this.context.projectState;
      
      if (!architecture || !implementations.length) {
        return this.createResponse(false, 'No implementation available for deployment setup');
      }

      // Create deployment configuration prompt
      const deploymentPrompt = this.createDeploymentPrompt(architecture, implementations, input);
      const llmResponse = await this.callLLM(deploymentPrompt);
      
      const deploymentConfig = this.parseDeploymentResponse(llmResponse, input);
      
      // Write deployment files to the file system
      await this.writeDeploymentFiles(deploymentConfig);
      
      // Setup git repository if needed
      await this.setupGitRepository();
      
      // Update project state with deployment configuration
      this.updateProjectState({
        deployment: deploymentConfig,
        currentPhase: 'deployment'
      });

      this.log(`Deployment configuration completed for ${deploymentConfig.platform} platform`);

      return this.createResponse(
        true,
        'Deployment configuration completed successfully',
        {
          platform: deploymentConfig.platform,
          environment: deploymentConfig.environment,
          configFiles: deploymentConfig.configurations.length,
          cicdFiles: deploymentConfig.cicdPipeline.length
        },
        undefined,
        {
          deployment: deploymentConfig
        }
      );
    } catch (error) {
      this.log(`Error during deployment setup: ${error.message}`);
      return this.createResponse(
        false,
        `Deployment setup failed: ${error.message}`
      );
    }
  }

  private createDeploymentPrompt(architecture: any, implementations: any[], input: any): string {
    const techStack = architecture.techStack.map((ts: any) => `${ts.category}: ${ts.technology}`).join('\n');
    const dependencies = implementations.flatMap((impl: any) => impl.dependencies).filter((dep: string, index: number, arr: string[]) => arr.indexOf(dep) === index);

    return `
You are a DevOps Engineer setting up deployment configuration and CI/CD pipelines for the following system:

TECH STACK:
${techStack}

DEPENDENCIES:
${dependencies.join(', ')}

IMPLEMENTATIONS:
${implementations.map((impl: any) => `- ${impl.featureId}: ${impl.files.length} files`).join('\n')}

${input.platform ? `TARGET PLATFORM: ${input.platform}` : ''}
${input.environment ? `TARGET ENVIRONMENT: ${input.environment}` : ''}

Please create comprehensive deployment configuration in the following JSON format:
{
  "platform": "docker|kubernetes|serverless|traditional",
  "environment": "development|staging|production",
  "configurations": [
    {
      "path": "path/to/config.yml",
      "content": "# Complete configuration file content",
      "type": "config"
    }
  ],
  "cicdPipeline": [
    {
      "path": ".github/workflows/ci.yml",
      "content": "# Complete CI/CD pipeline configuration",
      "type": "config"
    }
  ]
}

Requirements:
1. Create Dockerfile for containerization
2. Create docker-compose.yml for local development
3. Create production deployment configuration
4. Setup CI/CD pipeline (GitHub Actions recommended)
5. Include environment variable management
6. Add health checks and monitoring
7. Setup database migrations
8. Include security configurations
9. Add logging and monitoring setup
10. Create deployment scripts

Focus on:
- Production-ready configurations
- Security best practices
- Scalability considerations
- Automated testing in CI/CD
- Environment-specific configurations
- Easy local development setup
- Proper secret management
- Database backup and recovery
- Load balancing if needed
- SSL/TLS configuration
`;
  }

  private parseDeploymentResponse(response: string, input: any): DeploymentConfig {
    try {
      const parsed = JSON.parse(response);
      
      return {
        platform: parsed.platform || input.platform || 'docker',
        configurations: this.parseConfigFiles(parsed.configurations || []),
        cicdPipeline: this.parseConfigFiles(parsed.cicdPipeline || []),
        environment: parsed.environment || input.environment || 'development'
      };
    } catch (error) {
      this.log(`Warning: Failed to parse deployment response, using fallback configuration`);
      return this.createFallbackDeploymentConfig(input);
    }
  }

  private parseConfigFiles(files: any[]): GeneratedFile[] {
    return files.map(file => ({
      path: file.path || 'config/default.yml',
      content: file.content || '# Generated configuration',
      type: 'config'
    }));
  }

  private async writeDeploymentFiles(deploymentConfig: DeploymentConfig): Promise<void> {
    const allFiles = [...deploymentConfig.configurations, ...deploymentConfig.cicdPipeline];
    await FileOperations.writeGeneratedFiles(allFiles, this.context.outputDirectory);
    this.log(`Wrote ${allFiles.length} deployment files to ${this.context.outputDirectory}`);
  }

  private async setupGitRepository(): Promise<void> {
    try {
      const gitOps = new GitOperations(this.context.outputDirectory);
      await gitOps.setupRepository('Generated Project');
      this.log('Git repository setup completed');
    } catch (error) {
      this.log(`Warning: Git repository setup failed: ${error.message}`);
    }
  }

  private createFallbackDeploymentConfig(input: any): DeploymentConfig {
    const dockerfileContent = `# Multi-stage Docker build for Node.js application
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src/ ./src/

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:3000/health || exit 1

# Start the application
CMD ["node", "dist/index.js"]`;

    const dockerComposeContent = `version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:password@db:5432/app_dev
      - JWT_SECRET=your-jwt-secret-here
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    volumes:
      - .:/app
      - /app/node_modules
    command: npm run dev

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: app_dev
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init-db.sql

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app

volumes:
  postgres_data:
  redis_data:`;

    const githubActionsContent = `name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

env:
  NODE_VERSION: '18'
  REGISTRY: ghcr.io
  IMAGE_NAME: \${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: \${{ env.NODE_VERSION }}
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run linting
      run: npm run lint

    - name: Run type checking
      run: npm run type-check

    - name: Run unit tests
      run: npm run test:unit
      env:
        NODE_ENV: test
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db

    - name: Run integration tests
      run: npm run test:integration
      env:
        NODE_ENV: test
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db

    - name: Run build
      run: npm run build

    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info

  security-scan:
    runs-on: ubuntu-latest
    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Run security audit
      run: npm audit --audit-level moderate

    - name: Run Trivy vulnerability scanner
      uses: aquasecurity/trivy-action@master
      with:
        scan-type: 'fs'
        format: 'sarif'
        output: 'trivy-results.sarif'

    - name: Upload Trivy scan results to GitHub Security tab
      uses: github/codeql-action/upload-sarif@v2
      with:
        sarif_file: 'trivy-results.sarif'

  build-and-push:
    needs: [test, security-scan]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    permissions:
      contents: read
      packages: write

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Setup Docker Buildx
      uses: docker/setup-buildx-action@v3

    - name: Log in to Container Registry
      uses: docker/login-action@v3
      with:
        registry: \${{ env.REGISTRY }}
        username: \${{ github.actor }}
        password: \${{ secrets.GITHUB_TOKEN }}

    - name: Extract metadata
      id: meta
      uses: docker/metadata-action@v5
      with:
        images: \${{ env.REGISTRY }}/\${{ env.IMAGE_NAME }}
        tags: |
          type=ref,event=branch
          type=ref,event=pr
          type=sha,prefix={{branch}}-
          type=raw,value=latest,enable={{is_default_branch}}

    - name: Build and push Docker image
      uses: docker/build-push-action@v5
      with:
        context: .
        platforms: linux/amd64,linux/arm64
        push: true
        tags: \${{ steps.meta.outputs.tags }}
        labels: \${{ steps.meta.outputs.labels }}
        cache-from: type=gha
        cache-to: type=gha,mode=max

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production

    steps:
    - name: Deploy to production
      run: |
        echo "Deploying to production environment"
        # Add your deployment commands here
        # Example: kubectl apply -f k8s/
        # Example: terraform apply
        # Example: ansible-playbook deploy.yml`;

    const nginxConfigContent = `events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:3000;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

    # Gzip compression
    gzip on;
    gzip_types
        text/plain
        text/css
        text/js
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;

    server {
        listen 80;
        server_name localhost;

        # Redirect HTTP to HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name localhost;

        # SSL Configuration
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;

        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";

        # API routes
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # Static files
        location / {
            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

        # Health check
        location /health {
            proxy_pass http://app;
            access_log off;
        }
    }
}`;

    const kubernetesDeploymentContent = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-deployment
  labels:
    app: app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: app
  template:
    metadata:
      labels:
        app: app
    spec:
      containers:
      - name: app
        image: ghcr.io/your-org/your-app:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: database-url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: jwt-secret
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: app-service
spec:
  selector:
    app: app
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
  type: ClusterIP

---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app-ingress
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/rate-limit: "100"
spec:
  tls:
  - hosts:
    - yourdomain.com
    secretName: app-tls
  rules:
  - host: yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: app-service
            port:
              number: 80`;

    return {
      platform: input.platform || 'docker',
      environment: input.environment || 'production',
      configurations: [
        {
          path: 'Dockerfile',
          content: dockerfileContent,
          type: 'config'
        },
        {
          path: 'docker-compose.yml',
          content: dockerComposeContent,
          type: 'config'
        },
        {
          path: 'nginx.conf',
          content: nginxConfigContent,
          type: 'config'
        },
        {
          path: 'k8s/deployment.yml',
          content: kubernetesDeploymentContent,
          type: 'config'
        }
      ],
      cicdPipeline: [
        {
          path: '.github/workflows/ci-cd.yml',
          content: githubActionsContent,
          type: 'config'
        }
      ]
    };
  }
}