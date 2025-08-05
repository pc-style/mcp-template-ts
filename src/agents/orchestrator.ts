import { LLMService } from '../services/llm.js';
import { FileSystemService } from '../services/filesystem.js';
import { ProductManagerAgent } from './product-manager.js';
import { TechLeadAgent } from './tech-lead.js';
import { DeveloperAgent } from './developer.js';
import { QAEngineerAgent } from './qa-engineer.js';
import { DevOpsAgent } from './devops.js';
import {
  ProjectContext,
  ProjectPhase,
  AgentRole,
  UserStory,
  Architecture,
  Feature,
  TestPlan,
  Deployment,
  AgentTask,
  LLMConfig
} from '../types.js';
import { v4 as uuidv4 } from 'uuid';

export class OrchestratorAgent {
  private llm: LLMService;
  private fileSystem: FileSystemService;
  private productManager: ProductManagerAgent;
  private techLead: TechLeadAgent;
  private developer: DeveloperAgent;
  private qaEngineer: QAEngineerAgent;
  private devOps: DevOpsAgent;
  private projectContext: ProjectContext | null = null;
  private tasks: AgentTask[] = [];

  constructor(
    llm: LLMService,
    fileSystem: FileSystemService,
    llmConfig: LLMConfig
  ) {
    this.llm = llm;
    this.fileSystem = fileSystem;
    this.productManager = new ProductManagerAgent(llm);
    this.techLead = new TechLeadAgent(llm);
    this.developer = new DeveloperAgent(llm);
    this.qaEngineer = new QAEngineerAgent(llm);
    this.devOps = new DevOpsAgent(llm);
  }

