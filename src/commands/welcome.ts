import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, GuildMember, TextChannel } from 'discord.js';
import { sendWelcomeMessage } from '../utils/welcomeHandler.js';

export default {
    name: 'welcome',

    data: new SlashCommandBuilder()
        .setName('welcome')
        .setDescription('Kirim welcome message ke user tertentu')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('User yang mau di-welcome')
                .setRequired(true)
        )
        .addChannelOption(option =>
            option
                .setName('channel')
                .setDescription('Channel tujuan (opsional, default: WELCOME_CHANNEL_ID)')
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction: ChatInputCommandInteraction) {
        try {
            if (!interaction.guild) {
                return interaction.reply({
                    content: '❌ Command ini hanya bisa digunakan di server!',
                    ephemeral: true
                });
            }

            // Get user yang di-mention
            const targetUser = interaction.options.getUser('user');
            if (!targetUser) {
                return interaction.reply({
                    content: '❌ User tidak valid!',
                    ephemeral: true
                });
            }

            const targetMember = interaction.guild.members.cache.get(targetUser.id);

            if (!targetMember) {
                return interaction.reply({
                    content: '❌ User tidak ditemukan di server ini!',
                    ephemeral: true
                });
            }

            // Get channel - PRIORITAS:
            // 1. Channel yang dipilih user di option (kalau ada)
            // 2. WELCOME_CHANNEL_ID dari .env (default)
            // 3. Channel dimana command diketik (fallback)
            let targetChannel = interaction.options.getChannel('channel') as TextChannel | null;

            if (!targetChannel) {
                const welcomeChannelId = process.env.WELCOME_CHANNEL_ID;

                if (welcomeChannelId) {
                    targetChannel = interaction.guild.channels.cache.get(welcomeChannelId) as TextChannel | undefined || null;

                    if (!targetChannel) {
                        return interaction.reply({
                            content: '⚠️ WELCOME_CHANNEL_ID di .env tidak valid! Channel tidak ditemukan.',
                            ephemeral: true
                        });
                    }
                } else {
                    // Fallback ke channel saat ini kalau WELCOME_CHANNEL_ID tidak diset
                    targetChannel = interaction.channel as TextChannel | null;
                }
            }

            if (!targetChannel) {
                return interaction.reply({
                    content: '⚠️ Channel tidak valid!',
                    ephemeral: true
                });
            }

            // Kirim welcome message
            await sendWelcomeMessage(targetMember, targetChannel);

            // Reply sukses
            await interaction.reply({
                content: `✅ Welcome message berhasil dikirim ke ${targetUser} di ${targetChannel}!`,
                ephemeral: true
            });

        } catch (error) {
            console.error('❌ Error executing /welcome:', error);
            await interaction.reply({
                content: '❌ Terjadi error saat mengirim welcome message!',
                ephemeral: true
            });
        }
    }
};
