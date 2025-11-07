import { Message } from 'discord.js';

export interface FormattedMessage {
  author: string;
  content: string;
  timestamp: string;
  channel: string;
  server: string;
  messageId: string;
}

/**
 * Format a Discord message for JSON output
 */
export function formatMessage(message: Message): FormattedMessage {
  return {
    author: message.author.tag,
    content: message.content,
    timestamp: message.createdAt.toISOString(),
    channel: `#${message.channel.isDMBased() ? 'DM' : (message.channel as any).name}`,
    server: message.guild?.name || 'Direct Message',
    messageId: message.id
  };
}

/**
 * Format multiple messages as JSON string
 */
export function formatMessages(messages: Message[]): string {
  return JSON.stringify(messages.map(formatMessage), null, 2);
}

/**
 * Format error message with emoji
 */
export function formatError(error: any): string {
  const message = error instanceof Error ? error.message : String(error);
  return `❌ Error: ${message}`;
}

/**
 * Format success message with emoji
 */
export function formatSuccess(message: string): string {
  return `✅ ${message}`;
}

/**
 * Format info message with emoji
 */
export function formatInfo(message: string): string {
  return `ℹ️ ${message}`;
}
