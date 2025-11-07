import { z } from 'zod';

/**
 * Common Zod schemas for tool validation
 */

export const SendMessageSchema = z.object({
  channel: z.string().describe('Channel ID or name (e.g., "general" or "123456789")'),
  message: z.string().min(1).describe('Message content to send'),
  server: z.string().optional().describe('Server/guild ID (optional, helps disambiguate channel names)')
});

export const ReadMessagesSchema = z.object({
  channel: z.string().describe('Channel ID or name to read from'),
  limit: z.number().min(1).max(100).default(50).describe('Number of messages to retrieve (1-100, default 50)'),
  server: z.string().optional().describe('Server/guild ID (optional)')
});

export const ListChannelsSchema = z.object({
  server: z.string().optional().describe('Server/guild ID to list channels from (optional, lists all if omitted)')
});

export const ListServersSchema = z.object({});

export const SearchMessagesSchema = z.object({
  channel: z.string().describe('Channel ID or name to search in'),
  query: z.string().min(1).describe('Search query text'),
  limit: z.number().min(1).max(100).default(50).describe('Maximum number of messages to search (1-100, default 50)'),
  server: z.string().optional().describe('Server/guild ID (optional)')
});
