import { logger } from '../../config/logger';
import type { IntentCategory } from '../router/intent.types';
import {
  DuplicateToolError,
  InvalidContextError,
  ToolExecutionError,
  ToolNotFoundError,
} from './tool.errors';
import type { AITool } from './tool.interface';
import type { ToolContext, ToolResult } from './tool.types';

export class ToolRegistry {
  private readonly tools = new Map<string, AITool>();

  /**
   * Register a new tool adapter in the registry.
   * Throws DuplicateToolError if a tool with the same ID already exists.
   */
  public register(tool: AITool): void {
    if (!this.validate(tool)) {
      throw new InvalidContextError('Invalid tool implementation passed to ToolRegistry.register');
    }

    if (this.tools.has(tool.id)) {
      throw new DuplicateToolError(tool.id);
    }

    this.tools.set(tool.id, tool);
    logger.info({ toolId: tool.id, name: tool.name }, 'Tool successfully registered in ToolRegistry');
  }

  /**
   * Unregister an existing tool adapter by ID.
   */
  public unregister(toolId: string): void {
    if (this.tools.has(toolId)) {
      this.tools.delete(toolId);
      logger.info({ toolId }, 'Tool unregistered from ToolRegistry');
    }
  }

  /**
   * Find a tool adapter by ID.
   */
  public find(toolId: string): AITool | undefined {
    return this.tools.get(toolId);
  }

  /**
   * Find a tool adapter supporting a given intent category.
   */
  public findByIntent(intent: IntentCategory): AITool | undefined {
    for (const tool of this.tools.values()) {
      if (tool.supportedIntent === intent) {
        return tool;
      }
    }
    return undefined;
  }

  /**
   * List all registered tools.
   */
  public list(): AITool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Validate that a tool instance implements all required AITool properties.
   */
  public validate(tool: AITool): boolean {
    return Boolean(
      tool &&
      typeof tool.id === 'string' && tool.id.trim() !== '' &&
      typeof tool.name === 'string' &&
      typeof tool.description === 'string' &&
      typeof tool.supportedIntent === 'string' &&
      typeof tool.execute === 'function',
    );
  }

  /**
   * Execute a tool by ID with the provided context.
   */
  public async execute(toolId: string, context: ToolContext): Promise<ToolResult> {
    if (!context || !context.userId) {
      throw new InvalidContextError('ToolContext must contain valid userId and executionPlan');
    }

    const tool = this.find(toolId);

    if (!tool) {
      throw new ToolNotFoundError(toolId);
    }

    try {
      logger.info({ toolId, userId: context.userId, intent: tool.supportedIntent }, 'Executing tool adapter');
      const result = await tool.execute(context);
      return result;
    } catch (error: any) {
      logger.error({ err: error, toolId }, 'Tool execution failed');
      throw new ToolExecutionError(toolId, error?.message || 'Unknown tool failure', error);
    }
  }
}

export const toolRegistry = new ToolRegistry();
