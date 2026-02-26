import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
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

    async execute(interactionOrMessage, args, client) {
        const isSlash = interactionOrMessage.isCommand && interactionOrMessage.isCommand();
        const guild = interactionOrMessage.guild;
        const channel = interactionOrMessage.channel;
        const member = interactionOrMessage.member;

        let level = 1;

        if (isSlash) {
            level = interactionOrMessage.options.getInteger('level');
            await interactionOrMessage.deferReply();
        } else {
            if (args && args.length > 0) {
                level = parseInt(args[0]);
            }
            if (!level || isNaN(level) || level < 1 || level > 5) {
                const embed = new EmbedBuilder().setColor('Red').setDescription('❌ Level tidak valid! Pilih level 1-5.');
                return interactionOrMessage.reply({ embeds: [embed] });
            }
        }

        // Cek jika user sudah ada di dalam game lain
        if (gameManager.isUserInGame(member.id, guild.id)) {
            const errEmbed = new EmbedBuilder().setColor('Red').setDescription('❌ Kamu masih berada di dalam game aktif lain!');
            return isSlash ? interactionOrMessage.editReply({ embeds: [errEmbed] }) : interactionOrMessage.reply({ embeds: [errEmbed] });
        }

        const game = gameManager.createGame(guild, channel, member, level);

        if (!game) {
            const errEmbed = new EmbedBuilder().setColor('Red').setDescription('❌ Sudah ada game Sambung Kata yang aktif di channel ini!');
            return isSlash ? interactionOrMessage.editReply({ embeds: [errEmbed] }) : interactionOrMessage.reply({ embeds: [errEmbed] });
        }

        if (isSlash) {
            await interactionOrMessage.deleteReply().catch(() => { });
        } else {
            await interactionOrMessage.delete().catch(() => { });
        }

        await game.startLobby(channel);
    }
};
