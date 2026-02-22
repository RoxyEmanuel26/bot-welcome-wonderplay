import { EmbedBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getRandomMap, splitTeams } from '../utils/valorantMaps.js';
import { addMatch } from '../utils/matchHistory.js';

export default {
    name: 'roulettevoice',
    aliases: ['rv', 'rvs'],
    description: 'Acak pembagian tim Valorant dari voice channel!',
    usage: '?roulettevoice [@exclude1 @exclude2 ...]',

    async execute(message, args, client) {
        // Cek toggle
        if (process.env.FITUR_ROULETTE?.toLowerCase() !== 'on') {
            return message.reply('⚠️ Fitur Roulette sedang dimatikan oleh admin.');
        }

        // 1. Cek apakah pemanggil ada di voice channel
        const voiceChannel = message.member.voice.channel;

        if (!voiceChannel) {
            return message.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#ff4444')
                    .setTitle('❌ Kamu Tidak Ada di Voice Channel!')
                    .setDescription('Masuk ke voice channel dulu baru panggil command ini.')
                    .setFooter({ text: 'Wonderplay Roulette System' })
                ]
            });
        }

        // 2. Ambil semua member di voice (kecuali bot)
        const excludedUsers = message.mentions.users;
        const allMembers = voiceChannel.members.filter(m => !m.user.bot);

        // Filter exclude
        let players = allMembers.map(m => m);
        if (excludedUsers.size > 0) {
            players = players.filter(m => !excludedUsers.has(m.id));
        }

        // 3. Cek jumlah minimum pemain
        if (players.length < 2) {
            return message.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#ff4444')
                    .setTitle('❌ Pemain Tidak Cukup!')
                    .setDescription(`Butuh minimal **2 pemain** di voice.\nSaat ini hanya ada **${players.length}** pemain yang tersedia.`)
                    .setFooter({ text: 'Wonderplay Roulette System' })
                ]
            });
        }

        // 4. Bagi tim & pilih map
        const { attackers, defenders, spectators } = splitTeams(players);
        const map = getRandomMap();

        // 5. Buat Embed Hasil
        const embed = buildRouletteEmbed(attackers, defenders, spectators, map, message.author, excludedUsers);

        // 6. Buat gambar map sebagai attachment
        const attachment = new AttachmentBuilder(map.image, { name: `${map.name}.jpg` });
        embed.setImage(`attachment://${map.name}.jpg`);

        // 7. Buat tombol Re-Roll
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('reroll_team')
                .setLabel('🔄 Re-Roll Team')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('reroll_map')
                .setLabel('🗺️ Re-Roll Map')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('reroll_all')
                .setLabel('🎲 Re-Roll Semua')
                .setStyle(ButtonStyle.Danger),
        );

        // 8. Kirim pesan
        const sentMessage = await message.reply({ embeds: [embed], files: [attachment], components: [row] });

        // 9. Simpan ke match history
        await addMatch({
            map: map.name,
            attackers: attackers.map(p => ({ id: p.id, username: p.user.username })),
            defenders: defenders.map(p => ({ id: p.id, username: p.user.username })),
            spectators: spectators.map(p => ({ id: p.id, username: p.user.username })),
            requestedBy: message.author.tag
        });

        // 10. Handle Button Interactions (aktif selama 2 menit)
        const collector = sentMessage.createMessageComponentCollector({ time: 120_000 });

        // Simpan state saat ini supaya bisa re-roll parsial
        let currentPlayers = players;
        let currentMap = map;
        let currentTeams = { attackers, defenders, spectators };

        collector.on('collect', async (interaction) => {
            // Hanya orang yang memanggil bisa re-roll
            if (interaction.user.id !== message.author.id) {
                return interaction.reply({ content: '❌ Hanya yang memanggil command yang bisa Re-Roll!', ephemeral: true });
            }

            if (interaction.customId === 'reroll_team') {
                currentTeams = splitTeams(currentPlayers);
            } else if (interaction.customId === 'reroll_map') {
                currentMap = getRandomMap();
            } else if (interaction.customId === 'reroll_all') {
                currentTeams = splitTeams(currentPlayers);
                currentMap = getRandomMap();
            }

            const newEmbed = buildRouletteEmbed(
                currentTeams.attackers, currentTeams.defenders, currentTeams.spectators,
                currentMap, message.author, excludedUsers
            );
            const newAttachment = new AttachmentBuilder(currentMap.image, { name: `${currentMap.name}.jpg` });
            newEmbed.setImage(`attachment://${currentMap.name}.jpg`);

            await interaction.update({ embeds: [newEmbed], files: [newAttachment], components: [row] });

            // Simpan re-roll ke history juga
            await addMatch({
                map: currentMap.name,
                attackers: currentTeams.attackers.map(p => ({ id: p.id, username: p.user.username })),
                defenders: currentTeams.defenders.map(p => ({ id: p.id, username: p.user.username })),
                spectators: currentTeams.spectators.map(p => ({ id: p.id, username: p.user.username })),
                requestedBy: `${message.author.tag} (Re-Roll)`
            });
        });

        collector.on('end', async () => {
            // Disable semua tombol setelah 2 menit
            const disabledRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('reroll_team').setLabel('🔄 Re-Roll Team').setStyle(ButtonStyle.Primary).setDisabled(true),
                new ButtonBuilder().setCustomId('reroll_map').setLabel('🗺️ Re-Roll Map').setStyle(ButtonStyle.Secondary).setDisabled(true),
                new ButtonBuilder().setCustomId('reroll_all').setLabel('🎲 Re-Roll Semua').setStyle(ButtonStyle.Danger).setDisabled(true),
            );
            await sentMessage.edit({ components: [disabledRow] }).catch(() => { });
        });
    }
};

/**
 * Bangun embed hasil roulette
 */
function buildRouletteEmbed(attackers, defenders, spectators, map, author, excludedUsers) {
    const attackerList = attackers.map((p, i) => `\`${i + 1}.\` <@${p.id}>`).join('\n') || '*Kosong*';
    const defenderList = defenders.map((p, i) => `\`${i + 1}.\` <@${p.id}>`).join('\n') || '*Kosong*';

    const embed = new EmbedBuilder()
        .setColor('#ff4655') // Warna khas Valorant
        .setTitle('🎯 VALORANT TEAM ROULETTE')
        .setDescription(`**Map: ${map.name}**`)
        .addFields(
            {
                name: `⚔️ ATTACKERS (${attackers.length})`,
                value: attackerList,
                inline: true
            },
            {
                name: `🛡️ DEFENDERS (${defenders.length})`,
                value: defenderList,
                inline: true
            }
        )
        .setTimestamp()
        .setFooter({ text: `Requested by ${author.tag} • Wonderplay Roulette` });

    // Tambah spectators jika ada
    if (spectators.length > 0) {
        const spectatorList = spectators.map(p => `<@${p.id}>`).join(', ');
        embed.addFields({ name: '👀 SPECTATORS', value: spectatorList, inline: false });
    }

    // Tambah excluded users info
    if (excludedUsers && excludedUsers.size > 0) {
        const excludedList = excludedUsers.map(u => `<@${u.id}>`).join(', ');
        embed.addFields({ name: '🚫 Tidak Ikut Main', value: excludedList, inline: false });
    }

    return embed;
}