  async executeProject(
    prd: string,
    projectName: string,
    projectDescription: string
  ): Promise<ProjectContext> {
    console.log(`🚀 Starting project: ${projectName}`);
    
    // Initialize project context
    this.projectContext = {
      id: uuidv4(),
      name: projectName,
      description: projectDescription,
      phase: ProjectPhase.REQUIREMENTS_ANALYSIS,
      userStories: [],
      architecture: undefined,
      features: [],
      testPlan: undefined,
      deployment: undefined,
      decisions: [],
      artifacts: []
    };

    try {
      // Phase 1: Requirements Analysis
      await this.executeRequirementsAnalysis(prd, projectName, projectDescription);
      
      // Phase 2: Architecture Design
      await this.executeArchitectureDesign();
      
      // Phase 3: Development
      await this.executeDevelopment();
      
      // Phase 4: Testing
      await this.executeTesting();
      
      // Phase 5: Deployment
      await this.executeDeployment();
      
      // Phase 6: Complete
      this.projectContext.phase = ProjectPhase.COMPLETE;
      await this.finalizeProject();
      
      console.log(`✅ Project completed successfully: ${projectName}`);
      return this.projectContext;
      
    } catch (error) {
      console.error(`❌ Project execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  private async executeRequirementsAnalysis(
    prd: string,
    projectName: string,
    projectDescription: string
  ): Promise<void> {
    console.log('📋 Phase 1: Requirements Analysis');
    
    const taskId = uuidv4();
    const task: AgentTask = {
      id: taskId,
      agentRole: AgentRole.PRODUCT_MANAGER,
      task: 'Analyze PRD and create user stories',
      input: { prd, projectName, projectDescription },
      status: 'in_progress',
      timestamp: new Date().toISOString()
    };
    this.tasks.push(task);

    try {
      // Product Manager analyzes requirements
      const userStories = await this.productManager.analyzeRequirements(prd, projectName, projectDescription);
      
      // Validate user stories
      const validation = await this.productManager.validateUserStories(userStories);
      if (!validation.valid) {
        console.warn('⚠️ User story validation issues:', validation.issues);
      }

      // Update project context
      this.projectContext!.userStories = userStories;
      this.projectContext!.phase = ProjectPhase.ARCHITECTURE_DESIGN;
      
      // Record decision
      this.projectContext!.decisions.push({
        id: uuidv4(),
        decision: 'User stories created from PRD analysis',
        rationale: `Created ${userStories.length} user stories covering all requirements`,
        timestamp: new Date().toISOString()
      });

      // Save project context
      await this.fileSystem.saveProjectContext(this.projectContext!);
      
      task.status = 'completed';
      task.output = { userStories };
      task.duration = Date.now() - new Date(task.timestamp).getTime();
      
      console.log(`✅ Requirements Analysis completed: ${userStories.length} user stories created`);
      
    } catch (error) {
      task.status = 'failed';
      task.output = { error: error instanceof Error ? error.message : 'Unknown error' };
      throw error;
    }
  }

  private async executeArchitectureDesign(): Promise<void> {
    console.log('🏗️ Phase 2: Architecture Design');
    
    const taskId = uuidv4();
    const task: AgentTask = {
      id: taskId,
      agentRole: AgentRole.TECH_LEAD,
      task: 'Design system architecture and tech stack',
      input: { userStories: this.projectContext!.userStories, projectName: this.projectContext!.name },
      status: 'in_progress',
      timestamp: new Date().toISOString()
    };
    this.tasks.push(task);

    try {
      // Tech Lead creates architecture
      const architecture = await this.techLead.createArchitecture(
        this.projectContext!.userStories,
        this.projectContext!.name,
        this.projectContext!.description
      );

      // Enhance with API contracts
      const enhancedArchitecture = await this.techLead.createAPIContracts(architecture);
      
      // Design database schema
      const finalArchitecture = await this.techLead.designDatabaseSchema(
        enhancedArchitecture,
        this.projectContext!.userStories
      );

      // Validate architecture
      const validation = await this.techLead.validateArchitecture(finalArchitecture);
      if (!validation.valid) {
        console.warn('⚠️ Architecture validation issues:', validation.issues);
      }

      // Update project context
      this.projectContext!.architecture = finalArchitecture;
      this.projectContext!.phase = ProjectPhase.DEVELOPMENT;
      
      // Record decision
      this.projectContext!.decisions.push({
        id: uuidv4(),
        decision: 'System architecture designed',
        rationale: `Selected tech stack: ${finalArchitecture.techStack.backend.join(', ')} backend, ${finalArchitecture.techStack.frontend.join(', ')} frontend, ${finalArchitecture.techStack.database} database`,
        timestamp: new Date().toISOString()
      });

      // Save project context
      await this.fileSystem.saveProjectContext(this.projectContext!);
      
      task.status = 'completed';
      task.output = { architecture: finalArchitecture };
      task.duration = Date.now() - new Date(task.timestamp).getTime();
      
      console.log('✅ Architecture Design completed');
      
    } catch (error) {
      task.status = 'failed';
      task.output = { error: error instanceof Error ? error.message : 'Unknown error' };
      throw error;
    }
  }

  private async executeDevelopment(): Promise<void> {
    console.log('💻 Phase 3: Development');
    
    const features: Feature[] = [];
    
    // Group user stories into features
    const featureGroups = await this.groupUserStoriesIntoFeatures();
    
    for (const [featureName, userStories] of Object.entries(featureGroups)) {
      const taskId = uuidv4();
      const task: AgentTask = {
        id: taskId,
        agentRole: AgentRole.DEVELOPER,
        task: `Implement feature: ${featureName}`,
        input: { featureName, userStories, architecture: this.projectContext!.architecture },
        status: 'in_progress',
        timestamp: new Date().toISOString()
      };
      this.tasks.push(task);

      try {
        // Developer implements feature
        const feature = await this.developer.implementFeature(
          featureName,
          this.projectContext!.architecture!,
          userStories
        );

        // Generate tests for the feature
        const featureWithTests = await this.developer.generateTests(feature, this.projectContext!.architecture!);

        // Validate feature
        const validation = await this.developer.validateFeature(featureWithTests);
        if (!validation.valid) {
          console.warn(`⚠️ Feature validation issues for ${featureName}:`, validation.issues);
        }

        features.push(featureWithTests);
        
        // Implement feature files
        await this.fileSystem.implementFeature(featureWithTests);
        
        task.status = 'completed';
        task.output = { feature: featureWithTests };
        task.duration = Date.now() - new Date(task.timestamp).getTime();
        
        console.log(`✅ Feature implemented: ${featureName}`);
        
      } catch (error) {
        task.status = 'failed';
        task.output = { error: error instanceof Error ? error.message : 'Unknown error' };
        console.error(`❌ Feature implementation failed: ${featureName}`, error);
      }
    }

    // Update project context
    this.projectContext!.features = features;
    this.projectContext!.phase = ProjectPhase.TESTING;
    
    // Record decision
    this.projectContext!.decisions.push({
      id: uuidv4(),
      decision: 'Features implemented',
      rationale: `Implemented ${features.length} features covering all user stories`,
      timestamp: new Date().toISOString()
    });

    // Save project context
    await this.fileSystem.saveProjectContext(this.projectContext!);
    
    console.log('✅ Development completed');
  }

  private async executeTesting(): Promise<void> {
    console.log('🧪 Phase 4: Testing');
    
    const taskId = uuidv4();
    const task: AgentTask = {
      id: taskId,
      agentRole: AgentRole.QA_ENGINEER,
      task: 'Create comprehensive test plan and test suites',
      input: { features: this.projectContext!.features, architecture: this.projectContext!.architecture },
      status: 'in_progress',
      timestamp: new Date().toISOString()
    };
    this.tasks.push(task);

    try {
      // QA Engineer creates test plan
      const testPlan = await this.qaEngineer.createTestPlan(
        this.projectContext!.features,
        this.projectContext!.architecture!
      );

      // Generate additional test suites
      const unitTests = await this.qaEngineer.generateUnitTests(
        this.projectContext!.features[0], // Example for first feature
        this.projectContext!.architecture!
      );
      
      const integrationTests = await this.qaEngineer.generateIntegrationTests(
        this.projectContext!.features,
        this.projectContext!.architecture!
      );
      
      const e2eTests = await this.qaEngineer.generateE2ETests(
        this.projectContext!.features,
        this.projectContext!.architecture!
      );

      // Validate test plan
      const validation = await this.qaEngineer.validateTestPlan(testPlan);
      if (!validation.valid) {
        console.warn('⚠️ Test plan validation issues:', validation.issues);
      }

      // Update project context
      this.projectContext!.testPlan = testPlan;
      this.projectContext!.phase = ProjectPhase.DEPLOYMENT;
      
      // Record decision
      this.projectContext!.decisions.push({
        id: uuidv4(),
        decision: 'Test plan created',
        rationale: `Created comprehensive test plan with ${testPlan.unitTests.length} unit test files, ${testPlan.integrationTests.length} integration tests, and ${testPlan.e2eTests.length} e2e tests`,
        timestamp: new Date().toISOString()
      });

      // Save project context
      await this.fileSystem.saveProjectContext(this.projectContext!);
      
      task.status = 'completed';
      task.output = { testPlan, unitTests, integrationTests, e2eTests };
      task.duration = Date.now() - new Date(task.timestamp).getTime();
      
      console.log('✅ Testing completed');
      
    } catch (error) {
      task.status = 'failed';
      task.output = { error: error instanceof Error ? error.message : 'Unknown error' };
      throw error;
    }
  }

  private async executeDeployment(): Promise<void> {
    console.log('🚀 Phase 5: Deployment');
    
    const taskId = uuidv4();
    const task: AgentTask = {
      id: taskId,
      agentRole: AgentRole.DEVOPS,
      task: 'Setup deployment configuration and CI/CD pipelines',
      input: { projectName: this.projectContext!.name, architecture: this.projectContext!.architecture, features: this.projectContext!.features },
      status: 'in_progress',
      timestamp: new Date().toISOString()
    };
    this.tasks.push(task);

    try {
      // DevOps sets up deployment
      const deployment = await this.devOps.setupDeployment(
        this.projectContext!.name,
        this.projectContext!.architecture!,
        this.projectContext!.features
      );

      // Create additional deployment artifacts
      const dockerfile = await this.devOps.createDockerfile(this.projectContext!.architecture!, this.projectContext!.name);
      const dockerCompose = await this.devOps.createDockerCompose(this.projectContext!.architecture!, this.projectContext!.name);
      const githubActions = await this.devOps.createGitHubActions(this.projectContext!.architecture!, this.projectContext!.name);

      // Validate deployment
      const validation = await this.devOps.validateDeployment(deployment);
      if (!validation.valid) {
        console.warn('⚠️ Deployment validation issues:', validation.issues);
      }

      // Update project context
      this.projectContext!.deployment = deployment;
      
      // Record decision
      this.projectContext!.decisions.push({
        id: uuidv4(),
        decision: 'Deployment configuration created',
        rationale: `Created deployment configuration with Docker, CI/CD pipelines, and environment setup`,
        timestamp: new Date().toISOString()
      });

      // Save project context
      await this.fileSystem.saveProjectContext(this.projectContext!);
      
      task.status = 'completed';
      task.output = { deployment, dockerfile, dockerCompose, githubActions };
      task.duration = Date.now() - new Date(task.timestamp).getTime();
      
      console.log('✅ Deployment setup completed');
      
    } catch (error) {
      task.status = 'failed';
      task.output = { error: error instanceof Error ? error.message : 'Unknown error' };
      throw error;
    }
  }

  private async finalizeProject(): Promise<void> {
    console.log('🎉 Finalizing project...');
    
    try {
      // Create project documentation
      await this.createProjectDocumentation();
      
      // Create deployment artifacts
      await this.createDeploymentArtifacts();
      
      // Generate project summary
      await this.generateProjectSummary();
      
      console.log('✅ Project finalized successfully');
      
    } catch (error) {
      console.error('❌ Project finalization failed:', error);
      throw error;
    }
  }

  private async groupUserStoriesIntoFeatures(): Promise<Record<string, UserStory[]>> {
    const featureGroups: Record<string, UserStory[]> = {};
    
    for (const story of this.projectContext!.userStories) {
      // Simple grouping based on story title keywords
      const keywords = story.title.toLowerCase().split(' ');
      let featureName = 'General';
      
      if (keywords.some((k: string) => ['user', 'auth', 'login', 'register'].includes(k))) {
        featureName = 'User Authentication';
      } else if (keywords.some((k: string) => ['crud', 'create', 'read', 'update', 'delete'].includes(k))) {
        featureName = 'Data Management';
      } else if (keywords.some((k: string) => ['api', 'endpoint', 'service'].includes(k))) {
        featureName = 'API Services';
      } else if (keywords.some((k: string) => ['ui', 'interface', 'page', 'view'].includes(k))) {
        featureName = 'User Interface';
      }
      
      if (!featureGroups[featureName]) {
        featureGroups[featureName] = [];
      }
      featureGroups[featureName].push(story);
    }
    
    return featureGroups;
  }

  private async createProjectDocumentation(): Promise<void> {
    // Create README
    await this.fileSystem.createREADME(this.projectContext!.name, this.projectContext!);
    
    // Create environment file
    if (this.projectContext!.architecture) {
      await this.fileSystem.createEnvironmentFile(this.projectContext!.architecture);
    }
    
    // Create package.json
    if (this.projectContext!.architecture) {
      await this.fileSystem.createPackageJson(this.projectContext!.name, this.projectContext!.architecture);
    }
    
    // Create .gitignore
    await this.fileSystem.createGitignore();
  }

  private async createDeploymentArtifacts(): Promise<void> {
    if (this.projectContext!.architecture && this.projectContext!.deployment) {
      // Create Dockerfile
      const dockerfile = await this.devOps.createDockerfile(this.projectContext!.architecture, this.projectContext!.name);
      await this.fileSystem.writeFile('Dockerfile', dockerfile);
      
      // Create docker-compose.yml
      const dockerCompose = await this.devOps.createDockerCompose(this.projectContext!.architecture, this.projectContext!.name);
      await this.fileSystem.writeFile('docker-compose.yml', dockerCompose);
      
      // Create GitHub Actions
      const githubActions = await this.devOps.createGitHubActions(this.projectContext!.architecture, this.projectContext!.name);
      await this.fileSystem.writeFile('.github/workflows/ci.yml', githubActions);
    }
  }

  private async generateProjectSummary(): Promise<void> {
    const summary = {
      projectName: this.projectContext!.name,
      description: this.projectContext!.description,
      status: 'completed',
      phases: {
        requirementsAnalysis: 'completed',
        architectureDesign: 'completed',
        development: 'completed',
        testing: 'completed',
        deployment: 'completed'
      },
      statistics: {
        userStories: this.projectContext!.userStories.length,
        features: this.projectContext!.features.length,
        decisions: this.projectContext!.decisions.length,
        tasks: this.tasks.length
      },
      techStack: this.projectContext!.architecture?.techStack,
      completedAt: new Date().toISOString()
    };
    
    await this.fileSystem.writeFile('project-summary.json', JSON.stringify(summary, null, 2));
  }

  async getProjectStatus(): Promise<{
    context: ProjectContext | null;
    tasks: AgentTask[];
    currentPhase: ProjectPhase;
  }> {
    return {
      context: this.projectContext,
      tasks: this.tasks,
      currentPhase: this.projectContext?.phase || ProjectPhase.REQUIREMENTS_ANALYSIS
    };
  }

  async getTaskHistory(): Promise<AgentTask[]> {
    return this.tasks;
  }

  async getProjectContext(): Promise<ProjectContext | null> {
    return this.projectContext;
  }
}