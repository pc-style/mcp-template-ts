import { z } from 'zod';
import { FileOperations } from '../utils/file-operations.js';

export const reviewCodeSchema = z.object({
  code: z.string().describe('Code content to review'),
  filePath: z.string().optional().describe('Path to the file being reviewed'),
  language: z.string().optional().describe('Programming language of the code'),
  reviewType: z.enum(['security', 'performance', 'maintainability', 'best-practices', 'comprehensive']).optional().describe('Type of review to focus on')
});

export async function reviewCode(args: z.infer<typeof reviewCodeSchema>) {
  try {
    const language = args.language || detectLanguage(args.filePath || '');
    const reviewType = args.reviewType || 'comprehensive';
    
    // Perform code analysis
    const analysis = await analyzeCode(args.code, language, reviewType);
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            success: true,
            data: {
              filePath: args.filePath,
              language,
              reviewType,
              analysis: {
                overallScore: analysis.overallScore,
                issues: analysis.issues,
                suggestions: analysis.suggestions,
                strengths: analysis.strengths,
                metrics: analysis.metrics
              },
              summary: {
                totalIssues: analysis.issues.length,
                criticalIssues: analysis.issues.filter((issue: any) => issue.severity === 'critical').length,
                warningIssues: analysis.issues.filter((issue: any) => issue.severity === 'warning').length,
                infoIssues: analysis.issues.filter((issue: any) => issue.severity === 'info').length,
                linesOfCode: args.code.split('\n').length,
                complexity: analysis.metrics.cyclomaticComplexity
              }
            }
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            success: false,
            error: `Code review failed: ${error.message}`
          }, null, 2)
        }
      ]
    };
  }
}

function detectLanguage(filePath: string): string {
  const extension = FileOperations.getFileExtension(filePath);
  const languageMap: Record<string, string> = {
    'ts': 'typescript',
    'js': 'javascript',
    'tsx': 'typescript',
    'jsx': 'javascript',
    'py': 'python',
    'go': 'go',
    'java': 'java',
    'cs': 'csharp',
    'cpp': 'cpp',
    'c': 'c',
    'rs': 'rust',
    'php': 'php',
    'rb': 'ruby'
  };
  
  return languageMap[extension] || 'unknown';
}

async function analyzeCode(code: string, language: string, reviewType: string): Promise<any> {
  // This is a comprehensive code analysis function
  // In a real implementation, this would use actual static analysis tools
  
  const lines = code.split('\n');
  const issues: any[] = [];
  const suggestions: any[] = [];
  const strengths: any[] = [];
  
  // Basic code metrics
  const linesOfCode = lines.filter(line => line.trim() && !line.trim().startsWith('//')).length;
  const cyclomaticComplexity = calculateCyclomaticComplexity(code);
  
  // Security analysis
  if (reviewType === 'security' || reviewType === 'comprehensive') {
    issues.push(...analyzeSecurityIssues(code, language));
  }
  
  // Performance analysis
  if (reviewType === 'performance' || reviewType === 'comprehensive') {
    issues.push(...analyzePerformanceIssues(code, language));
  }
  
  // Maintainability analysis
  if (reviewType === 'maintainability' || reviewType === 'comprehensive') {
    issues.push(...analyzeMaintainabilityIssues(code, language));
  }
  
  // Best practices analysis
  if (reviewType === 'best-practices' || reviewType === 'comprehensive') {
    issues.push(...analyzeBestPractices(code, language));
  }
  
  // Generate suggestions
  suggestions.push(...generateSuggestions(code, language, issues));
  
  // Identify strengths
  strengths.push(...identifyStrengths(code, language));
  
  // Calculate overall score
  const overallScore = calculateOverallScore(issues, linesOfCode);
  
  return {
    overallScore,
    issues,
    suggestions,
    strengths,
    metrics: {
      linesOfCode,
      cyclomaticComplexity,
      functionCount: countFunctions(code, language),
      classCount: countClasses(code, language),
      duplicateLines: findDuplicateLines(lines)
    }
  };
}

function calculateCyclomaticComplexity(code: string): number {
  // Simple cyclomatic complexity calculation
  const patterns = [
    /\bif\b/g,
    /\belse\s+if\b/g,
    /\bwhile\b/g,
    /\bfor\b/g,
    /\bdo\b/g,
    /\bswitch\b/g,
    /\bcase\b/g,
    /\bcatch\b/g,
    /\b\?\s*.*?\s*:/g, // ternary operator
    /&&/g,
    /\|\|/g
  ];
  
  let complexity = 1; // Base complexity
  patterns.forEach(pattern => {
    const matches = code.match(pattern);
    if (matches) {
      complexity += matches.length;
    }
  });
  
  return complexity;
}

