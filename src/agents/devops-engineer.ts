import { BaseAgent } from './base-agent.js';
import { AgentTask, DeploymentConfig, CodeFile, DeploymentConfigSchema, CodeFileSchema } from '../types.js';
import { FileSystemService } from '../services/filesystem.js';

export class DevOpsEngineerAgent extends BaseAgent {
  private fs: FileSystemService;

  constructor(context: any) {
    super('devops_engineer', context);
    this.fs = new FileSystemService();
  }

  protected getRoleResponsibilities(): string {
    return `- Set up deployment configurations and infrastructure
- Create CI/CD pipelines and automation
- Configure monitoring and logging systems
- Ensure security and compliance
- Optimize performance and scalability
- Manage environment configurations
- Implement disaster recovery plans
- Create deployment documentation`;
  }

  async execute(task: AgentTask): Promise<any> {
    this.logTaskStart(task);

    try {
      switch (task.title.toLowerCase()) {
        case 'setup_deployment':
          return await this.setupDeployment(task);
        case 'create_cicd_pipeline':
          return await this.createCICDPipeline(task);
        case 'configure_monitoring':
          return await this.configureMonitoring(task);
        case 'setup_security':
          return await this.setupSecurity(task);
        case 'create_infrastructure':
          return await this.createInfrastructure(task);
        case 'configure_environments':
          return await this.configureEnvironments(task);
        case 'create_deployment_docs':
          return await this.createDeploymentDocs(task);
        default:
          throw new Error(`Unknown task: ${task.title}`);
      }
    } catch (error) {
      this.logTaskError(task, error as Error);
      throw error;
    }
  }

  private async setupDeployment(task: AgentTask): Promise<{ deployment_config: DeploymentConfig }> {
    const techStack = this.context.tech_stack;
    const deploymentType = task.result?.deployment_type || 'docker';
    const environment = task.result?.environment || 'development';
    const projectPath = task.result?.project_path || `${this.context.id}`;

    if (!techStack) {
      throw new Error('Technology stack must be defined before setting up deployment');
    }

    const prompt = `Set up deployment configuration for the following project:

Technology Stack:
${JSON.stringify(techStack, null, 2)}

Deployment Type: ${deploymentType}
Environment: ${environment}
Project Path: ${projectPath}

Create deployment configuration that includes:
1. Containerization setup (Docker/Kubernetes)
2. Environment-specific configurations
3. Resource requirements and limits
4. Health checks and monitoring
5. Security configurations
6. Scaling policies
7. Backup and recovery procedures
8. Deployment scripts and automation

Focus on:
- Production-ready deployment
- Security best practices
- Performance optimization
- Scalability and reliability
- Monitoring and observability
- Disaster recovery`;

    const deploymentConfig = await this.generateStructuredResponse<DeploymentConfig>(
      prompt,
      DeploymentConfigSchema,
      {
        type: 'docker',
        config_files: [
          {
            path: 'Dockerfile',
            content: 'FROM node:18-alpine\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci --only=production\nCOPY . .\nEXPOSE 3000\nCMD ["npm", "start"]',
            language: 'dockerfile',
            purpose: 'Container configuration for the application'
          }
        ],
        environment_variables: {
          NODE_ENV: 'production',
          PORT: '3000'
        },
        dependencies: ['docker', 'docker-compose']
      }
    );

    // Create the actual deployment files
    await this.createDeploymentFiles(deploymentConfig, projectPath);

    this.updateContext({ deployment_config: deploymentConfig });
    this.addDecision(
      'Deployment Setup Complete',
      `Deployment configuration created for ${deploymentType}`,
      'Deployment configuration enables automated and reliable deployments'
    );

    this.logTaskComplete(task, { deployment_config: deploymentConfig });
    return { deployment_config: deploymentConfig };
  }

