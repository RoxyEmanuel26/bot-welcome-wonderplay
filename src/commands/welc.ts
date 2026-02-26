import { sendWelcomeMessage } from '../utils/welcomeHandler.js';
import { checkPermissions, createPermissionEmbed } from '../utils/permissions.js';
import { PermissionFlagsBits, Message, Client, TextChannel, GuildMember } from 'discord.js';

export default {
  name: 'welc',
  aliases: ['wt', 'test', 'welc'],
  description: 'Test welcome message (Admin/Owner only)',
  permissions: [PermissionFlagsBits.Administrator],

  async execute(message: Message, args: string[], client: Client) {
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

    if (!message.guild) {
      return message.reply('⚠️ Command ini hanya bisa digunakan di server!');
    }

    const channel = message.guild.channels.cache.get(channelId) as TextChannel | undefined;
    if (!channel) {
      return message.reply('⚠️ Channel welcome tidak ditemukan!');
    }

    await message.react('✅');
    if (message.member) {
      await sendWelcomeMessage(message.member as GuildMember, channel);
    }

    console.log(`🔐 !welc by ${message.author.tag} [${permCheck.role}]`);
  }
};
