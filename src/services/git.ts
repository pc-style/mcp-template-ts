import { simpleGit, SimpleGit, SimpleGitOptions } from 'simple-git';
import { config } from '../config.js';
import { Logger } from '../utils/logger.js';

export class GitService {
  private git!: SimpleGit;
  private logger: Logger;

  constructor(repoPath?: string) {
    this.logger = new Logger('GitService');
    
    if (!config.git.enabled) {
      this.logger.warn('Git integration is disabled');
      return;
    }

    const options: SimpleGitOptions = {
      baseDir: repoPath || process.cwd(),
      config: [],
      maxConcurrentProcesses: 1,
      trimmed: false,
    };

    this.git = simpleGit(options);
  }

  async initialize(repoPath?: string): Promise<void> {
    if (!config.git.enabled) {
      this.logger.warn('Git integration is disabled, skipping initialization');
      return;
    }

    try {
      if (repoPath) {
        this.git = simpleGit(repoPath);
      }
      
      await this.git.init();
      this.logger.info('Git repository initialized', { path: repoPath });
    } catch (error) {
      this.logger.error('Failed to initialize Git repository', { error });
      throw error;
    }
  }

  async addFiles(files: string[]): Promise<void> {
    if (!config.git.enabled) {
      this.logger.warn('Git integration is disabled, skipping add files');
      return;
    }

    try {
      await this.git.add(files);
      this.logger.info('Files added to Git', { files });
    } catch (error) {
      this.logger.error('Failed to add files to Git', { error, files });
      throw error;
    }
  }

  async commitChanges(message: string, author?: string): Promise<void> {
    if (!config.git.enabled) {
      this.logger.warn('Git integration is disabled, skipping commit');
      return;
    }

    try {
      const commitOptions: any = {};
      if (author) {
        commitOptions['--author'] = author;
      }

      await this.git.commit(message, commitOptions);
      this.logger.info('Changes committed to Git', { message, author });
    } catch (error) {
      this.logger.error('Failed to commit changes to Git', { error, message });
      throw error;
    }
  }

  async createBranch(branchName: string): Promise<void> {
    if (!config.git.enabled) {
      this.logger.warn('Git integration is disabled, skipping branch creation');
      return;
    }

    try {
      await this.git.checkoutBranch(branchName, 'HEAD');
      this.logger.info('Branch created and checked out', { branchName });
    } catch (error) {
      this.logger.error('Failed to create branch', { error, branchName });
      throw error;
    }
  }

  async switchBranch(branchName: string): Promise<void> {
    if (!config.git.enabled) {
      this.logger.warn('Git integration is disabled, skipping branch switch');
      return;
    }

    try {
      await this.git.checkout(branchName);
      this.logger.info('Switched to branch', { branchName });
    } catch (error) {
      this.logger.error('Failed to switch branch', { error, branchName });
      throw error;
    }
  }

  async getCurrentBranch(): Promise<string> {
    if (!config.git.enabled) {
      this.logger.warn('Git integration is disabled, cannot get current branch');
      return '';
    }

    try {
      const branch = await this.git.branch();
      return branch.current;
    } catch (error) {
      this.logger.error('Failed to get current branch', { error });
      throw error;
    }
  }

  async getStatus(): Promise<any> {
    if (!config.git.enabled) {
      this.logger.warn('Git integration is disabled, cannot get status');
      return {};
    }

    try {
      const status = await this.git.status();
      return {
        current: status.current,
        tracking: status.tracking,
        ahead: status.ahead,
        behind: status.behind,
        modified: status.modified,
        created: status.created,
        deleted: status.deleted,
        renamed: status.renamed,
        staged: status.staged,
        conflicted: status.conflicted,
        not_added: status.not_added,
      };
    } catch (error) {
      this.logger.error('Failed to get Git status', { error });
      throw error;
    }
  }

  async getLog(options?: { maxCount?: number; from?: string; to?: string }): Promise<any[]> {
    if (!config.git.enabled) {
      this.logger.warn('Git integration is disabled, cannot get log');
      return [];
    }

    try {
      const logOptions: any = {};
      if (options?.maxCount) logOptions['--max-count'] = options.maxCount;
      if (options?.from) logOptions['--from'] = options.from;
      if (options?.to) logOptions['--to'] = options.to;

      const log = await this.git.log(logOptions);
      return [...log.all];
    } catch (error) {
      this.logger.error('Failed to get Git log', { error });
      throw error;
    }
  }

  async pushToRemote(remote: string = 'origin', branch?: string): Promise<void> {
    if (!config.git.enabled) {
      this.logger.warn('Git integration is disabled, skipping push');
      return;
    }

    try {
      const pushOptions: any = {};
      if (branch) {
        pushOptions[remote] = branch;
      } else {
        pushOptions[remote] = await this.getCurrentBranch();
      }

      await this.git.push(remote, pushOptions[remote]);
      this.logger.info('Pushed to remote', { remote, branch: pushOptions[remote] });
    } catch (error) {
      this.logger.error('Failed to push to remote', { error, remote, branch });
      throw error;
    }
  }

