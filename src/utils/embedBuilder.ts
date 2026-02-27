import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, User } from 'discord.js';
import { CalculatedPoints } from './pointCalculator.js';

export function createLobbyEmbed(level: number, levelName: string, hostUser: User, levelConfig: any, players: User[], timeLeft: number) {
    const embed = new EmbedBuilder()
        .setTitle(`🎮 SAMBUNG KATA | Level ${level} - ${levelName}`)
        .setDescription('Sambung kata dari huruf terakhir!\nReply pesan ini untuk JOIN!')
        .setColor(levelConfig.color)
        .addFields(
            { name: "👑 Host", value: `<@${hostUser.id}>`, inline: true },
            { name: "⚙️ Level", value: `Level ${level} - ${levelName}`, inline: true },
            { name: "⏱️ Waktu Jawab", value: `${levelConfig.timeLimit} detik/giliran`, inline: true },
            { name: "❤️ Nyawa", value: `${levelConfig.lives} kesempatan salah`, inline: true },
            { name: "📊 Sistem Sambung", value: levelConfig.systemDesc, inline: true },
            { name: "💰 Max Point", value: `${levelConfig.maxPoint} point/jawaban`, inline: true },
            { name: `👥 Pemain (${players.length}/10)`, value: players.length > 0 ? players.map((p, i) => `${i + 1}. <@${p.id}>`).join('\n') : 'Menunggu pemain...', inline: false },
            { name: "⏳ Lobby Tutup", value: `${timeLeft} detik lagi...`, inline: false }
        )
        .setFooter({ text: "WonderPlay Sambung Kata • Min 2 pemain" });

    const components = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setLabel("▶️ MULAI").setStyle(ButtonStyle.Success).setCustomId("sk_start"),
        new ButtonBuilder().setLabel("❌ BATAL").setStyle(ButtonStyle.Danger).setCustomId("sk_cancel")
    );

    return { embeds: [embed], components: [components] };
}

export function createTurnEmbed(user: User, previousWord: string, suffix: string, suffixLength: number, levelConfig: any, livesEmoji: string, bonusesStr: string, scoreboardStr: string, usedWordsStr: string) {
    const embed = new EmbedBuilder()
        .setTitle(`🎯 GILIRAN ${user.username.toUpperCase()}`)
        .setDescription(`Kata sebelumnya: **${previousWord}**\nSambung dengan: **[${suffix.toUpperCase()}]** (${suffixLength} huruf)\n\n⏱️ Kamu punya **${levelConfig.timeLimit} detik** untuk menjawab!`)
        .setColor(levelConfig.color)
        .addFields(
            { name: "❤️ Nyawa Kamu", value: livesEmoji, inline: true },
            { name: "💰 Max Point", value: `${levelConfig.maxPoint} point`, inline: true },
            { name: "⚡ Bonus Speed", value: `Jawab < ${Math.floor(levelConfig.timeLimit * 0.2)} detik!`, inline: true },
            { name: "📊 Skor Sementara", value: scoreboardStr || "Belum ada poin", inline: false },
            { name: "📝 Kata Terpakai", value: usedWordsStr || "Belum ada", inline: false }
        );

    return { content: `<@${user.id}>, giliranmu!`, embeds: [embed] };
}

