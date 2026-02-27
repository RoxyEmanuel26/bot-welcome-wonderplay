import { EmbedBuilder, Message, Client, SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';

const buildUserHelpEmbed = (user: any) => {
    return new EmbedBuilder()
        .setColor('#00b0f4')
        .setTitle('🎮 PANDUAN WONDERPLAY BOT (MEMBER)')
        .setDescription('Halo! Berikut adalah daftar command yang bisa kamu gunakan di server ini. Semua teks di bawah ini dapat digunakan melalui Slash Command (`/`) maupun Prefix (`!` atau `?`).')
        .addFields(
            {
                name: '🕹️ Minigames: Sambung Kata',
                value: 'Game seru menyambung suku kata terakhir berbatas waktu!\n\n' +
                    '• **`/sk`** : Memulai game lewat Slash Command (discord akan memintamu memilih level 1-5).\n' +
                    '• **`!sk <level>`** : Memulai game lewat Prefix. Contoh: `!sk 3` (untuk level 3).\n' +
                    '• **`/skstats`** atau **`!skstats`** : Melihat statistik poin, nyawa, dan level kamu.\n' +
                    '• **`/sktop`** atau **`!sktop`** : Menampilkan Leaderboard pemain terbaik Global.',
                inline: false
            },
            {
                name: '🎯 Valorant Team Roulette',
                value: 'Acak anggota Voice Channel menjadi 2 tim Valorant (Attackers & Defenders) beserta pemilihan map acak.\n\n' +
                    '• **`?roulettevoice`** : Mengacak semua orang yang ada di Voice Channel kamu saat ini.\n' +
                    '• **`?roulettevoice @user1 @user2`** : Mengacak tim, tapi MENGECUALIKAN user yang kamu tag (jika mereka tidak ikut main).\n' +
                    '> *Catatan: Setelah hasil keluar, kamu bisa klik tombol di bawah pesan untuk mengacak ulang (Re-Roll) tim atau map.*',
                inline: false
            },
            {
                name: 'ℹ️ Informasi Tambahan',
                value: '• Ingin info khusus admin/moderator? Gunakan **`/help_admin`**.\n' +
                    '• Prefix bot bisa menggunakan `!` atau `?`.',
                inline: false
            }
        )
        .setThumbnail('https://cdn.discordapp.com/attachments/1118804535310065744/1118804576363945994/wonderplay-logo.png') // Ganti icon kalau ada
        .setFooter({ text: `Wonderplay Bot • Diminta oleh ${user.tag}` })
        .setTimestamp();
};

export default {
    name: 'help',
    aliases: ['h', 'fitur', 'commands'],
    description: 'Menampilkan panduan command untuk member biasa',

    // Slash Command Setup
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Menampilkan panduan penggunaan dan daftar fitur Wonderplay Bot (Member)'),

    // Eksekusi jika lewat Prefix (!help / ?fitur)
    async execute(message: Message, args: string[], client: Client) {
        const embed = buildUserHelpEmbed(message.author);
        await message.reply({ embeds: [embed] });
    },

    // Eksekusi jika lewat Slash Command (/help)
    async executeSlash(interaction: ChatInputCommandInteraction) {
        const embed = buildUserHelpEmbed(interaction.user);
        await interaction.reply({ embeds: [embed] });
    }
};
