import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

export class GitOperations {
  private workingDir: string;

  constructor(workingDir: string) {
    this.workingDir = workingDir;
  }

  private async runGitCommand(command: string): Promise<string> {
    try {
      const { stdout } = await execAsync(`git ${command}`, { cwd: this.workingDir });
      return stdout.trim();
    } catch (error) {
      throw new Error(`Git command failed: ${command}\n${error}`);
    }
  }

  async init(): Promise<void> {
    try {
      await this.runGitCommand('init');
    } catch (error) {
      // Ignore if already initialized
      const error = e as Error;
      if (!error.message.includes('already exists')) {
        throw error;
      }
    }
  }

  async addAll(): Promise<void> {
    await this.runGitCommand('add .');
  }

  async commit(message: string): Promise<void> {
    try {
      await this.runGitCommand(`commit -m "${message}"`);
    } catch (error) {
      // Ignore if nothing to commit
      const error = e as Error;
      if (!error.message.includes('nothing to commit')) {
        throw error;
      }
    }
  }

  async createBranch(branchName: string): Promise<void> {
    try {
      await this.runGitCommand(`checkout -b ${branchName}`);
    } catch (error) {
      // Branch might already exist
      await this.runGitCommand(`checkout ${branchName}`);
    }
  }

  async getCurrentBranch(): Promise<string> {
    return await this.runGitCommand('branch --show-current');
  }

  async getStatus(): Promise<string> {
    return await this.runGitCommand('status --porcelain');
  }

  async getLastCommit(): Promise<string> {
    return await this.runGitCommand('log -1 --oneline');
  }

  async createGitignore(patterns: string[]): Promise<void> {
    const gitignoreContent = patterns.join('\n') + '\n';
    const { FileOperations } = await import('./file-operations.js');
    await FileOperations.writeFile(this.workingDir + '/.gitignore', gitignoreContent);
  }

  async isRepository(): Promise<boolean> {
    try {
      await this.runGitCommand('rev-parse --git-dir');
      return true;
    } catch {
      return false;
    }
  }

  async setupRepository(projectName: string): Promise<void> {
    const isRepo = await this.isRepository();
    
    if (!isRepo) {
      await this.init();
      
      // Create initial gitignore
      const defaultPatterns = [
        'node_modules/',
        'dist/',
        'build/',
        '.env',
        '.env.local',
        '*.log',
        '.DS_Store',
        'coverage/',
        '.nyc_output/'
      ];
      
      await this.createGitignore(defaultPatterns);
      await this.addAll();
      await this.commit(`Initial commit for ${projectName}`);
    }
  }

  async commitChanges(message: string): Promise<void> {
    const status = await this.getStatus();
    if (status) {
      await this.addAll();
      await this.commit(message);
    }
  }
}