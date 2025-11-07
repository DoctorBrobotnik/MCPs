import { Client } from 'discord.js';
import { ListServersSchema } from '../utils/validators.js';
import { formatError } from '../utils/formatters.js';

export const listServers = {
  name: 'discord_list_servers',
  description: 'List all Discord servers the bot has access to',
  schema: ListServersSchema,

  async handler(client: Client, params: any) {
    try {
      ListServersSchema.parse(params);

      const servers = client.guilds.cache.map(guild => ({
        name: guild.name,
        id: guild.id,
        memberCount: guild.memberCount,
        channelCount: guild.channels.cache.size,
        owner: guild.ownerId
      }));

      return JSON.stringify(servers, null, 2);
    } catch (error) {
      return formatError(error);
    }
  }
};
