import { createCanvas, loadImage, registerFont } from 'canvas';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GuildMember } from 'discord.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Pastikan folder assets ada untuk menyimpan background/font jika perlu
const ASSETS_DIR = path.join(__dirname, '..', '..', 'assets');
if (!fs.existsSync(ASSETS_DIR)) {
    fs.mkdirSync(ASSETS_DIR, { recursive: true });
}

/**
 * Generate sebuah welcome image dengan Canvas
 * @param {GuildMember} member 
 * @returns {Promise<Buffer>} Buffer gambar PNG
 */
export async function buildWelcomeImage(member: GuildMember): Promise<Buffer> {
    // 0. Register Custom Fonts tepat sebelum Canvas dibuat agar terbaca di memory
    const puffberryPath = path.join(ASSETS_DIR, 'Puffberry.ttf');
    if (fs.existsSync(puffberryPath)) {
        registerFont(puffberryPath, { family: 'Puffberry' });
    }

    const canvas = createCanvas(1024, 450);
    const ctx = canvas.getContext('2d');

    // 1. Gambar Background dari file lokal
    const bgPath = path.join(ASSETS_DIR, 'welcome.jpg');
    try {
        if (fs.existsSync(bgPath)) {
            const background = await loadImage(bgPath);
            ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
        } else {
            console.warn('⚠️ File assets/welcome.jpg tidak ditemukan, beralih ke warna gelap');
            ctx.fillStyle = '#16213e';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    } catch (err) {
        console.error('Error loading background image:', err);
    }

    const textX = 665; // Agak digeser ke kiri agar pas di tengah 'WONDERPLAY'

    // 2. Teks "WELCOME" (Di atas teks WONDERPLAY)
    ctx.font = '60px Puffberry'; // Hapus quotes dan sans-serif fallback agar canvas terpaksa memuat custom font
    ctx.fillStyle = '#fdc4bdff'; // Warna peach pastel request user
    ctx.strokeStyle = '#ffffff'; // Border putih
    ctx.lineWidth = 4;
    ctx.textAlign = 'center';
    ctx.strokeText('WELCOME', 650, 175);
    ctx.fillText('WELCOME', 650, 175);

    // 3. Nickname Member (Posisi di tengah bawah tulisan WONDERPLAY)
    ctx.font = 'bold 50px "Segoe UI", sans-serif';
    ctx.fillStyle = '#16213e'; // Warna teks gelap
    ctx.strokeStyle = '#ffffff'; // Border putih
    ctx.lineWidth = 5;
    ctx.textAlign = 'center';

    ctx.strokeText(member.user.username, textX, 310);
    ctx.fillText(member.user.username, textX, 310);

    // 3. Urutan Member
    ctx.font = '35px "Segoe UI", sans-serif';
    ctx.fillStyle = '#2b2d31';
    ctx.strokeStyle = '#ffffff'; // Border putih
    ctx.lineWidth = 4;
    ctx.strokeText(`Member #${member.guild.memberCount}`, textX, 365);
    ctx.fillText(`Member #${member.guild.memberCount}`, textX, 365);

    // 4. Gambar Avatar (Bentuk Lingkaran, diperkecil 20px)
    const avatarSize = 235; // Semula 255
    const avatarX = 135; // Digeser 10px ke kanan agar tetap di tengah
    const avatarY = 105; // Digeser 10px ke bawah agar tetap di tengah

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
        ctx.fillStyle = '#333333';
        ctx.fill();
    }

    ctx.restore();

    // 5. Lingkaran tepi Avatar (Border Cyan)
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, (avatarSize / 2), 0, Math.PI * 2, true);
    ctx.strokeStyle = '#2cb1c2'; // Warna teks cyan Wonderplay
    ctx.lineWidth = 12; // Tebal border
    ctx.stroke();

    return canvas.toBuffer('image/png');
}
