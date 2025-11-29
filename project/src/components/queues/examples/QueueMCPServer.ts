// src/mcp/QueueMCPServer.ts
import { MCPServerDO } from '@typescript-agent-framework/mcp';

export class QueueMCPServer extends MCPServerDO<Env> {
  constructor(state: DurableObjectState, env: Env) {
    super(state, env);
  }
  protected configureServer() {
    return {
      'queue-task': async ({ taskType, data }: { taskType: string, data: any }) => {
        const { TASK_QUEUE } = this.env;
        
        // Send task to appropriate queue
        await TASK_QUEUE.send({
          body: {
            taskType,
            data,
            queuedBy: 'mcp-server',
            queuedAt: Date.now(),
            taskId: crypto.randomUUID()
          }
        });
        
        return {
          success: true,
          message: `Task "${taskType}" queued successfully`,
          taskId: crypto.randomUUID()
        };
      },
      
      'batch-queue-tasks': async ({ tasks }: { tasks: Array<{taskType: string, data: any}> }) => {
        const { TASK_QUEUE } = this.env;
        
        // Send multiple tasks in batch
        const messages = tasks.map(task => ({
          body: {
            ...task,
            queuedBy: 'mcp-server',
            queuedAt: Date.now(),
            taskId: crypto.randomUUID()
          }
        }));
        
        await TASK_QUEUE.sendBatch(messages);
        
        return {
          success: true,
          message: `${tasks.length} tasks queued successfully`,
          taskCount: tasks.length
        };
      }
    };
  }
}

