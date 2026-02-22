import { EmbedBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getRandomMap, splitTeams } from '../utils/valorantMaps.js';
import { checkPermissions, createPermissionEmbed } from '../utils/permissions.js';
import { PermissionFlagsBits } from 'discord.js';

// Dummy players untuk testing
const DUMMY_PLAYERS = [
    { id: '000000001', user: { username: 'Jett_Main', bot: false } },
    { id: '000000002', user: { username: 'ReynaCantik', bot: false } },
    { id: '000000003', user: { username: 'SageHealer', bot: false } },
    { id: '000000004', user: { username: 'PhoenixFlash', bot: false } },
    { id: '000000005', user: { username: 'OmenSmoker', bot: false } },
    { id: '000000006', user: { username: 'CypherCam', bot: false } },
    { id: '000000007', user: { username: 'SovaRecon', bot: false } },
    { id: '000000008', user: { username: 'ViperToxin', bot: false } },
    { id: '000000009', user: { username: 'KilljoyBot', bot: false } },
    { id: '000000010', user: { username: 'BrimstoneUlt', bot: false } },
];

export default {
    name: 'testroulettevoice',
    aliases: ['trv', 'testroule'],
    description: 'Test roulette voice dengan dummy data (Admin only)',
    usage: '?testroulettevoice [jumlah_pemain]',
    permissions: [PermissionFlagsBits.Administrator],

    async execute(message, args, client) {
        // Permission check
        const permCheck = checkPermissions(message, this.permissions);
        if (!permCheck.allowed) {
            return message.reply(createPermissionEmbed(['Administrator', 'Server Owner', 'Bot Owner']));
        }

        // Jumlah pemain (default 8, max 10)
        let playerCount = parseInt(args[0]) || 8;
        if (playerCount < 2) playerCount = 2;
        if (playerCount > 10) playerCount = 10;

        const players = DUMMY_PLAYERS.slice(0, playerCount);

        // Bagi tim & pilih map
        const { attackers, defenders, spectators } = splitTeams(players);
        const map = getRandomMap();

        // Buat embed
        const attackerList = attackers.map((p, i) => `\`${i + 1}.\` **${p.user.username}**`).join('\n') || '*Kosong*';
        const defenderList = defenders.map((p, i) => `\`${i + 1}.\` **${p.user.username}**`).join('\n') || '*Kosong*';

        const embed = new EmbedBuilder()
            .setColor('#ff4655')
            .setTitle('🧪 TEST - VALORANT TEAM ROULETTE')
            .setDescription(`**Map: ${map.name}**\n\n_⚠️ Ini adalah data dummy untuk testing._`)
            .addFields(
                { name: `⚔️ ATTACKERS (${attackers.length})`, value: attackerList, inline: true },
                { name: `🛡️ DEFENDERS (${defenders.length})`, value: defenderList, inline: true }
            )
            .setTimestamp()
            .setFooter({ text: `Test by ${message.author.tag} • ${playerCount} dummy players` });

        if (spectators.length > 0) {
            const spectatorList = spectators.map(p => `**${p.user.username}**`).join(', ');
            embed.addFields({ name: '👀 SPECTATORS', value: spectatorList, inline: false });
        }

        // Gambar map
        const attachment = new AttachmentBuilder(map.image, { name: `${map.name}.jpg` });
        embed.setImage(`attachment://${map.name}.jpg`);

        // Tombol Re-Roll (untuk testing)
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('test_reroll_team').setLabel('🔄 Re-Roll Team').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('test_reroll_map').setLabel('🗺️ Re-Roll Map').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('test_reroll_all').setLabel('🎲 Re-Roll Semua').setStyle(ButtonStyle.Danger),
        );

        const sentMessage = await message.reply({ embeds: [embed], files: [attachment], components: [row] });

        // Handle button interactions (1 menit untuk testing)
        const collector = sentMessage.createMessageComponentCollector({ time: 60_000 });

        let currentPlayers = players;
        let currentMap = map;
        let currentTeams = { attackers, defenders, spectators };

        collector.on('collect', async (interaction) => {
            if (interaction.user.id !== message.author.id) {
                return interaction.reply({ content: '❌ Hanya admin yang memanggil bisa Re-Roll test ini!', ephemeral: true });
            }

            if (interaction.customId === 'test_reroll_team') {
                currentTeams = splitTeams(currentPlayers);
            } else if (interaction.customId === 'test_reroll_map') {
                currentMap = getRandomMap();
            } else if (interaction.customId === 'test_reroll_all') {
                currentTeams = splitTeams(currentPlayers);
                currentMap = getRandomMap();
            }

            const newAttackerList = currentTeams.attackers.map((p, i) => `\`${i + 1}.\` **${p.user.username}**`).join('\n') || '*Kosong*';
            const newDefenderList = currentTeams.defenders.map((p, i) => `\`${i + 1}.\` **${p.user.username}**`).join('\n') || '*Kosong*';

            const newEmbed = new EmbedBuilder()
                .setColor('#ff4655')
                .setTitle('🧪 TEST - VALORANT TEAM ROULETTE')
                .setDescription(`**Map: ${currentMap.name}**\n\n_⚠️ Ini adalah data dummy untuk testing._`)
                .addFields(
                    { name: `⚔️ ATTACKERS (${currentTeams.attackers.length})`, value: newAttackerList, inline: true },
                    { name: `🛡️ DEFENDERS (${currentTeams.defenders.length})`, value: newDefenderList, inline: true }
                )
                .setTimestamp()
                .setFooter({ text: `Test by ${message.author.tag} • ${playerCount} dummy players` });

            if (currentTeams.spectators.length > 0) {
                const spectatorList = currentTeams.spectators.map(p => `**${p.user.username}**`).join(', ');
                newEmbed.addFields({ name: '👀 SPECTATORS', value: spectatorList, inline: false });
            }

            const newAttachment = new AttachmentBuilder(currentMap.image, { name: `${currentMap.name}.jpg` });
            newEmbed.setImage(`attachment://${currentMap.name}.jpg`);

            await interaction.update({ embeds: [newEmbed], files: [newAttachment], components: [row] });
        });

        collector.on('end', async () => {
            const disabledRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('test_reroll_team').setLabel('🔄 Re-Roll Team').setStyle(ButtonStyle.Primary).setDisabled(true),
                new ButtonBuilder().setCustomId('test_reroll_map').setLabel('🗺️ Re-Roll Map').setStyle(ButtonStyle.Secondary).setDisabled(true),
                new ButtonBuilder().setCustomId('test_reroll_all').setLabel('🎲 Re-Roll Semua').setStyle(ButtonStyle.Danger).setDisabled(true),
            );
            await sentMessage.edit({ components: [disabledRow] }).catch(() => { });
        });

        console.log(`🧪 Test roulette by ${message.author.tag} [${permCheck.role}] | ${playerCount} players | Map: ${map.name}`);
    }
};
