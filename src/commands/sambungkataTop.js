import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import Player from '../database/models/Player.js';

export default {
    name: 'sktop',
    aliases: ['sambungkatatop', 'sambungkataleaderboard'],
    description: 'Top 10 Pemain Sambung Kata Terhebat',
    data: new SlashCommandBuilder()
        .setName('sambungkataleaderboard')
        .setDescription('Top 10 Pemain Sambung Kata Terhebat'),

    async execute(interactionOrMessage, args, client) {
        const isSlash = interactionOrMessage.isCommand && interactionOrMessage.isCommand();

        if (isSlash) {
            await interactionOrMessage.deferReply();
        }

        const topPlayers = await Player.find()
            .sort({ 'stats.totalPoints': -1 })
            .limit(10);

        const embed = new EmbedBuilder()
            .setTitle('🏆 LEADERBOARD SAMBUNG KATA 🏆')
            .setColor('Gold')
            .setDescription('Top 10 Pemain dengan poin terbanyak!');

        if (topPlayers.length === 0) {
            embed.setDescription('Belum ada pemain yang masuk ke leaderboard.');
        } else {
            const leaderboardText = topPlayers.map((p, i) => {
                const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `**#${i + 1}**`;
                return `${medal} <@${p.userId}> - **${p.stats.totalPoints} pts** (👑 ${p.stats.totalWins} Wins)`;
            }).join('\n\n');
            embed.addFields({ name: 'Top Players', value: leaderboardText });
        }

        return isSlash ? interactionOrMessage.editReply({ embeds: [embed] }) : interactionOrMessage.reply({ embeds: [embed] });
    }
};