function analyzeSecurityIssues(code: string, language: string): any[] {
  const issues: any[] = [];
  
  // Common security patterns to check
  const securityPatterns = [
    {
      pattern: /eval\s*\(/g,
      message: 'Use of eval() can lead to code injection vulnerabilities',
      severity: 'critical',
      type: 'security'
    },
    {
      pattern: /innerHTML\s*=/g,
      message: 'Setting innerHTML can lead to XSS vulnerabilities',
      severity: 'warning',
      type: 'security'
    },
    {
      pattern: /process\.env\.\w+/g,
      message: 'Environment variables should be validated and sanitized',
      severity: 'info',
      type: 'security'
    },
    {
      pattern: /SELECT\s+\*\s+FROM/gi,
      message: 'Avoid SELECT * queries, specify columns explicitly',
      severity: 'warning',
      type: 'security'
    }
  ];
  
  if (language === 'javascript' || language === 'typescript') {
    securityPatterns.push(
      {
        pattern: /document\.write\s*\(/g,
        message: 'document.write can lead to XSS vulnerabilities',
        severity: 'critical',
        type: 'security'
      },
      {
        pattern: /localStorage\.|sessionStorage\./g,
        message: 'Be cautious with storing sensitive data in browser storage',
        severity: 'info',
        type: 'security'
      }
    );
  }
  
  securityPatterns.forEach(({ pattern, message, severity, type }) => {
    const matches = code.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const lineNumber = findLineNumber(code, match);
        issues.push({
          type,
          severity,
          message,
          line: lineNumber,
          code: match.trim()
        });
      });
    }
  });
  
  return issues;
}

function analyzePerformanceIssues(code: string, language: string): any[] {
  const issues: any[] = [];
  
  // Performance anti-patterns
  const performancePatterns = [
    {
      pattern: /for\s*\([^}]*\.length[^}]*\)/g,
      message: 'Cache array length in loop condition for better performance',
      severity: 'warning',
      type: 'performance'
    },
    {
      pattern: /\+\s*=\s*"[^"]*"/g,
      message: 'String concatenation in loop can be inefficient, consider using array join',
      severity: 'info',
      type: 'performance'
    }
  ];
  
  if (language === 'javascript' || language === 'typescript') {
    performancePatterns.push(
      {
        pattern: /document\.getElementById/g,
        message: 'Consider caching DOM element references',
        severity: 'info',
        type: 'performance'
      },
      {
        pattern: /new\s+Date\s*\(\s*\)/g,
        message: 'Frequent Date object creation can impact performance',
        severity: 'info',
        type: 'performance'
      }
    );
  }
  
  performancePatterns.forEach(({ pattern, message, severity, type }) => {
    const matches = code.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const lineNumber = findLineNumber(code, match);
        issues.push({
          type,
          severity,
          message,
          line: lineNumber,
          code: match.trim()
        });
      });
    }
  });
  
  return issues;
}

function analyzeMaintainabilityIssues(code: string, language: string): any[] {
  const issues: any[] = [];
  const lines = code.split('\n');
  
  // Check for long functions
  const functionStarts = findFunctionStarts(code, language);
  functionStarts.forEach(start => {
    const functionLength = calculateFunctionLength(lines, start);
    if (functionLength > 50) {
      issues.push({
        type: 'maintainability',
        severity: 'warning',
        message: `Function is too long (${functionLength} lines). Consider breaking it down.`,
        line: start
      });
    }
  });
  
  // Check for long lines
  lines.forEach((line, index) => {
    if (line.length > 120) {
      issues.push({
        type: 'maintainability',
        severity: 'info',
        message: 'Line is too long. Consider breaking it for better readability.',
        line: index + 1,
        code: line.substring(0, 50) + '...'
      });
    }
  });
  
  // Check for magic numbers
  const magicNumbers = code.match(/\b\d{2,}\b/g);
  if (magicNumbers) {
    magicNumbers.forEach(number => {
      const lineNumber = findLineNumber(code, number);
      issues.push({
        type: 'maintainability',
        severity: 'info',
        message: `Consider extracting magic number ${number} into a named constant`,
        line: lineNumber,
        code: number
      });
    });
  }
  
  return issues;
}

