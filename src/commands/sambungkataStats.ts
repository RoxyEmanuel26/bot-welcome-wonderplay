import { SlashCommandBuilder, EmbedBuilder, CommandInteraction, ChatInputCommandInteraction, Message, Guild, User } from 'discord.js';
import Player from '../database/models/Player.js';
import { getUserPoints, getPlayerRank, getPointsByGame } from '../utils/pointsManager.js';

export default {
    name: 'skstats',
    aliases: ['sstats', 'sambungkatastats'],
    description: 'Lihat statistik game gabungan WonderPlay × Academy Drix',
    data: new SlashCommandBuilder()
        .setName('skstats')
        .setDescription('Lihat statistik game gabungan WonderPlay × Academy Drix')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User yang ingin dilihat')
                .setRequired(false)
        ),

    async execute(interactionOrMessage: ChatInputCommandInteraction | Message, args?: string[], client?: any) {
        const isSlash = 'isCommand' in interactionOrMessage && interactionOrMessage.isCommand();
        const guild = interactionOrMessage.guild as Guild;
        let targetUser: User;

        if (isSlash) {
            const interaction = interactionOrMessage as ChatInputCommandInteraction;
            targetUser = interaction.options.getUser('user') || interaction.user;
            await interaction.deferReply();
        } else {
            const message = interactionOrMessage as Message;
            targetUser = message.mentions.users.first() || message.author;
        }

        // Ambil data gabungan dari shared DB
        const sharedPoints = await getUserPoints(guild.id, targetUser.id);
        const rankInfo = await getPlayerRank(guild.id, targetUser.id);

        // Ambil data spesifik per game dari history shared DB
        const quizStats = await getPointsByGame(guild.id, targetUser.id, 'quiz');
        const guessMapStats = await getPointsByGame(guild.id, targetUser.id, 'guess_map');
        const skStatsShared = await getPointsByGame(guild.id, targetUser.id, 'sambung_kata');

        // Ambil statistik detail spesifik dari Player.js (khusus sambung kata)
        const playerStats = await Player.findOne({ userId: targetUser.id });

        if (!sharedPoints && !playerStats) {
            const embed = new EmbedBuilder()
                .setColor('Red')
                .setDescription(`❌ Belum ada data statistik untuk <@${targetUser.id}>`);
            if (isSlash) {
                return (interactionOrMessage as ChatInputCommandInteraction).editReply({ embeds: [embed] });
            } else {
                return (interactionOrMessage as Message).reply({ embeds: [embed] });
            }
        }

        const totalPts = sharedPoints ? sharedPoints.totalPoints : 0;
        const weeklyPts = sharedPoints ? sharedPoints.weeklyPoints : 0;
        const monthlyPts = sharedPoints ? sharedPoints.monthlyPoints : 0;
        const currentStreak = sharedPoints ? sharedPoints.currentStreak : 0;
        const longestStreak = sharedPoints ? sharedPoints.longestStreak : 0;

        // Info SK detail
        const skPlayed = playerStats ? playerStats.stats.totalGames : (skStatsShared && skStatsShared.historyCount ? skStatsShared.historyCount : 0);

        const embed = new EmbedBuilder()
            .setTitle(`📊 Stats - ${targetUser.username}`)
            .setColor('Blue')
            .setThumbnail(targetUser.displayAvatarURL())
            .addFields(
                {
                    name: '💎 Total Points (Semua Game)',
                    value: `${totalPts} point | Rank #${rankInfo && rankInfo.rank > 0 ? rankInfo.rank : '-'} dari ${rankInfo ? rankInfo.total : 0} member`,
                    inline: false
                },
                {
                    name: '📅 Weekly / Monthly',
                    value: `${weeklyPts} pt minggu ini | ${monthlyPts} pt bulan ini`,
                    inline: false
                },
                {
                    name: '🎮 Sambung Kata',
                    value: `Point: ${skStatsShared ? skStatsShared.totalFromGame : 0} | Main: ${skPlayed}`,
                    inline: true
                },
                {
                    name: '🎯 Quiz (Academy Drix)',
                    value: `Point: ${quizStats ? quizStats.totalFromGame : 0} | Main: ${quizStats ? quizStats.historyCount : 0}`,
                    inline: true
                },
                {
                    name: '🗺️ Guess Map (Academy Drix)',
                    value: `Point: ${guessMapStats ? guessMapStats.totalFromGame : 0} | Main: ${guessMapStats ? guessMapStats.historyCount : 0}`,
                    inline: true
                },
                {
                    name: '🔥 Streak',
                    value: `Sekarang: ${currentStreak}x | Terpanjang: ${longestStreak}x`,
                    inline: false
                }
            )
            .setFooter({ text: "WonderPlay × Academy Drix Valorant • Shared Database" });

        if (isSlash) {
            return (interactionOrMessage as ChatInputCommandInteraction).editReply({ embeds: [embed] });
        } else {
            return (interactionOrMessage as Message).reply({ embeds: [embed] });
        }
    }
};
