import { Client, TextChannel, ChannelType } from 'discord.js';

/**
 * Find a Discord text channel by ID or name
 * Two-phase lookup: tries ID first, then falls back to name-based search
 */
export async function findChannel(
  client: Client,
  channelIdentifier: string,
  guildId?: string
): Promise<TextChannel> {
  // Phase 1: Try direct ID fetch if identifier looks like a Discord ID
  if (/^\d+$/.test(channelIdentifier)) {
    try {
      const channel = await client.channels.fetch(channelIdentifier);
      if (channel && channel.type === ChannelType.GuildText) {
        // If guild specified, verify channel belongs to that guild
        if (guildId && channel.guildId !== guildId) {
          throw new Error(`Channel ${channelIdentifier} does not belong to the specified server`);
        }
        return channel as TextChannel;
      }
    } catch (error: any) {
      // If not found by ID, continue to name-based search
      if (error.code !== 10003) { // 10003 = Unknown Channel
        throw error;
      }
    }
  }

  // Phase 2: Name-based search
  const searchName = channelIdentifier.replace(/^#/, '').toLowerCase();
  const matches: TextChannel[] = [];

  if (guildId) {
    // Search within specific guild
    const guild = await client.guilds.fetch(guildId);
    const channels = await guild.channels.fetch();

    channels.forEach((channel) => {
      if (
        channel &&
        channel.type === ChannelType.GuildText &&
        channel.name.toLowerCase() === searchName
      ) {
        matches.push(channel as TextChannel);
      }
    });
  } else {
    // Search across all guilds bot has access to
    for (const guild of client.guilds.cache.values()) {
      const channels = await guild.channels.fetch();
      channels.forEach((channel) => {
        if (
          channel &&
          channel.type === ChannelType.GuildText &&
          channel.name.toLowerCase() === searchName
        ) {
          matches.push(channel as TextChannel);
        }
      });
    }
  }

  if (matches.length === 0) {
    // Provide helpful error with available channels
    if (guildId) {
      const guild = await client.guilds.fetch(guildId);
      const channelNames = (await guild.channels.fetch())
        .filter(ch => ch && ch.type === ChannelType.GuildText)
        .map(ch => `#${ch!.name}`)
        .join(', ');
      throw new Error(
        `Channel '${channelIdentifier}' not found in server '${guild.name}'. Available channels: ${channelNames}`
      );
    } else {
      throw new Error(
        `Channel '${channelIdentifier}' not found. Use channel ID or exact channel name (with or without #)`
      );
    }
  }

  if (matches.length > 1) {
    const channelList = matches
      .map(ch => `#${ch.name} (${ch.guild.name}, ID: ${ch.id})`)
      .join(', ');
    throw new Error(
      `Multiple channels named '${channelIdentifier}' found: ${channelList}. Please specify server ID or use channel ID.`
    );
  }

  return matches[0];
}

/**
 * Find a Discord guild by ID or name
 */
export async function findGuild(client: Client, guildIdentifier: string) {
  // Try direct ID fetch
  if (/^\d+$/.test(guildIdentifier)) {
    try {
      return await client.guilds.fetch(guildIdentifier);
    } catch (error: any) {
      if (error.code !== 10004) { // 10004 = Unknown Guild
        throw error;
      }
    }
  }

  // Name-based search
  const searchName = guildIdentifier.toLowerCase();
  const matches = client.guilds.cache.filter(
    guild => guild.name.toLowerCase() === searchName
  );

  if (matches.size === 0) {
    const guildNames = client.guilds.cache.map(g => g.name).join(', ');
    throw new Error(
      `Server '${guildIdentifier}' not found. Available servers: ${guildNames}`
    );
  }

  if (matches.size > 1) {
    const guildList = matches.map(g => `${g.name} (ID: ${g.id})`).join(', ');
    throw new Error(
      `Multiple servers named '${guildIdentifier}' found: ${guildList}. Please use server ID.`
    );
  }

  return matches.first()!;
}
