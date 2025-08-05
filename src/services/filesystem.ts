import fs from 'fs-extra';
import path from 'path';
import { config } from '../config.js';
import { Logger } from '../utils/logger.js';

export class FileSystemService {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('FileSystem');
  }

  async ensureDirectory(dirPath: string): Promise<void> {
    try {
      await fs.ensureDir(dirPath);
      this.logger.debug(`Ensured directory exists: ${dirPath}`);
    } catch (error) {
      this.logger.error(`Failed to ensure directory: ${dirPath}`, { error });
      throw error;
    }
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    try {
      this.validateFilePath(filePath);
      await fs.ensureDir(path.dirname(filePath));
      await fs.writeFile(filePath, content, 'utf8');
      this.logger.debug(`Wrote file: ${filePath}`, { size: content.length });
    } catch (error) {
      this.logger.error(`Failed to write file: ${filePath}`, { error });
      throw error;
    }
  }

  async readFile(filePath: string): Promise<string> {
    try {
      this.validateFilePath(filePath);
      const content = await fs.readFile(filePath, 'utf8');
      this.logger.debug(`Read file: ${filePath}`, { size: content.length });
      return content;
    } catch (error) {
      this.logger.error(`Failed to read file: ${filePath}`, { error });
      throw error;
    }
  }

  async fileExists(filePath: string): Promise<boolean> {
    try {
      this.validateFilePath(filePath);
      return await fs.pathExists(filePath);
    } catch (error) {
      this.logger.error(`Failed to check file existence: ${filePath}`, { error });
      return false;
    }
  }

  async directoryExists(dirPath: string): Promise<boolean> {
    try {
      const stats = await fs.stat(dirPath);
      return stats.isDirectory();
    } catch (error) {
      return false;
    }
  }

  async listFiles(dirPath: string, pattern?: string): Promise<string[]> {
    try {
      await this.ensureDirectory(dirPath);
      const files = await fs.readdir(dirPath);
      
      if (pattern) {
        const regex = new RegExp(pattern);
        return files.filter(file => regex.test(file));
      }
      
      return files;
    } catch (error) {
      this.logger.error(`Failed to list files in directory: ${dirPath}`, { error });
      return [];
    }
  }

  async copyFile(source: string, destination: string): Promise<void> {
    try {
      this.validateFilePath(source);
      this.validateFilePath(destination);
      await fs.copy(source, destination);
      this.logger.debug(`Copied file: ${source} -> ${destination}`);
    } catch (error) {
      this.logger.error(`Failed to copy file: ${source} -> ${destination}`, { error });
      throw error;
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      this.validateFilePath(filePath);
      await fs.remove(filePath);
      this.logger.debug(`Deleted file: ${filePath}`);
    } catch (error) {
      this.logger.error(`Failed to delete file: ${filePath}`, { error });
      throw error;
    }
  }

  async createProjectStructure(projectPath: string, structure: any): Promise<void> {
    try {
      await this.ensureDirectory(projectPath);
      
      for (const [name, content] of Object.entries(structure)) {
        const fullPath = path.join(projectPath, name);
        
        if (typeof content === 'string') {
          // It's a file
          await this.writeFile(fullPath, content);
        } else if (typeof content === 'object' && content !== null) {
          // It's a directory
          await this.ensureDirectory(fullPath);
          await this.createProjectStructure(fullPath, content);
        }
      }
      
      this.logger.info(`Created project structure: ${projectPath}`);
    } catch (error) {
      this.logger.error(`Failed to create project structure: ${projectPath}`, { error });
      throw error;
    }
  }

  async generatePackageJson(projectPath: string, packageConfig: any): Promise<void> {
    const packageJson = {
      name: packageConfig.name || 'generated-project',
      version: packageConfig.version || '1.0.0',
      description: packageConfig.description || 'Auto-generated project',
      main: packageConfig.main || 'index.js',
      scripts: packageConfig.scripts || {
        start: 'node index.js',
        test: 'jest',
        build: 'echo "No build step defined"',
      },
      dependencies: packageConfig.dependencies || {},
      devDependencies: packageConfig.devDependencies || {},
      keywords: packageConfig.keywords || [],
      author: packageConfig.author || 'Auto-generated',
      license: packageConfig.license || 'MIT',
    };

    await this.writeFile(
      path.join(projectPath, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );
  }

  async generateReadme(projectPath: string, readmeContent: string): Promise<void> {
    await this.writeFile(
      path.join(projectPath, 'README.md'),
      readmeContent
    );
  }

  async generateGitignore(projectPath: string, patterns: string[]): Promise<void> {
    const defaultPatterns = [
      'node_modules/',
      'dist/',
      'build/',
      '.env',
      '.env.local',
      '.env.*.local',
      '*.log',
      'coverage/',
      '.nyc_output/',
      '.DS_Store',
      'Thumbs.db',
    ];

    const allPatterns = [...new Set([...defaultPatterns, ...patterns])];
    const gitignoreContent = allPatterns.join('\n') + '\n';

    await this.writeFile(
      path.join(projectPath, '.gitignore'),
      gitignoreContent
    );
  }

  async generateDockerfile(projectPath: string, dockerConfig: any): Promise<void> {
    const dockerfile = `FROM ${dockerConfig.baseImage || 'node:18-alpine'}

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

EXPOSE ${dockerConfig.port || 3000}

CMD ["npm", "start"]`;

    await this.writeFile(
      path.join(projectPath, 'Dockerfile'),
      dockerfile
    );
  }

  async generateDockerCompose(projectPath: string, services: any): Promise<void> {
    const dockerCompose = {
      version: '3.8',
      services: {
        app: {
          build: '.',
          ports: [`${services.app?.port || 3000}:${services.app?.port || 3000}`],
          environment: services.app?.environment || {},
          depends_on: services.app?.depends_on || [],
        },
        ...services,
      },
    };

    await this.writeFile(
      path.join(projectPath, 'docker-compose.yml'),
      JSON.stringify(dockerCompose, null, 2)
    );
  }

  async generateEnvFile(projectPath: string, envVars: Record<string, string>): Promise<void> {
    const envContent = Object.entries(envVars)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n') + '\n';

    await this.writeFile(
      path.join(projectPath, '.env.example'),
      envContent
    );
  }

  private validateFilePath(filePath: string): void {
    // Check file size limit
    if (config.filesystem.maxFileSize) {
      try {
        const stats = fs.statSync(filePath);
        if (stats.size > config.filesystem.maxFileSize) {
          throw new Error(`File size exceeds limit: ${filePath}`);
        }
      } catch (error) {
        // File doesn't exist yet, which is fine
      }
    }

    // Check file extension
    const ext = path.extname(filePath);
    if (!config.filesystem.allowedExtensions.includes(ext)) {
      throw new Error(`File extension not allowed: ${ext}`);
    }

    // Check for path traversal
    const normalizedPath = path.normalize(filePath);
    if (normalizedPath.includes('..')) {
      throw new Error(`Path traversal not allowed: ${filePath}`);
    }
  }

  async getFileStats(filePath: string): Promise<fs.Stats | null> {
    try {
      return await fs.stat(filePath);
    } catch (error) {
      return null;
    }
  }

  async isDirectory(filePath: string): Promise<boolean> {
    const stats = await this.getFileStats(filePath);
    return stats ? stats.isDirectory() : false;
  }

  async isFile(filePath: string): Promise<boolean> {
    const stats = await this.getFileStats(filePath);
    return stats ? stats.isFile() : false;
  }

  async getProjectSize(projectPath: string): Promise<number> {
    try {
      const files = await this.getAllFiles(projectPath);
      let totalSize = 0;

      for (const file of files) {
        const stats = await this.getFileStats(file);
        if (stats) {
          totalSize += stats.size;
        }
      }

      return totalSize;
    } catch (error) {
      this.logger.error(`Failed to calculate project size: ${projectPath}`, { error });
      return 0;
    }
  }

  private async getAllFiles(dirPath: string): Promise<string[]> {
    const files: string[] = [];
    
    try {
      const items = await fs.readdir(dirPath);
      
      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stats = await this.getFileStats(fullPath);
        
        if (stats) {
          if (stats.isDirectory()) {
            files.push(...await this.getAllFiles(fullPath));
          } else {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      this.logger.error(`Failed to get all files from directory: ${dirPath}`, { error });
    }
    
    return files;
  }
}