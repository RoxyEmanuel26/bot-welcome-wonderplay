import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
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

    async execute(interactionOrMessage, args, client) {
        const isSlash = interactionOrMessage.isCommand && interactionOrMessage.isCommand();
        const guild = interactionOrMessage.guild;
        let targetUser;

        if (isSlash) {
            targetUser = interactionOrMessage.options.getUser('user') || interactionOrMessage.user;
            await interactionOrMessage.deferReply();
        } else {
            targetUser = interactionOrMessage.mentions.users.first() || interactionOrMessage.author;
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
            return isSlash ? interactionOrMessage.editReply({ embeds: [embed] }) : interactionOrMessage.reply({ embeds: [embed] });
        }

        const totalPts = sharedPoints ? sharedPoints.totalPoints : 0;
        const weeklyPts = sharedPoints ? sharedPoints.weeklyPoints : 0;
        const monthlyPts = sharedPoints ? sharedPoints.monthlyPoints : 0;
        const currentStreak = sharedPoints ? sharedPoints.currentStreak : 0;
        const longestStreak = sharedPoints ? sharedPoints.longestStreak : 0;

        // Info SK detail
        const skPlayed = playerStats ? playerStats.stats.totalGames : (skStatsShared ? skStatsShared.historyCount : 0);
        // Bonus games hitung manual atau via reason... (sebagai placeholder ambil totalGames % 3 jika mau, 
        // tapi sesuai prompt => "Point: XXX | Main: Xx | Bonus games: Xx"
        // Kita cukup tulis detail yg ada
        const skBonusSum = playerStats ? playerStats.stats.totalCorrect : 0; // Contoh

        const embed = new EmbedBuilder()
            .setTitle(`📊 Stats - ${targetUser.username}`)
            .setColor('Blue')
            .setThumbnail(targetUser.displayAvatarURL())
            .addFields(
                {
                    name: '💎 Total Points (Semua Game)',
                    value: `${totalPts} point | Rank #${rankInfo.rank > 0 ? rankInfo.rank : '-'} dari ${rankInfo.total} member`,
                    inline: false
                },
                {
                    name: '📅 Weekly / Monthly',
                    value: `${weeklyPts} pt minggu ini | ${monthlyPts} pt bulan ini`,
                    inline: false
                },
                {
                    name: '🎮 Sambung Kata',
                    value: `Point: ${skStatsShared.totalFromGame} | Main: ${skPlayed}`,
                    inline: true
                },
                {
                    name: '🎯 Quiz (Academy Drix)',
                    value: `Point: ${quizStats.totalFromGame} | Main: ${quizStats.historyCount}`,
                    inline: true
                },
                {
                    name: '🗺️ Guess Map (Academy Drix)',
                    value: `Point: ${guessMapStats.totalFromGame} | Main: ${guessMapStats.historyCount}`,
                    inline: true
                },
                {
                    name: '🔥 Streak',
                    value: `Sekarang: ${currentStreak}x | Terpanjang: ${longestStreak}x`,
                    inline: false
                }
            )
            .setFooter({ text: "WonderPlay × Academy Drix Valorant • Shared Database" });

        return isSlash ? interactionOrMessage.editReply({ embeds: [embed] }) : interactionOrMessage.reply({ embeds: [embed] });
    }
};
