import { LLMService } from '../services/llm.js';
import { Deployment, DeploymentSchema, Architecture, Feature, AgentRole } from '../types.js';

export class DevOpsAgent {
  private llm: LLMService;

  constructor(llm: LLMService) {
    this.llm = llm;
  }

  async setupDeployment(
    projectName: string,
    architecture: Architecture,
    features: Feature[]
  ): Promise<Deployment> {
    const systemPrompt = `You are an experienced DevOps Engineer setting up deployment configurations and CI/CD pipelines.

Key responsibilities:
1. Create Docker configurations and containerization
2. Set up CI/CD pipelines for automated deployment
3. Configure environment variables and secrets management
4. Set up monitoring and logging infrastructure
5. Implement infrastructure as code
6. Ensure security and compliance
7. Optimize for scalability and performance
8. Create disaster recovery and backup strategies

Guidelines:
- Use industry best practices for containerization
- Implement secure CI/CD pipelines
- Follow infrastructure as code principles
- Ensure proper environment separation
- Implement monitoring and alerting
- Consider cost optimization
- Plan for scalability and high availability
- Document deployment procedures`;

    const prompt = `Please create deployment configuration for the following project:

PROJECT: ${projectName}

ARCHITECTURE:
${JSON.stringify(architecture, null, 2)}

FEATURES:
${JSON.stringify(features, null, 2)}

Please create deployment configuration with:

1. DOCKER CONFIGURATION:
   - Dockerfile for containerization
   - docker-compose.yml for local development
   - Multi-stage builds for optimization
   - Security best practices

2. CI/CD PIPELINES:
   - GitHub Actions or GitLab CI configuration
   - Automated testing and deployment
   - Environment-specific deployments
   - Security scanning and compliance

3. ENVIRONMENT CONFIGURATION:
   - Production environment variables
   - Staging environment variables
   - Development environment variables
   - Secrets management

Focus on:
1. Security and compliance
2. Scalability and performance
3. Monitoring and observability
4. Cost optimization
5. Disaster recovery
6. Automation and efficiency

Respond with a JSON object matching the Deployment schema.`;

    try {
      return await this.llm.generateStructuredResponse<Deployment>(
        prompt,
        DeploymentSchema,
        systemPrompt,
        0.3
      );
    } catch (error) {
      console.error('DevOps Agent - Deployment setup failed:', error);
      throw new Error(`Failed to setup deployment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createDockerfile(architecture: Architecture, projectName: string): Promise<string> {
    const systemPrompt = `You are a DevOps Engineer creating optimized Docker configurations.

Your role is to:
1. Create multi-stage Docker builds
2. Optimize for security and performance
3. Use appropriate base images
4. Implement proper layer caching
5. Follow security best practices
6. Minimize image size`;

    const prompt = `Please create an optimized Dockerfile for the following project:

PROJECT: ${projectName}

ARCHITECTURE:
${JSON.stringify(architecture, null, 2)}

Please create:
1. Multi-stage Dockerfile
2. Security optimizations
3. Performance optimizations
4. Proper layer caching
5. Health checks
6. Non-root user setup
7. Environment-specific configurations

Backend: ${architecture.techStack.backend.join(', ')}
Database: ${architecture.techStack.database}

Generate a production-ready Dockerfile with security and performance best practices.`;

    try {
      return await this.llm.generateCode(prompt, 'dockerfile', systemPrompt);
    } catch (error) {
      console.error('DevOps Agent - Dockerfile creation failed:', error);
      throw new Error(`Failed to create Dockerfile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createDockerCompose(architecture: Architecture, projectName: string): Promise<string> {
    const systemPrompt = `You are a DevOps Engineer creating Docker Compose configurations for local development and testing.

Your role is to:
1. Set up development environment
2. Configure service dependencies
3. Set up networking and volumes
4. Configure environment variables
5. Include monitoring and logging services
6. Ensure easy local development`;

    const prompt = `Please create a Docker Compose configuration for the following project:

PROJECT: ${projectName}

ARCHITECTURE:
${JSON.stringify(architecture, null, 2)}

Please create:
1. Application service configuration
2. Database service configuration
3. Development environment setup
4. Volume mappings
5. Network configuration
6. Environment variables
7. Health checks
8. Monitoring services (if applicable)

Backend: ${architecture.techStack.backend.join(', ')}
Database: ${architecture.techStack.database}

Generate a comprehensive Docker Compose configuration for local development.`;

    try {
      return await this.llm.generateCode(prompt, 'yaml', systemPrompt);
    } catch (error) {
      console.error('DevOps Agent - Docker Compose creation failed:', error);
      throw new Error(`Failed to create Docker Compose: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createGitHubActions(architecture: Architecture, projectName: string): Promise<string> {
    const systemPrompt = `You are a DevOps Engineer creating GitHub Actions CI/CD pipelines.

Your role is to:
1. Set up automated testing and deployment
2. Configure environment-specific deployments
3. Implement security scanning
4. Add code quality checks
5. Set up automated releases
6. Configure secrets management`;

    const prompt = `Please create GitHub Actions CI/CD pipeline for the following project:

PROJECT: ${projectName}

ARCHITECTURE:
${JSON.stringify(architecture, null, 2)}

Please create:
1. Pull request workflow (testing)
2. Main branch workflow (deployment)
3. Release workflow
4. Security scanning
5. Code quality checks
6. Automated testing
7. Environment deployments
8. Secrets management

Backend: ${architecture.techStack.backend.join(', ')}
Database: ${architecture.techStack.database}

Generate a comprehensive GitHub Actions workflow with security and quality gates.`;

    try {
      return await this.llm.generateCode(prompt, 'yaml', systemPrompt);
    } catch (error) {
      console.error('DevOps Agent - GitHub Actions creation failed:', error);
      throw new Error(`Failed to create GitHub Actions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createKubernetesManifests(architecture: Architecture, projectName: string): Promise<string[]> {
    const systemPrompt = `You are a DevOps Engineer creating Kubernetes manifests for production deployment.

Your role is to:
1. Create deployment manifests
2. Configure services and ingress
3. Set up persistent volumes
4. Configure secrets and configmaps
5. Implement health checks
6. Set up resource limits
7. Configure horizontal pod autoscaling`;

    const prompt = `Please create Kubernetes manifests for the following project:

PROJECT: ${projectName}

ARCHITECTURE:
${JSON.stringify(architecture, null, 2)}

Please create:
1. Deployment manifest
2. Service manifest
3. Ingress manifest
4. ConfigMap manifest
5. Secret manifest
6. PersistentVolumeClaim (if needed)
7. HorizontalPodAutoscaler
8. NetworkPolicy

Backend: ${architecture.techStack.backend.join(', ')}
Database: ${architecture.techStack.database}

Generate production-ready Kubernetes manifests with proper resource management and security.`;

    try {
      const manifests = await this.llm.generateCode(prompt, 'yaml', systemPrompt);
      return [manifests];
    } catch (error) {
      console.error('DevOps Agent - Kubernetes manifests creation failed:', error);
      return [];
    }
  }

  async createTerraformConfig(architecture: Architecture, projectName: string): Promise<string> {
    const systemPrompt = `You are a DevOps Engineer creating Terraform infrastructure as code.

Your role is to:
1. Define infrastructure resources
2. Configure networking and security
3. Set up monitoring and logging
4. Implement proper state management
5. Configure backup and disaster recovery
6. Follow security best practices`;

    const prompt = `Please create Terraform configuration for the following project:

PROJECT: ${projectName}

ARCHITECTURE:
${JSON.stringify(architecture, null, 2)}

Please create:
1. Provider configuration
2. VPC and networking
3. Compute resources
4. Database resources
5. Load balancer configuration
6. Security groups and IAM
7. Monitoring and logging
8. Backup and disaster recovery

Backend: ${architecture.techStack.backend.join(', ')}
Database: ${architecture.techStack.database}

Generate production-ready Terraform configuration with security and scalability considerations.`;

    try {
      return await this.llm.generateCode(prompt, 'hcl', systemPrompt);
    } catch (error) {
      console.error('DevOps Agent - Terraform configuration creation failed:', error);
      throw new Error(`Failed to create Terraform configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createMonitoringConfig(architecture: Architecture, projectName: string): Promise<string> {
    const systemPrompt = `You are a DevOps Engineer setting up monitoring and observability infrastructure.

Your role is to:
1. Configure application monitoring
2. Set up infrastructure monitoring
3. Configure logging and tracing
4. Set up alerting and notifications
5. Implement dashboards and metrics
6. Configure health checks`;

    const prompt = `Please create monitoring configuration for the following project:

PROJECT: ${projectName}

ARCHITECTURE:
${JSON.stringify(architecture, null, 2)}

Please create:
1. Prometheus configuration
2. Grafana dashboards
3. Alerting rules
4. Log aggregation setup
5. Application metrics
6. Infrastructure monitoring
7. Health check endpoints
8. Performance monitoring

Backend: ${architecture.techStack.backend.join(', ')}
Database: ${architecture.techStack.database}

Generate comprehensive monitoring configuration for production observability.`;

    try {
      return await this.llm.generateCode(prompt, 'yaml', systemPrompt);
    } catch (error) {
      console.error('DevOps Agent - Monitoring configuration creation failed:', error);
      throw new Error(`Failed to create monitoring configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createSecurityConfig(architecture: Architecture, projectName: string): Promise<string> {
    const systemPrompt = `You are a DevOps Engineer implementing security configurations and best practices.

Your role is to:
1. Configure network security
2. Implement access controls
3. Set up secrets management
4. Configure security scanning
5. Implement compliance checks
6. Set up audit logging`;

    const prompt = `Please create security configuration for the following project:

PROJECT: ${projectName}

ARCHITECTURE:
${JSON.stringify(architecture, null, 2)}

Please create:
1. Network security policies
2. Access control lists
3. Secrets management
4. Security scanning configuration
5. Compliance policies
6. Audit logging
7. Encryption configuration
8. Security monitoring

Backend: ${architecture.techStack.backend.join(', ')}
Database: ${architecture.techStack.database}

Generate comprehensive security configuration following industry best practices.`;

    try {
      return await this.llm.generateCode(prompt, 'yaml', systemPrompt);
    } catch (error) {
      console.error('DevOps Agent - Security configuration creation failed:', error);
      throw new Error(`Failed to create security configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async validateDeployment(deployment: Deployment): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = [];

    // Validate Docker configuration
    if (!deployment.docker.dockerfile) {
      issues.push('Dockerfile is missing');
    }

    // Validate CI configuration
    if (!deployment.ci.githubActions && !deployment.ci.gitlabCI) {
      issues.push('No CI configuration provided');
    }

    // Validate environment configuration
    if (!deployment.environment.production) {
      issues.push('Production environment configuration is missing');
    }

    // Check for security issues
    const securityIssues = this.checkSecurityIssues(deployment);
    issues.push(...securityIssues);

    return {
      valid: issues.length === 0,
      issues
    };
  }

  private checkSecurityIssues(deployment: Deployment): string[] {
    const issues: string[] = [];

    // Check for common security issues
    if (deployment.docker.dockerfile && deployment.docker.dockerfile.includes('root')) {
      issues.push('Dockerfile should not run as root user');
    }

    if (deployment.docker.dockerfile && !deployment.docker.dockerfile.includes('HEALTHCHECK')) {
      issues.push('Dockerfile should include health checks');
    }

    if (deployment.ci.githubActions && !deployment.ci.githubActions.includes('security')) {
      issues.push('CI pipeline should include security scanning');
    }

    return issues;
  }

  async createDeploymentDocumentation(deployment: Deployment, projectName: string): Promise<string> {
    const systemPrompt = `You are a DevOps Engineer creating comprehensive deployment documentation.

Your role is to:
1. Document deployment procedures
2. Explain infrastructure setup
3. Provide troubleshooting guides
4. Document security considerations
5. Explain monitoring and alerting
6. Provide disaster recovery procedures`;

    const prompt = `Please create deployment documentation for the following project:

PROJECT: ${projectName}

DEPLOYMENT:
${JSON.stringify(deployment, null, 2)}

Please create documentation covering:
1. Infrastructure Overview
2. Deployment Procedures
3. Environment Configuration
4. Security Considerations
5. Monitoring and Alerting
6. Troubleshooting Guide
7. Disaster Recovery
8. Scaling Procedures
9. Backup and Restore
10. Maintenance Procedures

Format the documentation in Markdown with clear sections and examples.`;

    try {
      const response = await this.llm.generateResponse(prompt, systemPrompt, 0.3);
      return response.content;
    } catch (error) {
      console.error('DevOps Agent - Deployment documentation creation failed:', error);
      throw new Error(`Failed to create deployment documentation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}