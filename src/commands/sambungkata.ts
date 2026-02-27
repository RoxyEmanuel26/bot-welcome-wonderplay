import { SlashCommandBuilder, EmbedBuilder, CommandInteraction, ChatInputCommandInteraction, Message, Guild, TextChannel, GuildMember, User } from 'discord.js';
import gameManager from '../games/GameManager.js';

export default {
    name: 'sambungkata',
    aliases: ['sk', 'sw', 'wordchain'],
    description: 'Mulai game Sambung Kata',
    data: new SlashCommandBuilder()
        .setName('sambungkata')
        .setDescription('Mulai game Sambung Kata')
        .addIntegerOption(option =>
            option.setName('level')
                .setDescription('Pilih level kesulitan (1-5)')
                .setRequired(true)
                .addChoices(
                    { name: 'Level 1 - Pemula', value: 1 },
                    { name: 'Level 2 - Mudah', value: 2 },
                    { name: 'Level 3 - Menengah', value: 3 },
                    { name: 'Level 4 - Sulit', value: 4 },
                    { name: 'Level 5 - Brutal', value: 5 }
                )
        ),

    async execute(interactionOrMessage: ChatInputCommandInteraction | Message, args?: string[], client?: any) {
        const isSlash = 'isCommand' in interactionOrMessage && interactionOrMessage.isCommand();

        const guild = interactionOrMessage.guild as Guild;
        const channel = interactionOrMessage.channel as TextChannel;
        const member = interactionOrMessage.member as GuildMember;
        let user: User;

        if (isSlash) {
            user = (interactionOrMessage as ChatInputCommandInteraction).user;
        } else {
            user = (interactionOrMessage as Message).author;
        }

        let level = 1;

        if (isSlash) {
            const interaction = interactionOrMessage as ChatInputCommandInteraction;
            level = interaction.options.getInteger('level') || 1;
            await interaction.deferReply();
        } else {
            if (!args || args.length === 0) {
                const embed = new EmbedBuilder()
                    .setColor('Yellow')
                    .setDescription('⚠️ Kamu harus memasukkan level!\n\n**Cara pakai:** `!sk <level>`\nContoh: `!sk 1`, `!sk 3`, `!sk 5`\n\n**Level tersedia:**\n1️⃣ Pemula | 2️⃣ Mudah | 3️⃣ Menengah | 4️⃣ Sulit | 5️⃣ Brutal');
                return (interactionOrMessage as Message).reply({ embeds: [embed] });
            }
            level = parseInt(args[0]);
            if (!level || isNaN(level) || level < 1 || level > 5) {
                const embed = new EmbedBuilder().setColor('Red').setDescription('❌ Level tidak valid! Pilih level 1-5.\n\nContoh: `!sk 1`, `!sk 3`, `!sk 5`');
                return (interactionOrMessage as Message).reply({ embeds: [embed] });
            }
        }

        // Cek jika user sudah ada di dalam game lain
        if (gameManager.isUserInGame(member.id, guild.id)) {
            const errEmbed = new EmbedBuilder().setColor('Red').setDescription('❌ Kamu masih berada di dalam game aktif lain!');
            if (isSlash) {
                return (interactionOrMessage as ChatInputCommandInteraction).editReply({ embeds: [errEmbed] });
            } else {
                return (interactionOrMessage as Message).reply({ embeds: [errEmbed] });
            }
        }

        const game = gameManager.createGame(guild, channel, member, level);

        if (!game) {
            const errEmbed = new EmbedBuilder().setColor('Red').setDescription('❌ Sudah ada game Sambung Kata yang aktif di channel ini!');
            if (isSlash) {
                return (interactionOrMessage as ChatInputCommandInteraction).editReply({ embeds: [errEmbed] });
            } else {
                return (interactionOrMessage as Message).reply({ embeds: [errEmbed] });
            }
        }

        if (isSlash) {
            await (interactionOrMessage as ChatInputCommandInteraction).deleteReply().catch(() => { });
        } else {
            await (interactionOrMessage as Message).delete().catch(() => { });
        }

        await game.startLobby(channel);
    }
};
