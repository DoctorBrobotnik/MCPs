import { Client, ChannelType } from 'discord.js';
import { ListChannelsSchema } from '../utils/validators.js';
import { formatError } from '../utils/formatters.js';

export const listChannels = {
  name: 'discord_list_channels',
  description: 'List all accessible Discord channels, optionally filtered by server',
  schema: ListChannelsSchema,

  async handler(client: Client, params: any) {
    try {
      const { server } = ListChannelsSchema.parse(params);

      const channelList: Array<{
        server: string;
        serverId: string;
        channels: Array<{ name: string; id: string }>;
      }> = [];

      if (server) {
        // List channels from specific server
        const guild = await client.guilds.fetch(server);
        const channels = await guild.channels.fetch();

        const textChannels = channels
          .filter(ch => ch && ch.type === ChannelType.GuildText)
          .map(ch => ({ name: ch!.name, id: ch!.id }));

        channelList.push({
          server: guild.name,
          serverId: guild.id,
          channels: textChannels
        });
      } else {
        // List channels from all servers
        for (const guild of client.guilds.cache.values()) {
          const channels = await guild.channels.fetch();

          const textChannels = channels
            .filter(ch => ch && ch.type === ChannelType.GuildText)
            .map(ch => ({ name: ch!.name, id: ch!.id }));

          if (textChannels.length > 0) {
            channelList.push({
              server: guild.name,
              serverId: guild.id,
              channels: textChannels
            });
          }
        }
      }

      return JSON.stringify(channelList, null, 2);
    } catch (error) {
      return formatError(error);
    }
  }
};
