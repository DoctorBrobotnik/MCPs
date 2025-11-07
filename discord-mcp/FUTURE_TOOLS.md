# Future Discord MCP Tools (Tier 2-4)

After implementing Tier 1, these 20 additional tools can be added to expand functionality.

---

## Tier 2: Moderation & Management (8 tools)

Essential tools for community management and server safety.

### discord_kick_member
**Purpose**: Remove a member from the server (reversible)

**Parameters**:
- `user_id` (string, required): Discord user ID
- `server` (string, required): Server/guild ID or name
- `reason` (string, optional): Reason for kick

**Discord.js API**: `member.kick(reason)`

**Required Permissions**: Kick Members

**Use Cases**:
- Remove inactive members
- Temporary enforcement (user can rejoin)
- Clean up bot accounts
- Spam management

---

### discord_ban_member
**Purpose**: Ban a user from the server (permanent unless unbanned)

**Parameters**:
- `user_id` (string, required): Discord user ID
- `server` (string, required): Server/guild ID or name
- `reason` (string, optional): Reason for ban
- `delete_message_days` (number, optional): Days of messages to delete (0-7, default 0)

**Discord.js API**: `guild.members.ban(userId, {reason, deleteMessageSeconds})`

**Required Permissions**: Ban Members

**Use Cases**:
- Permanent removal of rule violators
- Spam/bot prevention
- Ban evasion accounts
- Community safety enforcement

---

### discord_mute_member
**Purpose**: Apply timeout to a member (temporary mute)

**Parameters**:
- `user_id` (string, required): Discord user ID
- `server` (string, required): Server/guild ID or name
- `duration_minutes` (number, required): Timeout duration in minutes (1-40320)
- `reason` (string, optional): Reason for mute

**Discord.js API**: `member.timeout(durationMs, reason)`

**Required Permissions**: Moderate Members

**Use Cases**:
- Temporary mute for rule violations
- Cool-down periods
- Spam prevention
- Escalating moderation

---

### discord_edit_message
**Purpose**: Edit content of a previously sent message

**Parameters**:
- `message_id` (string, required): Message ID
- `new_content` (string, required): New message content
- `channel` (string, required): Channel ID or name
- `server` (string, optional): Server/guild ID

**Discord.js API**: `message.edit(newContent)`

