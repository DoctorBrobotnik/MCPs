import { Client } from 'discord.js';
import { SearchMessagesSchema } from '../utils/validators.js';
import { findChannel } from '../utils/channel-lookup.js';
import { formatMessages, formatError } from '../utils/formatters.js';

export const searchMessages = {
  name: 'discord_search_messages',
  description: 'Search for messages containing specific text in a Discord channel',
  schema: SearchMessagesSchema,

  async handler(client: Client, params: any) {
    try {
      const { channel: channelIdentifier, query, limit = 50, server } = SearchMessagesSchema.parse(params);

      // Find the target channel
      const channel = await findChannel(client, channelIdentifier, server);

      // Fetch message history
      const messages = await channel.messages.fetch({ limit });

      // Filter messages containing the query (case-insensitive)
      const searchQuery = query.toLowerCase();
      const matchingMessages = Array.from(messages.values())
        .filter(msg => msg.content.toLowerCase().includes(searchQuery))
        .reverse(); // Chronological order

      if (matchingMessages.length === 0) {
        return `ℹ️ No messages found containing "${query}" in #${channel.name}`;
      }

      // Return formatted JSON
      return formatMessages(matchingMessages);
    } catch (error) {
      return formatError(error);
    }
  }
};
