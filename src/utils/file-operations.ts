import { promises as fs } from 'node:fs';
import path from 'node:path';
import { GeneratedFile } from '../types/shared.js';

export class FileOperations {
  static async ensureDirectory(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      if ((error as any).code !== 'EEXIST') {
        throw error;
      }
    }
  }

  static async writeFile(filePath: string, content: string): Promise<void> {
    const dir = path.dirname(filePath);
    await this.ensureDirectory(dir);
    await fs.writeFile(filePath, content, 'utf8');
  }

  static async readFile(filePath: string): Promise<string> {
    return await fs.readFile(filePath, 'utf8');
  }

  static async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  static async listFiles(dirPath: string, recursive = false): Promise<string[]> {
    const files: string[] = [];
    
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isFile()) {
          files.push(fullPath);
        } else if (entry.isDirectory() && recursive) {
          const subFiles = await this.listFiles(fullPath, true);
          files.push(...subFiles);
        }
      }
    } catch (error) {
      // Directory doesn't exist or permission error
      console.warn(`Warning: Could not read directory ${dirPath}:`, error);
    }
    
    return files;
  }

  static async writeGeneratedFiles(files: GeneratedFile[], baseDir: string): Promise<void> {
    for (const file of files) {
      const fullPath = path.join(baseDir, file.path);
      await this.writeFile(fullPath, file.content);
    }
  }

  static async createProjectStructure(baseDir: string): Promise<void> {
    const directories = [
      'src',
      'src/components',
      'src/pages',
      'src/utils',
      'src/services',
      'tests',
      'tests/unit',
      'tests/integration',
      'tests/e2e',
      'docs',
      'config',
      'scripts',
      'public'
    ];

    for (const dir of directories) {
      await this.ensureDirectory(path.join(baseDir, dir));
    }
  }

  static async copyTemplate(templatePath: string, targetPath: string, replacements: Record<string, string> = {}): Promise<void> {
    const templateContent = await this.readFile(templatePath);
    let content = templateContent;
    
    for (const [key, value] of Object.entries(replacements)) {
      content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    
    await this.writeFile(targetPath, content);
  }

  static getFileExtension(filePath: string): string {
    return path.extname(filePath).slice(1);
  }

  static getRelativePath(from: string, to: string): string {
    return path.relative(from, to);
  }
}