  private async createCICDPipeline(task: AgentTask): Promise<{ cicd_config: any }> {
    const techStack = this.context.tech_stack;
    const deploymentConfig = this.context.deployment_config;
    const projectPath = task.result?.project_path || `${this.context.id}`;

    if (!techStack) {
      throw new Error('Technology stack must be defined before creating CI/CD pipeline');
    }

    const prompt = `Create a comprehensive CI/CD pipeline for the following project:

Technology Stack:
${JSON.stringify(techStack, null, 2)}

Deployment Configuration:
${JSON.stringify(deploymentConfig, null, 2)}

Project Path: ${projectPath}

Create CI/CD pipeline that includes:
1. Source code management integration
2. Automated testing (unit, integration, e2e)
3. Code quality checks (linting, security scanning)
4. Build and packaging process
5. Deployment automation
6. Environment promotion (dev -> staging -> prod)
7. Rollback procedures
8. Monitoring and alerting
9. Performance testing
10. Security scanning

Focus on:
- Automated quality gates
- Fast feedback loops
- Reliable deployments
- Security and compliance
- Performance optimization
- Disaster recovery`;

    const cicdConfig = await this.generateResponse(prompt);

    // Create CI/CD configuration files
    await this.createCICDConfigFiles(techStack, projectPath);

    this.addDecision(
      'CI/CD Pipeline Created',
      'Comprehensive CI/CD pipeline has been established',
      'CI/CD pipeline enables automated, reliable, and secure deployments'
    );

    this.logTaskComplete(task, { cicd_config: cicdConfig });
    return { cicd_config: cicdConfig };
  }

  private async configureMonitoring(task: AgentTask): Promise<{ monitoring_config: any }> {
    const techStack = this.context.tech_stack;
    const deploymentConfig = this.context.deployment_config;

    if (!techStack) {
      throw new Error('Technology stack must be defined before configuring monitoring');
    }

    const prompt = `Configure comprehensive monitoring and observability for the following project:

Technology Stack:
${JSON.stringify(techStack, null, 2)}

Deployment Configuration:
${JSON.stringify(deploymentConfig, null, 2)}

Create monitoring configuration that includes:
1. Application performance monitoring (APM)
2. Infrastructure monitoring
3. Log aggregation and analysis
4. Error tracking and alerting
5. Health checks and uptime monitoring
6. Metrics collection and visualization
7. Distributed tracing
8. Security monitoring
9. Cost monitoring and optimization
10. Custom dashboards and reports

Focus on:
- Real-time visibility
- Proactive alerting
- Performance optimization
- Security monitoring
- Cost management
- Troubleshooting capabilities`;

    const monitoringConfig = await this.generateResponse(prompt);

    this.addDecision(
      'Monitoring Configuration Complete',
      'Comprehensive monitoring and observability has been configured',
      'Monitoring enables proactive issue detection and performance optimization'
    );

    this.logTaskComplete(task, { monitoring_config: monitoringConfig });
    return { monitoring_config: monitoringConfig };
  }

  private async setupSecurity(task: AgentTask): Promise<{ security_config: any }> {
    const techStack = this.context.tech_stack;
    const deploymentConfig = this.context.deployment_config;

    if (!techStack) {
      throw new Error('Technology stack must be defined before setting up security');
    }

    const prompt = `Set up comprehensive security configuration for the following project:

Technology Stack:
${JSON.stringify(techStack, null, 2)}

Deployment Configuration:
${JSON.stringify(deploymentConfig, null, 2)}

Create security configuration that includes:
1. Network security and firewall rules
2. Access control and authentication
3. Data encryption (at rest and in transit)
4. Secrets management
5. Vulnerability scanning and patching
6. Security monitoring and alerting
7. Compliance and audit logging
8. Incident response procedures
9. Security testing and validation
10. Security documentation and training

Focus on:
- Defense in depth
- Zero trust architecture
- Compliance requirements
- Threat detection and response
- Security automation
- Regular security assessments`;

    const securityConfig = await this.generateResponse(prompt);

    this.addDecision(
      'Security Configuration Complete',
      'Comprehensive security measures have been implemented',
      'Security configuration protects against threats and ensures compliance'
    );

    this.logTaskComplete(task, { security_config: securityConfig });
    return { security_config: securityConfig };
  }

