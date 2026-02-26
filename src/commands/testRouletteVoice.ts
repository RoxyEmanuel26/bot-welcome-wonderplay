import { EmbedBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Message, Client, ButtonInteraction } from 'discord.js';
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

    async execute(message: Message, args: string[], client: Client) {
        // Permission check requires permissions array from the command itself
        const permCheck = checkPermissions(message, [PermissionFlagsBits.Administrator]);
        if (!permCheck.allowed) {
            const permsEmbed = createPermissionEmbed(['Administrator', 'Server Owner']);
            return message.reply({ embeds: [permsEmbed as any] });
        }

        // Jumlah pemain (default 8, max 10)
        let playerCount = parseInt(args[0]) || 8;
        if (playerCount < 2) playerCount = 2;
        if (playerCount > 10) playerCount = 10;

        const players = DUMMY_PLAYERS.slice(0, playerCount);

        // Bagi tim & pilih map
        let currentTeams = splitTeams(players as any);
        let currentMap = getRandomMap();

        // Buat embed
        const attackerList = currentTeams.attackers.map((p: any, i: number) => `\`${i + 1}.\` **${p.user.username}**`).join('\n') || '*Kosong*';
        const defenderList = currentTeams.defenders.map((p: any, i: number) => `\`${i + 1}.\` **${p.user.username}**`).join('\n') || '*Kosong*';

        const embed = new EmbedBuilder()
            .setColor('#ff4655')
            .setTitle('🧪 TEST - VALORANT TEAM ROULETTE')
            .setDescription(`**Map: ${currentMap.name}**\n\n_⚠️ Ini adalah data dummy untuk testing._`)
            .addFields(
                { name: `⚔️ ATTACKERS (${currentTeams.attackers.length})`, value: attackerList, inline: true },
                { name: `🛡️ DEFENDERS (${currentTeams.defenders.length})`, value: defenderList, inline: true }
            )
            .setTimestamp()
            .setFooter({ text: `Test by ${message.author.tag} • ${playerCount} dummy players` });

        if (currentTeams.spectators.length > 0) {
            const spectatorList = currentTeams.spectators.map((p: any) => `**${p.user.username}**`).join(', ');
            embed.addFields({ name: '👀 SPECTATORS', value: spectatorList, inline: false });
        }

        // Gambar map
        const attachment = new AttachmentBuilder(currentMap.image, { name: `${currentMap.name}.jpg` });
        embed.setImage(`attachment://${currentMap.name}.jpg`);

        // Tombol Re-Roll (untuk testing)
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setCustomId('test_reroll_team').setLabel('🔄 Re-Roll Team').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('test_reroll_map').setLabel('🗺️ Re-Roll Map').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('test_reroll_all').setLabel('🎲 Re-Roll Semua').setStyle(ButtonStyle.Danger),
        );

        const sentMessage = await message.reply({ embeds: [embed], files: [attachment], components: [row] });

        // Handle button interactions (1 menit untuk testing)
        const collector = sentMessage.createMessageComponentCollector({ time: 60_000 });

        collector.on('collect', async (interaction: any) => {
            if (!interaction.isButton()) return;

            if (interaction.user.id !== message.author.id) {
                return interaction.reply({ content: '❌ Hanya admin yang memanggil bisa Re-Roll test ini!', ephemeral: true });
            }

            if (interaction.customId === 'test_reroll_team') {
                currentTeams = splitTeams(players as any);
            } else if (interaction.customId === 'test_reroll_map') {
                currentMap = getRandomMap();
            } else if (interaction.customId === 'test_reroll_all') {
                currentTeams = splitTeams(players as any);
                currentMap = getRandomMap();
            }

            const newAttackerList = currentTeams.attackers.map((p: any, i: number) => `\`${i + 1}.\` **${p.user.username}**`).join('\n') || '*Kosong*';
            const newDefenderList = currentTeams.defenders.map((p: any, i: number) => `\`${i + 1}.\` **${p.user.username}**`).join('\n') || '*Kosong*';

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
                const spectatorList = currentTeams.spectators.map((p: any) => `**${p.user.username}**`).join(', ');
                newEmbed.addFields({ name: '👀 SPECTATORS', value: spectatorList, inline: false });
            }

            const newAttachment = new AttachmentBuilder(currentMap.image, { name: `${currentMap.name}.jpg` });
            newEmbed.setImage(`attachment://${currentMap.name}.jpg`);

            await interaction.update({ embeds: [newEmbed], files: [newAttachment], components: [row] });
        });

        collector.on('end', async () => {
            const disabledRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder().setCustomId('test_reroll_team').setLabel('🔄 Re-Roll Team').setStyle(ButtonStyle.Primary).setDisabled(true),
                new ButtonBuilder().setCustomId('test_reroll_map').setLabel('🗺️ Re-Roll Map').setStyle(ButtonStyle.Secondary).setDisabled(true),
                new ButtonBuilder().setCustomId('test_reroll_all').setLabel('🎲 Re-Roll Semua').setStyle(ButtonStyle.Danger).setDisabled(true),
            );
            await sentMessage.edit({ components: [disabledRow] }).catch(() => { });
        });

        console.log(`🧪 Test roulette by ${message.author.tag} [${permCheck.role}] | ${playerCount} players | Map: ${currentMap.name}`);
    }
};
