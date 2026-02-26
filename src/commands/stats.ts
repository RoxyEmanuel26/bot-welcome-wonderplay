import { checkPermissions, createPermissionEmbed } from '../utils/permissions.js';
import { PermissionFlagsBits, Message, Client, EmbedBuilder } from 'discord.js';
import { getStats } from '../utils/statsManager.js';
import { getMessagesCount } from '../utils/messageLoader.js';

export default {
  name: 'stats',
  description: 'Lihat statistik bot (Admin/Owner only)',
  permissions: [PermissionFlagsBits.Administrator],

  async execute(message: Message, args: string[], client: Client) {
    // Permission check requires permissions array from the command itself
    const permCheck = checkPermissions(message, [PermissionFlagsBits.Administrator]);

    if (!permCheck.allowed) {
      const permsEmbed = createPermissionEmbed(['Administrator', 'Server Owner']);
      // createPermissionEmbed likely returns an EmbedBuilder or object, wrap it properly if needed based on what it actually returns.
      return message.reply({ embeds: [permsEmbed as any] });
    }

    const stats = getStats();
    const messagesCount = getMessagesCount();

    const embed = new EmbedBuilder()
      .setColor(0xFF1493)
      .setTitle('📊 WonderPlay Bot Statistics')
      .addFields([
        { name: '👥 Total Members', value: `${client.guilds.cache.reduce((a, g) => a + g.memberCount, 0)}`, inline: true },
        { name: '👋 Welcomes Sent', value: `${stats.totalWelcomes}`, inline: true },
        { name: '📨 Messages Pool', value: `${messagesCount}`, inline: true },
        { name: '🎯 Servers', value: `${client.guilds.cache.size}`, inline: true },
        { name: '⏰ Last Welcome', value: stats.lastWelcome || 'Never', inline: false }
      ])
      .setFooter({ text: `Requested by ${message.author.tag}` })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
    console.log(`📊 Stats viewed by ${message.author.tag} [${permCheck.role}]`);
  }
};
