/**
 * Custom Error Classes for AI Tool Registry
 * PS-05 Enterprise Intelligence Platform
 */

export class ToolError extends Error {
  public readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'ToolError';
    this.code = code;
  }
}

export class DuplicateToolError extends ToolError {
  constructor(toolId: string) {
    super('DUPLICATE_TOOL_ID', `Tool with ID "${toolId}" is already registered in ToolRegistry.`);
    this.name = 'DuplicateToolError';
  }
}

export class ToolNotFoundError extends ToolError {
  constructor(toolId: string) {
    super('TOOL_NOT_FOUND', `Tool with ID "${toolId}" could not be found in ToolRegistry.`);
    this.name = 'ToolNotFoundError';
  }
}

export class ToolExecutionError extends ToolError {
  public readonly originalError?: unknown;

  constructor(toolId: string, message: string, originalError?: unknown) {
    super('TOOL_EXECUTION_FAILED', `Execution failed for tool "${toolId}": ${message}`);
    this.name = 'ToolExecutionError';
    this.originalError = originalError;
  }
}

export class InvalidContextError extends ToolError {
  constructor(message: string) {
    super('INVALID_TOOL_CONTEXT', `Invalid tool execution context: ${message}`);
    this.name = 'InvalidContextError';
  }
}