  private async createInfrastructure(task: AgentTask): Promise<{ infrastructure_config: any }> {
    const techStack = this.context.tech_stack;
    const deploymentConfig = this.context.deployment_config;

    if (!techStack) {
      throw new Error('Technology stack must be defined before creating infrastructure');
    }

    const prompt = `Create infrastructure as code configuration for the following project:

Technology Stack:
${JSON.stringify(techStack, null, 2)}

Deployment Configuration:
${JSON.stringify(deploymentConfig, null, 2)}

Create infrastructure configuration that includes:
1. Cloud provider setup and configuration
2. Networking and VPC configuration
3. Compute resources and auto-scaling
4. Database and storage setup
5. Load balancing and CDN configuration
6. Backup and disaster recovery
7. Resource tagging and organization
8. Cost optimization and budgeting
9. Compliance and governance
10. Infrastructure documentation

Focus on:
- Scalability and reliability
- Cost optimization
- Security and compliance
- Automation and reproducibility
- Monitoring and observability
- Disaster recovery`;

    const infrastructureConfig = await this.generateResponse(prompt);

    // Create infrastructure as code files
    await this.createInfrastructureFiles(techStack, infrastructureConfig);

    this.addDecision(
      'Infrastructure Configuration Complete',
      'Infrastructure as code has been created',
      'Infrastructure configuration enables reproducible and scalable deployments'
    );

    this.logTaskComplete(task, { infrastructure_config: infrastructureConfig });
    return { infrastructure_config: infrastructureConfig };
  }

  private async configureEnvironments(task: AgentTask): Promise<{ environment_configs: any }> {
    const techStack = this.context.tech_stack;
    const deploymentConfig = this.context.deployment_config;

    if (!techStack) {
      throw new Error('Technology stack must be defined before configuring environments');
    }

    const prompt = `Configure multiple environments for the following project:

Technology Stack:
${JSON.stringify(techStack, null, 2)}

Deployment Configuration:
${JSON.stringify(deploymentConfig, null, 2)}

Create environment configurations for:
1. Development environment
2. Staging/Testing environment
3. Production environment
4. Disaster recovery environment

Each environment should include:
- Environment-specific configurations
- Resource allocation and scaling
- Security and access controls
- Monitoring and alerting
- Backup and recovery procedures
- Deployment procedures
- Testing and validation processes

Focus on:
- Environment isolation
- Configuration management
- Security and compliance
- Performance optimization
- Cost management
- Operational efficiency`;

    const environmentConfigs = await this.generateResponse(prompt);

    // Create environment-specific configuration files
    await this.createEnvironmentConfigFiles(environmentConfigs);

    this.addDecision(
      'Environment Configuration Complete',
      'Multiple environments have been configured',
      'Environment configuration enables proper development and deployment workflows'
    );

    this.logTaskComplete(task, { environment_configs: environmentConfigs });
    return { environment_configs: environmentConfigs };
  }

