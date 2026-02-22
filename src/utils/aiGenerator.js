import { GoogleGenerativeAI } from '@google/generative-ai';

// Inisialisasi Gemini AI kalau GEMINI_API_KEY ada
let genAI = null;
if (process.env.GEMINI_API_KEY) {
    try {
        genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    } catch (e) {
        console.error('❌ Failed to initialize Gemini AI:', e.message);
    }
}

/**
 * Generate sebuah welcome message pakai AI Gemini
 * @param {import('discord.js').GuildMember} member
 * @returns {Promise<string|null>} Pesan AI atau null kalau gagal
 */
export async function generateWelcomeAI(member) {
    try {
        if (!genAI) {
            console.warn('⚠️ GEMINI_API_KEY is not set or invalid.');
            return null;
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `Buatkan 1 paragraf singkat (maksimal 2 kalimat) ucapan selamat datang yang lucu, kasual, dan ramah untuk member bernama "${member.user.username}" yang baru saja bergabung ke server Discord "${member.guild.name}". Jangan gunakan hashtag atau emoji terlalu banyak. Buat seakan-akan kamu adalah maskot bot yang ceria. Mulai kalimatmu dengan menyapa namanya.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim();

        if (!text || text.length < 5) return null;

        return text;

    } catch (error) {
        console.error('❌ Error generating AI message:', error.message);
        return null;
    }
}
