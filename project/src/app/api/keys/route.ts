/**
 * POST /api/keys
 * Store API keys for a user
 * GET /api/keys
 * Get stored API keys for a user
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import mongoose from 'mongoose';

const ApiKeysSchema = new mongoose.Schema({
  walletAddress: { type: String, required: true, unique: true, index: true },
  anthropicApiKey: { type: String },
  cloudflareAccountId: { type: String },
  cloudflareApiToken: { type: String },
}, { timestamps: true });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, anthropicApiKey, cloudflareAccountId, cloudflareApiToken } = body;
    
    if (!walletAddress) {
      return NextResponse.json({
        success: false,
        error: 'walletAddress is required',
      }, { status: 400 });
    }
    
    await connectDB();
    
    const ApiKeys = mongoose.models.ApiKeys || mongoose.model('ApiKeys', ApiKeysSchema);
    
    const apiKeys = await ApiKeys.findOneAndUpdate(
      { walletAddress },
      {
        $set: {
          anthropicApiKey: anthropicApiKey || undefined,
          cloudflareAccountId: cloudflareAccountId || undefined,
          cloudflareApiToken: cloudflareApiToken || undefined,
        },
      },
      { upsert: true, new: true }
    );
    
    return NextResponse.json({
      success: true,
      message: 'API keys stored successfully',
      keys: {
        walletAddress: apiKeys.walletAddress,
        hasAnthropicKey: !!apiKeys.anthropicApiKey,
        hasCloudflareAccountId: !!apiKeys.cloudflareAccountId,
        hasCloudflareApiToken: !!apiKeys.cloudflareApiToken,
      },
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to store API keys',
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress');
    
    if (!walletAddress) {
      return NextResponse.json({
        success: false,
        error: 'walletAddress query parameter is required',
      }, { status: 400 });
    }
    
    await connectDB();
    
    const ApiKeys = mongoose.models.ApiKeys || mongoose.model('ApiKeys', ApiKeysSchema);
    
    const apiKeys = await ApiKeys.findOne({ walletAddress });
    
    if (!apiKeys) {
      return NextResponse.json({
        success: true,
        keys: null,
        message: 'No API keys stored for this wallet',
      }, { status: 200 });
    }
    
    return NextResponse.json({
      success: true,
      keys: {
        walletAddress: apiKeys.walletAddress,
        hasAnthropicKey: !!apiKeys.anthropicApiKey,
        hasCloudflareAccountId: !!apiKeys.cloudflareAccountId,
        hasCloudflareApiToken: !!apiKeys.cloudflareApiToken,
        // Don't return actual keys in GET for security
      },
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch API keys',
    }, { status: 500 });
  }
}