  private async createDeploymentDocs(task: AgentTask): Promise<{ deployment_docs: any }> {
    const techStack = this.context.tech_stack;
    const deploymentConfig = this.context.deployment_config;

    if (!techStack) {
      throw new Error('Technology stack must be defined before creating deployment docs');
    }

    const prompt = `Create comprehensive deployment documentation for the following project:

Technology Stack:
${JSON.stringify(techStack, null, 2)}

Deployment Configuration:
${JSON.stringify(deploymentConfig, null, 2)}

Create deployment documentation that includes:
1. Deployment architecture overview
2. Prerequisites and requirements
3. Installation and setup instructions
4. Configuration management
5. Deployment procedures
6. Monitoring and troubleshooting
7. Security considerations
8. Backup and recovery procedures
9. Scaling and performance optimization
10. Maintenance and updates

Focus on:
- Clear and comprehensive instructions
- Troubleshooting guides
- Security best practices
- Performance optimization
- Operational procedures
- Emergency procedures`;

    const deploymentDocs = await this.generateResponse(prompt);

    // Create deployment documentation files
    await this.createDeploymentDocumentation(deploymentDocs);

    this.addDecision(
      'Deployment Documentation Complete',
      'Comprehensive deployment documentation has been created',
      'Deployment documentation enables successful operations and maintenance'
    );

    this.logTaskComplete(task, { deployment_docs: deploymentDocs });
    return { deployment_docs: deploymentDocs };
  }

  private async createDeploymentFiles(deploymentConfig: DeploymentConfig, projectPath: string): Promise<void> {
    for (const file of deploymentConfig.config_files) {
      const fullPath = `${projectPath}/${file.path}`;
      await this.fs.writeFile(fullPath, file.content);
      this.addArtifact(`Deployment File: ${file.path}`, file.language, fullPath);
    }
  }

  private async createCICDConfigFiles(techStack: any, projectPath: string): Promise<void> {
    // Create GitHub Actions workflow
    const githubActionsWorkflow = `name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Use Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    - run: npm ci
    - run: npm test
    - run: npm run lint

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Build Docker image
      run: docker build -t ${techStack.frontend.framework.toLowerCase()}-app .
    - name: Push to registry
      run: echo "Push to registry step"

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
    - name: Deploy to production
      run: echo "Deploy to production step"
`;

    await this.fs.writeFile(`${projectPath}/.github/workflows/ci-cd.yml`, githubActionsWorkflow);
    this.addArtifact('CI/CD Pipeline', 'yaml', `${projectPath}/.github/workflows/ci-cd.yml`);
  }

  private async createInfrastructureFiles(techStack: any, infrastructureConfig: any): Promise<void> {
    // Create Docker Compose file
    const dockerCompose = `version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    depends_on:
      - database
    restart: unless-stopped

  database:
    image: postgres:15
    environment:
      POSTGRES_DB: ${techStack.database.name}
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
`;

    await this.fs.writeFile(`${this.context.id}/docker-compose.yml`, dockerCompose);
    this.addArtifact('Docker Compose', 'yaml', `${this.context.id}/docker-compose.yml`);
  }

  private async createEnvironmentConfigFiles(environmentConfigs: any): Promise<void> {
    const docsPath = `${this.context.id}/docs/deployment`;
    await this.fs.ensureDirectory(docsPath);

    const envConfigDoc = `# Environment Configuration

**Project:** ${this.context.name}
**Date:** ${new Date().toISOString().split('T')[0]}

## Environment Configuration

${environmentConfigs}

## Environment Management

This document describes the configuration and management of different environments for the ${this.context.name} project.
`;

    await this.fs.writeFile(`${docsPath}/environment-configuration.md`, envConfigDoc);
    this.addArtifact('Environment Configuration Document', 'markdown', `${docsPath}/environment-configuration.md`);
  }

  private async createDeploymentDocumentation(deploymentDocs: any): Promise<void> {
    const docsPath = `${this.context.id}/docs/deployment`;
    await this.fs.ensureDirectory(docsPath);

    const deploymentDoc = `# Deployment Guide

**Project:** ${this.context.name}
**Date:** ${new Date().toISOString().split('T')[0]}

## Deployment Guide

${deploymentDocs}

## Deployment Procedures

This document provides comprehensive guidance for deploying and operating the ${this.context.name} application.
`;

    await this.fs.writeFile(`${docsPath}/deployment-guide.md`, deploymentDoc);
    this.addArtifact('Deployment Guide Document', 'markdown', `${docsPath}/deployment-guide.md`);
  }
}