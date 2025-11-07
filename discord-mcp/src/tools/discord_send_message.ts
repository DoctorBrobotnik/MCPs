import { Client } from 'discord.js';
import { SendMessageSchema } from '../utils/validators.js';
import { findChannel } from '../utils/channel-lookup.js';
import { formatSuccess, formatError } from '../utils/formatters.js';

export const sendMessage = {
  name: 'discord_send_message',
  description: 'Send a message to a Discord channel',
  schema: SendMessageSchema,

  async handler(client: Client, params: any) {
    try {
      const { channel: channelIdentifier, message, server } = SendMessageSchema.parse(params);

      // Find the target channel
      const channel = await findChannel(client, channelIdentifier, server);

      // Send the message
      const sentMessage = await channel.send(message);

      return formatSuccess(
        `Message sent to #${channel.name} in ${channel.guild.name}\nMessage ID: ${sentMessage.id}`
      );
    } catch (error) {
      return formatError(error);
    }
  }
};