function analyzeBestPractices(code: string, language: string): any[] {
  const issues: any[] = [];
  
  if (language === 'typescript' || language === 'javascript') {
    // Check for var usage
    const varUsage = code.match(/\bvar\s+\w+/g);
    if (varUsage) {
      varUsage.forEach(match => {
        const lineNumber = findLineNumber(code, match);
        issues.push({
          type: 'best-practices',
          severity: 'warning',
          message: 'Use let or const instead of var',
          line: lineNumber,
          code: match.trim()
        });
      });
    }
    
    // Check for == usage
    const looseEquality = code.match(/[^=!]==[^=]/g);
    if (looseEquality) {
      looseEquality.forEach(match => {
        const lineNumber = findLineNumber(code, match);
        issues.push({
          type: 'best-practices',
          severity: 'warning',
          message: 'Use strict equality (===) instead of loose equality (==)',
          line: lineNumber,
          code: match.trim()
        });
      });
    }
  }
  
  return issues;
}

function generateSuggestions(code: string, language: string, issues: any[]): any[] {
  const suggestions: any[] = [];
  
  // Generate suggestions based on issues
  const securityIssues = issues.filter(issue => issue.type === 'security');
  if (securityIssues.length > 0) {
    suggestions.push({
      category: 'security',
      message: 'Consider implementing input validation and sanitization',
      priority: 'high'
    });
  }
  
  const performanceIssues = issues.filter(issue => issue.type === 'performance');
  if (performanceIssues.length > 0) {
    suggestions.push({
      category: 'performance',
      message: 'Consider implementing performance monitoring and optimization',
      priority: 'medium'
    });
  }
  
  // General suggestions based on code patterns
  if (language === 'typescript' || language === 'javascript') {
    if (code.includes('async') && !code.includes('try')) {
      suggestions.push({
        category: 'error-handling',
        message: 'Add proper error handling for async operations',
        priority: 'high'
      });
    }
  }
  
  return suggestions;
}

function identifyStrengths(code: string, language: string): any[] {
  const strengths: any[] = [];
  
  if (language === 'typescript') {
    strengths.push({
      category: 'type-safety',
      message: 'Good use of TypeScript for type safety'
    });
  }
  
  if (code.includes('try') && code.includes('catch')) {
    strengths.push({
      category: 'error-handling',
      message: 'Proper error handling implemented'
    });
  }
  
  if (code.includes('const ') && !code.includes('var ')) {
    strengths.push({
      category: 'best-practices',
      message: 'Good use of const for immutable values'
    });
  }
  
  return strengths;
}

function calculateOverallScore(issues: any[], linesOfCode: number): number {
  const criticalIssues = issues.filter(issue => issue.severity === 'critical').length;
  const warningIssues = issues.filter(issue => issue.severity === 'warning').length;
  const infoIssues = issues.filter(issue => issue.severity === 'info').length;
  
  const penalty = (criticalIssues * 3) + (warningIssues * 2) + (infoIssues * 1);
  const maxScore = 100;
  const normalizedPenalty = Math.min(penalty / linesOfCode * 50, maxScore);
  
  return Math.max(maxScore - normalizedPenalty, 0);
}

function findLineNumber(code: string, searchText: string): number {
  const lines = code.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(searchText)) {
      return i + 1;
    }
  }
  return 1;
}

function findFunctionStarts(code: string, language: string): number[] {
  const lines = code.split('\n');
  const functionStarts: number[] = [];
  
  lines.forEach((line, index) => {
    if (language === 'typescript' || language === 'javascript') {
      if (line.includes('function ') || line.includes('=>') || line.includes('async ')) {
        functionStarts.push(index + 1);
      }
    }
  });
  
  return functionStarts;
}

function calculateFunctionLength(lines: string[], startLine: number): number {
  let braceCount = 0;
  let length = 0;
  
  for (let i = startLine - 1; i < lines.length; i++) {
    const line = lines[i];
    length++;
    
    const openBraces = (line.match(/{/g) || []).length;
    const closeBraces = (line.match(/}/g) || []).length;
    braceCount += openBraces - closeBraces;
    
    if (braceCount === 0 && i > startLine - 1) {
      break;
    }
  }
  
  return length;
}

function countFunctions(code: string, language: string): number {
  if (language === 'typescript' || language === 'javascript') {
    const functionPattern = /function\s+\w+|=>\s*{|async\s+function/g;
    return (code.match(functionPattern) || []).length;
  }
  return 0;
}

function countClasses(code: string, language: string): number {
  if (language === 'typescript' || language === 'javascript') {
    const classPattern = /class\s+\w+/g;
    return (code.match(classPattern) || []).length;
  }
  return 0;
}

function findDuplicateLines(lines: string[]): number {
  const lineMap = new Map<string, number>();
  let duplicates = 0;
  
  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('//')) {
      const count = lineMap.get(trimmed) || 0;
      if (count === 1) {
        duplicates++;
      }
      lineMap.set(trimmed, count + 1);
    }
  });
  
  return duplicates;
}