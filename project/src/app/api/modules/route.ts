/**
 * POST /api/modules
 * Returns list of all available modules with metadata
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAllModuleMetadata } from '@/lib/modules';

export async function POST(request: NextRequest) {
  try {
    const modules = getAllModuleMetadata();
    
    return NextResponse.json({
      success: true,
      modules,
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch modules',
    }, { status: 500 });
  }
}

