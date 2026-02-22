import { sendWelcomeMessage } from '../utils/welcomeHandler.js';
import { checkPermissions, createPermissionEmbed } from '../utils/permissions.js';
import { PermissionFlagsBits } from 'discord.js';

export default {
  name: 'welc',
  aliases: ['wt', 'test', 'welc'],
  description: 'Test welcome message (Admin/Owner only)',
  permissions: [PermissionFlagsBits.Administrator],
  
  async execute(message, args, client) {
    // Permission check
    const permCheck = checkPermissions(message, this.permissions);
    
    if (!permCheck.allowed) {
      return message.reply(createPermissionEmbed(['Administrator', 'Server Owner', 'Bot Owner']));
    }

    // Execute command
    const channelId = process.env.WELCOME_CHANNEL_ID;
    if (!channelId) {
      return message.reply('⚠️ WELCOME_CHANNEL_ID belum di-set di .env!');
    }

    const channel = message.guild.channels.cache.get(channelId);
    if (!channel) {
      return message.reply('⚠️ Channel welcome tidak ditemukan!');
    }

    await message.react('✅');
    await sendWelcomeMessage(message.member, channel);
    
    console.log(`🔐 !welc by ${message.author.tag} [${permCheck.role}]`);
  }
};
