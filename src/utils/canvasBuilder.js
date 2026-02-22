import { createCanvas, loadImage, registerFont } from 'canvas';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Pastikan folder assets ada untuk menyimpan background/font jika perlu
const ASSETS_DIR = path.join(__dirname, '..', '..', 'assets');
if (!fs.existsSync(ASSETS_DIR)) {
    fs.mkdirSync(ASSETS_DIR, { recursive: true });
}

/**
 * Generate sebuah welcome image dengan Canvas
 * @param {import('discord.js').GuildMember} member 
 * @returns {Promise<Buffer>} Buffer gambar PNG
 */
export async function buildWelcomeImage(member) {
    const canvas = createCanvas(1024, 450);
    const ctx = canvas.getContext('2d');

    // 1. Gambar Background (Bisa pakai gambar lokal kalau ada, atau warna gradien)
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#1a1a2e'); // Warna gelap
    gradient.addColorStop(1, '#16213e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Tambah pattern/garis hiasan simple
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 10;
    for (let i = 0; i < canvas.width; i += 50) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i - 200, canvas.height);
        ctx.stroke();
    }

    // 2. Teks "WELCOME"
    ctx.font = 'bold 70px "Segoe UI", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText('WELCOME TO', canvas.width / 2 + 100, 150);

    // 3. Nama Server
    ctx.font = 'bold 85px "Segoe UI", sans-serif';
    ctx.fillStyle = '#e94560'; // Warna aksen Wonderplay
    ctx.fillText(member.guild.name.toUpperCase(), canvas.width / 2 + 100, 240);

    // 4. Nickname Member
    ctx.font = '50px "Segoe UI", sans-serif';
    ctx.fillStyle = '#cccccc';
    ctx.fillText(member.user.username, canvas.width / 2 + 100, 320);

    // 5. Urutan Member
    ctx.font = '30px "Segoe UI", sans-serif';
    ctx.fillStyle = '#888888';
    ctx.fillText(`Member #${member.guild.memberCount}`, canvas.width / 2 + 100, 380);

    // 6. Gambar Avatar (Bentuk Lingkaran)
    const avatarSize = 250;
    const avatarX = 100;
    const avatarY = (canvas.height / 2) - (avatarSize / 2);

    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();

    try {
        const avatarUrl = member.user.displayAvatarURL({ extension: 'png', size: 512, forceStatic: true });
        const avatar = await loadImage(avatarUrl);
        ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
    } catch (e) {
        console.error('Error loading avatar image for canvas:', e);
        // Fallback warna abu-abu kalau gagal fetch avatar
        ctx.fillStyle = '#333333';
        ctx.fill();
    }

    ctx.restore();

    // 7. Lingkaran luar (Border) Profil
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, (avatarSize / 2) + 10, 0, Math.PI * 2, true);
    ctx.strokeStyle = '#e94560'; // Warna aksen
    ctx.lineWidth = 15;
    ctx.stroke();

    return canvas.toBuffer('image/png');
}
