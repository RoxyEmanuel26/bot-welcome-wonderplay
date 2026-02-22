import { EmbedBuilder, AttachmentBuilder } from 'discord.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ASSETS_DIR = path.join(__dirname, '..', '..', 'assets');

export default {
    name: 'fitur',
    aliases: ['commands', 'help', 'cmd'],
    description: 'Menampilkan semua fitur dan daftar command bot',
    usage: '?fitur',

    async execute(message, args, client) {
        const bannerPath = path.join(ASSETS_DIR, 'banner.jpeg');
        let files = [];
        let bannerName = 'banner.jpeg';

        const embed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setTitle('🎮 WONDERPLAY BOT FEATURES')
            .setDescription('Berikut adalah daftar lengkap fitur dan command yang tersedia di Wonderplay Bot:')
            .addFields(
                {
                    name: '👋 Welcome & Goodbye System',
                    value: '• Menyambut member baru dengan gambar Canvas & pesan AI Gemini.\n• Mengucapkan selamat tinggal saat member keluar.\n• Auto-Role: Memberikan role otomatis ke member baru.\n• **Command:** `!welcome @user` (Tes welcome, Admin/Owner)',
                    inline: false
                },
                {
                    name: '🎯 Valorant Team Roulette',
                    value: 'Membagi anggota di Voice Channel menjadi 2 tim Valorant secara acak beserta pemilihan map.\n• **`?roulettevoice`** : Acak semua orang di Voice Channel.\n• **`?roulettevoice @user1 @user2`** : Acak tim, tapi jangan ikutkan user yang di-tag.\n• **`?testroulettevoice`** : Tes roulette dengan 8 dummy player (Admin).',
                    inline: false
                },
                {
                    name: '📊 Server Statistics',
                    value: 'Melihat statistik interaksi bot di server.\n• **Command:** `!stats` (Lihat jumlah member, riwayat welcome, dll - Admin/Owner)',
                    inline: false
                },
                {
                    name: '📌 Informasi Tambahan',
                    value: '• Prefix bot adalah `!` atau `?`.\n• Setelah hasil Roulette keluar, Anda bisa klik tombol di bawah pesan untuk mengacak ulang (Re-Roll) tim atau map secara langsung.',
                    inline: false
                }
            )
            .setFooter({ text: `Wonderplay Bot • Dipanggil oleh ${message.author.tag}`, iconURL: client.user.displayAvatarURL() })
            .setTimestamp();

        if (fs.existsSync(bannerPath)) {
            const attachment = new AttachmentBuilder(bannerPath, { name: bannerName });
            embed.setImage(`attachment://${bannerName}`);
            files.push(attachment);
        } else {
            embed.setFooter({ text: 'Banner image not found.' });
        }

        await message.reply({ embeds: [embed], files });
    }
};