  async pullFromRemote(remote: string = 'origin', branch?: string): Promise<void> {
    if (!config.git.enabled) {
      this.logger.warn('Git integration is disabled, skipping pull');
      return;
    }

    try {
      const pullOptions: any = {};
      if (branch) {
        pullOptions[remote] = branch;
      } else {
        pullOptions[remote] = await this.getCurrentBranch();
      }

      await this.git.pull(remote, pullOptions[remote]);
      this.logger.info('Pulled from remote', { remote, branch: pullOptions[remote] });
    } catch (error) {
      this.logger.error('Failed to pull from remote', { error, remote, branch });
      throw error;
    }
  }

  async addRemote(name: string, url: string): Promise<void> {
    if (!config.git.enabled) {
      this.logger.warn('Git integration is disabled, skipping remote addition');
      return;
    }

    try {
      await this.git.addRemote(name, url);
      this.logger.info('Remote added', { name, url });
    } catch (error) {
      this.logger.error('Failed to add remote', { error, name, url });
      throw error;
    }
  }

  async removeRemote(name: string): Promise<void> {
    if (!config.git.enabled) {
      this.logger.warn('Git integration is disabled, skipping remote removal');
      return;
    }

    try {
      await this.git.removeRemote(name);
      this.logger.info('Remote removed', { name });
    } catch (error) {
      this.logger.error('Failed to remove remote', { error, name });
      throw error;
    }
  }

  async getRemotes(): Promise<any[]> {
    if (!config.git.enabled) {
      this.logger.warn('Git integration is disabled, cannot get remotes');
      return [];
    }

    try {
      const remotes = await this.git.getRemotes();
      return remotes.map(r => ({ name: r.name, refs: [] }));
    } catch (error) {
      this.logger.error('Failed to get remotes', { error });
      throw error;
    }
  }

  async addTag(tagName: string, message?: string): Promise<void> {
    if (!config.git.enabled) {
      this.logger.warn('Git integration is disabled, skipping tag addition');
      return;
    }

    try {
      if (message) {
        await this.git.addAnnotatedTag(tagName, message);
      } else {
        await this.git.addTag(tagName);
      }
      this.logger.info('Tag added', { tagName, message });
    } catch (error) {
      this.logger.error('Failed to add tag', { error, tagName, message });
      throw error;
    }
  }

  async removeTag(tagName: string): Promise<void> {
    if (!config.git.enabled) {
      this.logger.warn('Git integration is disabled, skipping tag removal');
      return;
    }

    try {
      await this.git.tag(['-d', tagName]);
      this.logger.info('Tag removed', { tagName });
    } catch (error) {
      this.logger.error('Failed to remove tag', { error, tagName });
      throw error;
    }
  }

  async getTags(): Promise<string[]> {
    if (!config.git.enabled) {
      this.logger.warn('Git integration is disabled, cannot get tags');
      return [];
    }

    try {
      const tags = await this.git.tags();
      return tags.all;
    } catch (error) {
      this.logger.error('Failed to get tags', { error });
      throw error;
    }
  }

  async stash(message?: string): Promise<void> {
    if (!config.git.enabled) {
      this.logger.warn('Git integration is disabled, skipping stash');
      return;
    }

    try {
      if (message) {
        await this.git.stash(['push', '-m', message]);
      } else {
        await this.git.stash();
      }
      this.logger.info('Changes stashed', { message });
    } catch (error) {
      this.logger.error('Failed to stash changes', { error, message });
      throw error;
    }
  }

  async stashPop(): Promise<void> {
    if (!config.git.enabled) {
      this.logger.warn('Git integration is disabled, skipping stash pop');
      return;
    }

    try {
      await this.git.stash(['pop']);
      this.logger.info('Stashed changes applied');
    } catch (error) {
      this.logger.error('Failed to apply stashed changes', { error });
      throw error;
    }
  }

  async getStashList(): Promise<any[]> {
    if (!config.git.enabled) {
      this.logger.warn('Git integration is disabled, cannot get stash list');
      return [];
    }

    try {
      const stash = await this.git.stash(['list']);
      return Array.from(stash);
    } catch (error) {
      this.logger.error('Failed to get stash list', { error });
      throw error;
    }
  }

  async getRepositoryInfo(): Promise<any> {
    if (!config.git.enabled) {
      this.logger.warn('Git integration is disabled, cannot get repository info');
      return {};
    }

    try {
      const [status, remotes, currentBranch] = await Promise.all([
        this.getStatus(),
        this.getRemotes(),
        this.getCurrentBranch(),
      ]);

      return {
        currentBranch,
        status,
        remotes,
        repositoryPath: process.cwd(),
      };
    } catch (error) {
      this.logger.error('Failed to get repository info', { error });
      throw error;
    }
  }

  async isRepository(): Promise<boolean> {
    if (!config.git.enabled) {
      return false;
    }

    try {
      await this.git.status();
      return true;
    } catch (error) {
      return false;
    }
  }

  async hasUncommittedChanges(): Promise<boolean> {
    if (!config.git.enabled) {
      return false;
    }

    try {
      const status = await this.getStatus();
      return !!(status.modified?.length || status.created?.length || status.deleted?.length);
    } catch (error) {
      this.logger.error('Failed to check for uncommitted changes', { error });
      return false;
    }
  }
}