export function createCorrectEmbed(user: User, word: string, definition: string, pointResult: CalculatedPoints, totalPoints: number, feedback: string) {
    const embed = new EmbedBuilder()
        .setTitle(`✅ BENAR! +${pointResult.total} POINT`)
        .setDescription(`<@${user.id}> menjawab **${word.toUpperCase()}** dalam ${pointResult.responseTime.toFixed(1)}s!\nDefinisi: *${definition}*`)
        .setColor("#00FF87")
        .addFields(
            {
                name: '📏 Panjang Kata',
                value: `**${word.toUpperCase()}** — ${word.length} huruf ${pointResult.multiplierText}`,
                inline: true
            },
            {
                name: '⏱️ Kecepatan',
                value: `${pointResult.responseTime.toFixed(1)} detik`,
                inline: true
            },
            {
                name: '💰 Point Didapat',
                value: `**+${pointResult.total} pt**\nBase: ${pointResult.base} + Bonus: ${pointResult.bonusTotal}`,
                inline: true
            }
        );

    // Tampilkan breakdown bonus jika ada
    if (pointResult.bonuses && pointResult.bonuses.length > 0) {
        embed.addFields({
            name: '🎁 Bonus Aktif',
            value: pointResult.bonuses.map((b: any) => `${b.icon} ${b.name} +${b.value}`).join('\n'),
            inline: false
        });
    }

    // Feedback panjang kata
    embed.addFields({
        name: '💡 Info',
        value: feedback,
        inline: false
    });

    return { embeds: [embed] };
}

export function createWrongEmbed(user: User, word: string, reason: string, livesEmoji: string, timeLeft: number) {
    const embed = new EmbedBuilder()
        .setTitle(`❌ SALAH! | ${user.username.toUpperCase()}`)
        .setDescription(`Kata **${word.toUpperCase()}** tidak valid!\n**Alasan:** ${reason}`)
        .setColor("#FF0054")
        .addFields(
            { name: "❌ Peraturan", value: `- Huruf awal salah\n- Kata tidak ada di KBBI\n- Kata sudah dipakai`, inline: false },
            { name: "❤️ Sisa Nyawa", value: livesEmoji, inline: false },
            { name: "⚠️ Info", value: timeLeft > 0 ? `⏱️ Kamu masih bisa jawab! Sisa waktu: **${timeLeft}s**` : `⌛ Waktu sudah habis untuk kata ini. Giliran akan berpindah.`, inline: false }
        );

    return { embeds: [embed] };
}

export function createEliminatedEmbed(user: User, finalPoints: number, correctCount: number, wrongCount: number, remainingPlayersStr: string) {
    const embed = new EmbedBuilder()
        .setTitle(`💀 ${user.username.toUpperCase()} DIELIMINASI!`)
        .setDescription(`Nyawa habis! <@${user.id}> keluar dari permainan.`)
        .setColor("#333333")
        .addFields(
            { name: "📊 Point Akhir", value: `${finalPoints} point`, inline: true },
            { name: "✅ Benar", value: `${correctCount} kali`, inline: true },
            { name: "❌ Salah", value: `${wrongCount} kali`, inline: true },
            { name: "👥 Pemain Tersisa", value: remainingPlayersStr || "Tidak ada", inline: false }
        );

    return { embeds: [embed] };
}

export function createGameEndEmbed(level: number, levelName: string, winner: any, players: any[], statsStr: string) {
    const embed = new EmbedBuilder()
        .setTitle(`🏆 GAME SELESAI! | Level ${level} - ${levelName}`)
        .setDescription(winner ? `🎉 Selamat kepada <@${winner.userId}>!` : "🤝 Permainan berakhir seri!")
        .setColor("#FFD700");

    players.slice(0, 3).forEach((p, index) => {
        const medals = ['🥇', '🥈', '🥉'];
        embed.addFields({ name: `${medals[index]} #${index + 1} ${p.username}`, value: `${p.points} pt | ✅${p.correctAnswers} | ⚡${p.avgResponseTime.toFixed(1)}s avg`, inline: false });
    });

    embed.addFields(
        { name: "📊 Statistik Game", value: statsStr, inline: false },
        { name: "💾 Database", value: "Stats semua pemain telah disimpan!", inline: false }
    );

    const components = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setLabel("🔄 REMATCH").setStyle(ButtonStyle.Primary).setCustomId("sk_rematch"),
        new ButtonBuilder().setLabel("📊 STATS").setStyle(ButtonStyle.Secondary).setCustomId("sk_stats")
    );

    return { embeds: [embed], components: [components] };
}
