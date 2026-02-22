import { checkPermissions, createPermissionEmbed } from '../utils/permissions.js';
import { PermissionFlagsBits } from 'discord.js';
import { getStats } from '../utils/statsManager.js';
import { getMessagesCount } from '../utils/messageLoader.js';

export default {
  name: 'stats',
  description: 'Lihat statistik bot (Admin/Owner only)',
  permissions: [PermissionFlagsBits.Administrator],

  async execute(message, args, client) {
    const permCheck = checkPermissions(message, this.permissions);

    if (!permCheck.allowed) {
      return message.reply(createPermissionEmbed(['Administrator', 'Server Owner']));
    }

    const stats = getStats();
    const messagesCount = getMessagesCount();

    const statsEmbed = {
      embeds: [{
        color: 0xFF1493,
        title: '📊 WonderPlay Bot Statistics',
        fields: [
          { name: '👥 Total Members', value: `${client.guilds.cache.reduce((a, g) => a + g.memberCount, 0)}`, inline: true },
          { name: '👋 Welcomes Sent', value: `${stats.totalWelcomes}`, inline: true },
          { name: '📨 Messages Pool', value: `${messagesCount}`, inline: true },
          { name: '🎯 Servers', value: `${client.guilds.cache.size}`, inline: true },
          { name: '⏰ Last Welcome', value: stats.lastWelcome || 'Never', inline: false }
        ],
        footer: { text: `Requested by ${message.author.tag}` },
        timestamp: new Date().toISOString()
      }]
    };

    await message.reply(statsEmbed);
    console.log(`📊 Stats viewed by ${message.author.tag} [${permCheck.role}]`);
  }
};
