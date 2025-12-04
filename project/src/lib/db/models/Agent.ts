/**
 * Agent MongoDB Model
 */

import mongoose, { Schema, Document } from 'mongoose';
import { AgentMetadata } from '@/types/agent';
import { UserModuleSelection } from '@/types/module';

export interface IAgent extends Document {
  walletAddress: string;
  name: string;
  description?: string;
  tags?: string[];
  modules: UserModuleSelection[];
  workflow?: any;
  agentChatURL?: string;
  status: 'draft' | 'deployed' | 'archived';
  apiKeys?: {
    llmKey?: string;
    cloudflareKey?: string;
    [key: string]: string | undefined;
  };
  createdAt: Date;
  updatedAt: Date;
  deployedAt?: Date;
}

const AgentSchema = new Schema<IAgent>(
  {
    walletAddress: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    tags: {
      type: [String],
      default: [],
    },
    modules: {
      type: [
        {
          moduleName: { type: String, required: true },
          input: { type: Schema.Types.Mixed, default: {} },
          order: { type: Number },
        },
      ],
      default: [],
    },
    workflow: {
      type: Schema.Types.Mixed,
    },
    agentChatURL: {
      type: String,
    },
    status: {
      type: String,
      enum: ['draft', 'deployed', 'archived'],
      default: 'draft',
    },
    apiKeys: {
      type: {
        llmKey: String,
        cloudflareKey: String,
      },
      default: {},
    },
    deployedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for faster queries
AgentSchema.index({ walletAddress: 1, status: 1 });
AgentSchema.index({ walletAddress: 1, createdAt: -1 });

export default mongoose.models.Agent || mongoose.model<IAgent>('Agent', AgentSchema);

