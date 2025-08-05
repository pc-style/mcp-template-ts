import { config } from '../config.js';
import chalk from 'chalk';

export class Logger {
  private context: string;
  private logLevel: number;

  constructor(context: string) {
    this.context = context;
    this.logLevel = this.getLogLevel();
  }

  private getLogLevel(): number {
    const levels = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };
    return levels[config.logging.level] || 1;
  }

  private formatMessage(level: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const levelColor = this.getLevelColor(level);
    const contextColor = chalk.cyan(this.context);
    
    let formatted = `${levelColor}[${level.toUpperCase()}]${chalk.reset()} ${timestamp} ${contextColor}: ${message}`;
    
    if (data && Object.keys(data).length > 0) {
      if (config.logging.format === 'json') {
        formatted += ` ${JSON.stringify(data)}`;
      } else {
        formatted += `\n${chalk.gray(JSON.stringify(data, null, 2))}`;
      }
    }
    
    return formatted;
  }

  private getLevelColor(level: string): string {
    switch (level.toLowerCase()) {
      case 'debug':
        return chalk.gray('DEBUG');
      case 'info':
        return chalk.blue('INFO');
      case 'warn':
        return chalk.yellow('WARN');
      case 'error':
        return chalk.red('ERROR');
      default:
        return chalk.white(level.toUpperCase());
    }
  }

  private shouldLog(level: number): boolean {
    return level >= this.logLevel;
  }

  debug(message: string, data?: any): void {
    if (this.shouldLog(0)) {
      const formatted = this.formatMessage('debug', message, data);
      console.log(formatted);
    }
  }

  info(message: string, data?: any): void {
    if (this.shouldLog(1)) {
      const formatted = this.formatMessage('info', message, data);
      console.log(formatted);
    }
  }

  warn(message: string, data?: any): void {
    if (this.shouldLog(2)) {
      const formatted = this.formatMessage('warn', message, data);
      console.warn(formatted);
    }
  }

  error(message: string, data?: any): void {
    if (this.shouldLog(3)) {
      const formatted = this.formatMessage('error', message, data);
      console.error(formatted);
    }
  }

  // Specialized logging methods for agents
  taskStart(taskId: string, taskTitle: string): void {
    this.info(`Starting task: ${taskTitle}`, { taskId });
  }

  taskComplete(taskId: string, taskTitle: string, result?: any): void {
    this.info(`Completed task: ${taskTitle}`, { taskId, result });
  }

  taskError(taskId: string, taskTitle: string, error: Error): void {
    this.error(`Failed task: ${taskTitle}`, { taskId, error: error.message, stack: error.stack });
  }

  agentAction(action: string, details?: any): void {
    this.info(`Agent action: ${action}`, details);
  }

  decisionMade(decision: string, rationale?: string): void {
    this.info(`Decision made: ${decision}`, { rationale });
  }

  artifactCreated(artifact: string, path: string): void {
    this.info(`Created artifact: ${artifact}`, { path });
  }

  // Progress tracking
  progress(current: number, total: number, description: string): void {
    const percentage = Math.round((current / total) * 100);
    this.info(`Progress: ${percentage}% (${current}/${total}) - ${description}`);
  }
}