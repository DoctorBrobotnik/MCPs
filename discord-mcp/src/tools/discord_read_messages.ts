import { Client } from 'discord.js';
import { ReadMessagesSchema } from '../utils/validators.js';
import { findChannel } from '../utils/channel-lookup.js';
import { formatMessages, formatError } from '../utils/formatters.js';

export const readMessages = {
  name: 'discord_read_messages',
  description: 'Read message history from a Discord channel',
  schema: ReadMessagesSchema,

  async handler(client: Client, params: any) {
    try {
      const { channel: channelIdentifier, limit = 50, server } = ReadMessagesSchema.parse(params);

      // Find the target channel
      const channel = await findChannel(client, channelIdentifier, server);

      // Fetch message history
      const messages = await channel.messages.fetch({ limit });

      // Convert to array and reverse to get chronological order (oldest first)
      const messageArray = Array.from(messages.values()).reverse();

      // Return formatted JSON
      return formatMessages(messageArray);
    } catch (error) {
      return formatError(error);
    }
  }
};
