/**
 * POST /api/saveModules
 * DEPRECATED: Use /api/agents instead
 * Save selected modules for a user (kept for backward compatibility)
 */

import { NextRequest, NextResponse } from 'next/server';
import { updateAgent } from '@/lib/storage/agents';
import { UserModuleSelection } from '@/types/module';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, modules, agentId } = body;
    
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'userId is required and must be a string',
      }, { status: 400 });
    }
    
    if (!agentId) {
      return NextResponse.json({
        success: false,
        error: 'agentId is required. Please use /api/agents to create an agent first.',
      }, { status: 400 });
    }
    
    if (!Array.isArray(modules)) {
      return NextResponse.json({
        success: false,
        error: 'modules must be an array',
      }, { status: 400 });
    }
    
    // Validate module structure
    const moduleSelections: UserModuleSelection[] = modules.map((mod: any, index: number) => {
      if (!mod.moduleName || typeof mod.moduleName !== 'string') {
        throw new Error(`Module ${index}: moduleName is required and must be a string`);
      }
      return {
        moduleName: mod.moduleName,
        input: mod.input || {},
        order: mod.order !== undefined ? mod.order : index,
      };
    });
    
    const agent = await updateAgent(agentId, userId, { modules: moduleSelections });
    
    if (!agent) {
      return NextResponse.json({
        success: false,
        error: 'Agent not found or unauthorized',
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Modules saved successfully',
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save modules',
    }, { status: 500 });
  }
}

