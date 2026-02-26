import { Message, Client, TextChannel, GuildMember, PermissionFlagsBits } from 'discord.js';
import { sendWelcomeMessage } from '../utils/welcomeHandler.js';

export default {
    name: 'welcome',
    aliases: ['w', 'greet'],
    description: 'Kirim welcome message ke user tertentu',
    usage: '!welcome @user [#channel]',
    permissions: ['ManageGuild'],

    async execute(message: Message, args: string[], client: Client) {
        try {
            if (!message.guild || !message.member) {
                return message.reply('❌ Command ini hanya bisa digunakan di server!');
            }

            // Cek permission
            if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
                return message.reply('❌ Kamu tidak punya permission untuk menggunakan command ini!');
            }

            // Get mentioned user
            const targetUser = message.mentions.users.first();

            if (!targetUser) {
                return message.reply({
                    content: '❌ Kamu harus mention user!\n\n**Cara pakai:**\n```!welcome @username```\n```!welcome @username #channel```',
                    allowedMentions: { repliedUser: false }
                });
            }

            const targetMember = message.guild.members.cache.get(targetUser.id);

            if (!targetMember) {
                return message.reply('❌ User tidak ditemukan di server ini!');
            }

            // Get channel - PRIORITAS:
            // 1. Channel yang di-mention user (kalau ada)
            // 2. WELCOME_CHANNEL_ID dari .env (default)
            // 3. Channel dimana command diketik (fallback)
            let targetChannel = message.mentions.channels.first() as TextChannel | undefined;

            if (!targetChannel) {
                const welcomeChannelId = process.env.WELCOME_CHANNEL_ID;

                if (welcomeChannelId) {
                    targetChannel = message.guild.channels.cache.get(welcomeChannelId) as TextChannel | undefined;

                    if (!targetChannel) {
                        return message.reply('⚠️ WELCOME_CHANNEL_ID di .env tidak valid! Channel tidak ditemukan.');
                    }
                } else {
                    // Fallback ke channel saat ini kalau WELCOME_CHANNEL_ID tidak diset
                    targetChannel = message.channel as TextChannel;
                }
            }

            if (!targetChannel) {
                return message.reply('⚠️ Channel tidak valid!');
            }

            // Kirim welcome message
            await sendWelcomeMessage(targetMember, targetChannel);

            // Reply sukses
            await message.react('✅');
            await message.reply({
                content: `✅ Welcome message berhasil dikirim ke ${targetUser} di ${targetChannel}!`,
                allowedMentions: { repliedUser: false }
            });

        } catch (error) {
            console.error('❌ Error executing !welcome:', error);
            await message.reply('❌ Terjadi error saat mengirim welcome message!');
        }
    }
};
