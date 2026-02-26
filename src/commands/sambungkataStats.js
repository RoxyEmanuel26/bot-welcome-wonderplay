import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import Player from '../database/models/Player.js';

export default {
    name: 'skstats',
    aliases: ['sstats', 'sambungkatastats'],
    description: 'Lihat statistik game Sambung Kata',
    data: new SlashCommandBuilder()
        .setName('skstats')
        .setDescription('Lihat statistik game Sambung Kata')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User yang ingin dilihat')
                .setRequired(false)
        ),

    async execute(interactionOrMessage, args, client) {
        const isSlash = interactionOrMessage.isCommand && interactionOrMessage.isCommand();

        let targetUser;

        if (isSlash) {
            targetUser = interactionOrMessage.options.getUser('user') || interactionOrMessage.user;
            await interactionOrMessage.deferReply();
        } else {
            targetUser = interactionOrMessage.mentions.users.first() || interactionOrMessage.author;
        }

        const playerStats = await Player.findOne({ userId: targetUser.id });

        if (!playerStats) {
            const embed = new EmbedBuilder()
                .setColor('Red')
                .setDescription(`❌ Belum ada data statistik untuk <@${targetUser.id}>`);
            return isSlash ? interactionOrMessage.editReply({ embeds: [embed] }) : interactionOrMessage.reply({ embeds: [embed] });
        }

        const s = playerStats.stats;

        const embed = new EmbedBuilder()
            .setTitle(`📊 Sambung Kata Stats - ${targetUser.username}`)
            .setColor('Blue')
            .setThumbnail(targetUser.displayAvatarURL())
            .addFields(
                { name: '🎮 Total Games', value: `${s.totalGames}`, inline: true },
                { name: '🏆 Total Wins', value: `${s.totalWins}`, inline: true },
                { name: '💰 Total Points', value: `${s.totalPoints}`, inline: true },
                { name: '✅ Benar', value: `${s.totalCorrect}`, inline: true },
                { name: '❌ Salah', value: `${s.totalWrong}`, inline: true },
                { name: '🔥 Longest Streak', value: `${s.longestStreak}`, inline: true }
            );

        if (s.fastestAnswer !== null) {
            embed.addFields({ name: '⚡ Fastest Answer', value: `${s.fastestAnswer}s`, inline: true });
        }

        return isSlash ? interactionOrMessage.editReply({ embeds: [embed] }) : interactionOrMessage.reply({ embeds: [embed] });
    }
};