**Required Permissions**: Manage Messages (for others' messages) or own message

**Use Cases**:
- Fix bot command responses
- Update dynamic information
- Correct typos in announcements
- Modify automated messages

---

### discord_delete_message
**Purpose**: Remove a message from a channel

**Parameters**:
- `message_id` (string, required): Message ID
- `channel` (string, required): Channel ID or name
- `server` (string, optional): Server/guild ID
- `reason` (string, optional): Reason for deletion

**Discord.js API**: `message.delete()`

**Required Permissions**: Manage Messages

**Use Cases**:
- Remove spam/inappropriate content
- Delete accidental messages
- Clean up commands/responses
- Content moderation

---

### discord_create_role
**Purpose**: Create a new role with customizable settings

**Parameters**:
- `server` (string, required): Server/guild ID or name
- `name` (string, required): Role name
- `color` (string, optional): Hex color code (e.g., "#FF0000")
- `permissions` (array, optional): Array of permission names
- `hoist` (boolean, optional): Display role separately from online users
- `mentionable` (boolean, optional): Allow role to be mentioned

**Discord.js API**: `guild.roles.create({name, color, permissions, hoist, mentionable})`

**Required Permissions**: Manage Roles

**Use Cases**:
- Create new team roles
- Set up permission hierarchies
- Create cosmetic roles
- Automated role management

---

### discord_delete_role
**Purpose**: Remove a role from the server

**Parameters**:
- `role_id` (string, required): Role ID
- `server` (string, required): Server/guild ID or name
- `reason` (string, optional): Reason for deletion

**Discord.js API**: `role.delete(reason)`

**Required Permissions**: Manage Roles

**Use Cases**:
- Clean up unused roles
- Remove obsolete team roles
- Consolidate role structure
- Reset role organization

---

### discord_set_slowmode
**Purpose**: Enable message rate limiting in a channel

**Parameters**:
- `channel` (string, required): Channel ID or name
- `seconds` (number, required): Cooldown between messages (0-21600 seconds, 0 to disable)
- `server` (string, optional): Server/guild ID

**Discord.js API**: `channel.setRateLimitPerUser(seconds)`

**Required Permissions**: Manage Channels

**Use Cases**:
- Prevent spam in announcements
- Reduce message flood during events
- Slow discussions for quality
- Protect bot from rate limiting

---

## Tier 3: Advanced Features (7 tools)

Enhance functionality for power users and advanced operations.

### discord_list_threads
**Purpose**: List active and archived threads in a channel

**Parameters**:
- `channel` (string, required): Channel ID or name
- `server` (string, optional): Server/guild ID
- `archived` (boolean, optional): Include archived threads (default false)

**Discord.js API**: `channel.threads.fetchActive()` or `fetchArchived()`

**Required Permissions**: View Channels, Read Message History

**Use Cases**:
- Monitor active discussions
- Find archived conversations
- Track thread activity
- Bulk operations on threads

---

### discord_archive_thread
**Purpose**: Archive or close a thread conversation

**Parameters**:
- `thread_id` (string, required): Thread ID
- `locked` (boolean, optional): Also lock thread from further messages

**Discord.js API**: `thread.setArchived(true)` and `setLocked(true)`

**Required Permissions**: Manage Threads

**Use Cases**:
- Close resolved discussions
- Archive completed projects
- Clean up thread list
- Mark threads as inactive

---

### discord_create_channel
**Purpose**: Create a new text or voice channel

**Parameters**:
- `server` (string, required): Server/guild ID or name
- `name` (string, required): Channel name
- `type` (string, optional): "text" or "voice" (default "text")
- `topic` (string, optional): Channel topic/description
- `parent` (string, optional): Parent category ID

**Discord.js API**: `guild.channels.create({name, type, topic, parent})`

**Required Permissions**: Manage Channels

**Use Cases**:
- Create new team channels
- Set up event channels
- Organize server structure
- Automated channel provisioning

---

### discord_delete_channel
**Purpose**: Remove a channel from the server

**Parameters**:
- `channel` (string, required): Channel ID or name
- `server` (string, optional): Server/guild ID
- `reason` (string, optional): Reason for deletion

**Discord.js API**: `channel.delete(reason)`

**Required Permissions**: Manage Channels

**Use Cases**:
- Remove unused channels
- Clean up temporary channels
- Reorganize server structure
- Automated cleanup

---

### discord_set_channel_topic
**Purpose**: Update the topic/description of a channel

**Parameters**:
- `channel` (string, required): Channel ID or name
- `topic` (string, required): New topic text (max 1024 chars)
- `server` (string, optional): Server/guild ID

**Discord.js API**: `channel.setTopic(topic)`

**Required Permissions**: Manage Channels

**Use Cases**:
- Update channel purpose
- Add instructions to channels
- Dynamic status messages
- Channel metadata updates

---

### discord_get_channel_info
**Purpose**: Get detailed information about a channel

**Parameters**:
- `channel` (string, required): Channel ID or name
- `server` (string, optional): Server/guild ID

**Discord.js API**: `channel.fetch()` and properties

**Required Permissions**: View Channels

**Return Format**:
```json
{
  "channel_id": "123456789",
  "channel_name": "#general",
  "channel_type": "text",
  "topic": "General discussion",
  "created_at": "2022-01-01T00:00:00Z",
  "parent_category": "Main",
  "slowmode_seconds": 0,
  "member_count": 150,
  "message_count": 5000
}
```

**Use Cases**:
- Get channel metadata
- Check channel permissions
- Verify channel settings
- Channel auditing

---

### discord_lock_channel
**Purpose**: Restrict channel access (prevent message posting)

**Parameters**:
- `channel` (string, required): Channel ID or name
- `server` (string, optional): Server/guild ID

**Discord.js API**: `channel.permissionOverwrites.edit(@everyone, {SendMessages: false})`

**Required Permissions**: Manage Channels, Manage Roles

**Use Cases**:
- Freeze announcements during outages
- Temporarily restrict access
- Emergency lockdown
- Event channel control

---

## Tier 4: Specialized Use Cases (5 tools)

Niche functionality for specific scenarios.

### discord_unlock_channel
**Purpose**: Re-enable posting in a locked channel

**Parameters**:
- `channel` (string, required): Channel ID or name
- `server` (string, optional): Server/guild ID

**Discord.js API**: `channel.permissionOverwrites.edit(@everyone, {SendMessages: null})`

**Required Permissions**: Manage Channels, Manage Roles

**Use Cases**:
- Re-open locked channels
- Resume normal operations
- End emergency restrictions
- Restore channel access

---

### discord_unpin_message
**Purpose**: Remove a message from pinned messages

**Parameters**:
- `message_id` (string, required): Message ID
- `channel` (string, required): Channel ID or name
- `server` (string, optional): Server/guild ID

**Discord.js API**: `message.unpin()`

**Required Permissions**: Manage Messages

**Use Cases**:
- Clean up pinned messages
- Archive old pins
- Make room for new pins
- Manage pin limits

---

### discord_remove_reaction
**Purpose**: Remove emoji reaction from a message

**Parameters**:
- `message_id` (string, required): Message ID
- `emoji` (string, required): Emoji to remove
- `user_id` (string, optional): User ID (omit to remove all)
- `channel` (string, required): Channel ID or name
- `server` (string, optional): Server/guild ID

**Discord.js API**: `message.reactions.cache.get(emoji).remove(userId)`

**Required Permissions**: Manage Messages

**Use Cases**:
- Clean up spam reactions
- Remove inappropriate reactions
- Reset reaction counts
- Manage reaction state

---

### discord_add_member_to_thread
**Purpose**: Invite a specific user to a thread

**Parameters**:
- `thread_id` (string, required): Thread ID
- `user_id` (string, required): Discord user ID

**Discord.js API**: `thread.members.add(userId)`

**Required Permissions**: Send Messages in Threads

**Use Cases**:
- Add users to important discussions
- Notify specific members
- Thread collaboration
- Permission management

---

### discord_get_message_count
**Purpose**: Count messages in a channel (with optional date filter)

**Parameters**:
- `channel` (string, required): Channel ID or name
- `server` (string, optional): Server/guild ID
- `since` (string, optional): ISO date to count from (e.g., "2024-01-01T00:00:00Z")

**Discord.js API**: `channel.messages.fetch()` with filtering

**Required Permissions**: Read Message History

**Return Format**:
```json
{
  "channel": "#general",
  "total_messages": 5000,
  "messages_counted": 100,
  "since": "2024-01-01T00:00:00Z",
  "date_range": "2024-01-01 to 2024-11-07"
}
```

**Use Cases**:
- Channel activity analytics
- Message volume tracking
- Engagement metrics
- Usage reporting

---

## Implementation Priority by Impact

### High Impact (implement early if possible)
1. `discord_kick_member` - Core moderation
2. `discord_ban_member` - Core safety
3. `discord_create_channel` - Server structure
4. `discord_delete_channel` - Cleanup
5. `discord_create_role` - Team management

### Medium Impact (implement next)
6. `discord_mute_member` - Escalating enforcement
7. `discord_edit_message` - Message management
8. `discord_delete_message` - Content moderation
9. `discord_list_threads` - Thread management
10. `discord_archive_thread` - Thread cleanup

### Lower Impact (implement as time allows)
11-20. Remaining specialized tools

---

## Estimated Total Implementation Time

**Tier 2** (8 tools): 3-4 hours
**Tier 3** (7 tools): 3-4 hours
**Tier 4** (5 tools): 1-2 hours

**Total for all 20 tools: 7-10 hours**

Combined with Tier 1 (6 hours), total for all 30 tools: **~13-16 hours**

---

## Notes for Future Implementation

- Many tools share similar patterns (member lookups, channel fetches, role management)
- Helper functions in `channel-lookup.ts` can be reused across all tools
- Moderation tools (Tier 2) will likely trigger audit logs - document this
- Permission hierarchies matter: bots can't manage roles above their highest role
- Rate limiting considerations for bulk operations
- Consider adding batch operations in a future version

