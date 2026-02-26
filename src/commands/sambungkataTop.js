import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';
import { getLeaderboard } from '../utils/pointsManager.js';

export default {
    name: 'sktop',
    aliases: ['sambungkatatop', 'sambungkataleaderboard'],
    description: 'Top 10 Pemain dari semua game (Quiz + Guess Map + Sambung Kata)',
    data: new SlashCommandBuilder()
        .setName('sktop')
        .setDescription('Top 10 Pemain dari semua game'),

    async execute(interactionOrMessage, args, client) {
        const isSlash = interactionOrMessage.isCommand && interactionOrMessage.isCommand();
        const guild = interactionOrMessage.guild;

        if (isSlash) {
            await interactionOrMessage.deferReply();
        }

        const buildLeaderboardEmbed = async (type = 'total') => {
            const topPlayers = await getLeaderboard(guild.id, 10, type);

            let typeLabel = "Semua Waktu";
            if (type === 'weekly') typeLabel = "Minggu Ini";
            if (type === 'monthly') typeLabel = "Bulan Ini";

            const embed = new EmbedBuilder()
                .setTitle(`🏆 LEADERBOARD WONDERPLAY × ACADEMY DRIX (${typeLabel})`)
                .setColor('Gold')
                .setDescription('Top 10 dari semua game! (Quiz + Guess Map + Sambung Kata)')
                .setFooter({ text: "WonderPlay × Academy Drix • Realtime dari Shared Database" });

            if (topPlayers.length === 0) {
                embed.addFields({ name: 'Leaderboard Kosong', value: 'Belum ada pemain yang mendapatkan point.' });
            } else {
                let valueField = '';
                topPlayers.forEach((p, i) => {
                    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `**#${i + 1}**`;
                    let pts = p.totalPoints;
                    if (type === 'weekly') pts = p.weeklyPoints;
                    if (type === 'monthly') pts = p.monthlyPoints;

                    valueField += `${medal} <@${p.userId}>\n> ${pts} pt | 🎮 ${p.gamesPlayed} main | 🏆 ${p.gamesWon} menang\n\n`;
                });
                embed.addFields({ name: `Top 10 Pemain`, value: valueField });
            }
            return embed;
        };

        const initialEmbed = await buildLeaderboardEmbed('total');

        const filterMenu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('lb_filter')
                .setPlaceholder('Pilih Filter Waktu')
                .addOptions(
                    { label: '🌐 Semua Waktu (Total Points)', value: 'total' },
                    { label: '📅 Minggu Ini (Weekly Points)', value: 'weekly' },
                    { label: '🗓️ Bulan Ini (Monthly Points)', value: 'monthly' }
                )
        );

        const replyMessage = isSlash
            ? await interactionOrMessage.editReply({ embeds: [initialEmbed], components: [filterMenu] })
            : await interactionOrMessage.reply({ embeds: [initialEmbed], components: [filterMenu] });

        // Simple collector for interaction
        const filter = i => i.customId === 'lb_filter' && i.user.id === (isSlash ? interactionOrMessage.user.id : interactionOrMessage.author.id);
        const collector = replyMessage.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async i => {
            await i.deferUpdate();
            const newEmbed = await buildLeaderboardEmbed(i.values[0]);
            await i.editReply({ embeds: [newEmbed], components: [filterMenu] });
        });

        collector.on('end', () => {
            replyMessage.edit({ components: [] }).catch(() => { });
        });
    }
};
