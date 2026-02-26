import axios from 'axios';
import WordHistory from '../database/models/WordHistory.js';

const KBBI_BASE_URL = 'https://kbbi.raf555.dev/api/v1';
const memoryCache = new Map();

export async function validateWord(word) {
    const wordLower = word.toLowerCase().trim();

    // 1. Cek memory cache
    if (memoryCache.has(wordLower)) {
        console.log(`💾 Memory Cache: "${wordLower}"`);
        return memoryCache.get(wordLower);
    }

    // 2. Cek MongoDB cache
    try {
        const cached = await WordHistory.findOne({ word: wordLower });
        if (cached) {
            console.log(`🗄️ MongoDB Cache: "${wordLower}"`);
            const result = { valid: cached.isValid, definition: cached.definition };
            memoryCache.set(wordLower, result);

            // Update usage count
            await WordHistory.updateOne(
                { word: wordLower },
                { $inc: { usageCount: 1 }, lastUsed: new Date() }
            );

            return result;
        }
    } catch (dbErr) {
        console.warn('⚠️ MongoDB cache check failed:', dbErr.message);
    }

    // 3. Fetch dari KBBI API
    try {
        const response = await axios.get(
            `${KBBI_BASE_URL}/entry/${encodeURIComponent(wordLower)}`,
            { timeout: 5000 }
        );

        const data = response.data;
        const isValid = Array.isArray(data.entries) && data.entries.length > 0;
        const definition = isValid
            ? (data.entries[0]?.definitions?.[0]?.definition || 'Tidak ada definisi')
            : '';

        const result = { valid: isValid, definition };

        // Simpan ke memory cache
        memoryCache.set(wordLower, result);

        // Simpan ke MongoDB cache
        try {
            await WordHistory.create({
                word: wordLower,
                isValid,
                definition,
                usageCount: 1,
                lastUsed: new Date()
            });
        } catch (dbErr) {
            // Ignore duplicate key error
            if (dbErr.code !== 11000) {
                console.warn('⚠️ MongoDB save failed:', dbErr.message);
            }
        }

        console.log(`🔍 KBBI API: "${wordLower}" → ${isValid ? '✅ Valid' : '❌ Invalid'}`);
        return result;

    } catch (error) {
        if (error.response?.status === 404) {
            const result = { valid: false, definition: '' };
            memoryCache.set(wordLower, result);
            console.log(`🔍 KBBI API: "${wordLower}" → ❌ Invalid (404)`);
            return result;
        }

        // API error/timeout → fallback valid
        console.error(`❌ KBBI API Error: "${wordLower}" →`, error.message);
        console.warn(`⚠️ FALLBACK: "${wordLower}" dianggap valid (API down)`);
        return { valid: true, definition: '(tidak dapat diverifikasi - API timeout)' };
    }
}

export function getRandomStartWord(level) {
    const wordsByLevel = {
        1: ['bola', 'makan', 'nasi', 'ikan', 'ayam', 'buku', 'meja', 'kursi', 'rumah', 'pohon'],
        2: ['makan', 'rumah', 'bunga', 'pohon', 'langit', 'angin', 'hujan', 'pasar', 'kota', 'desa'],
        3: ['sekolah', 'kantor', 'sungai', 'danau', 'gunung', 'pantai', 'taman', 'pakaian', 'makanan'],
        4: ['pelajaran', 'perjalanan', 'kehidupan', 'pemerintah', 'perusahaan', 'lingkungan'],
        5: ['pengetahuan', 'pembangunan', 'keberhasilan', 'permasalahan', 'ketidakpastian']
    };
    const words = wordsByLevel[level] || wordsByLevel[1];
    return words[Math.floor(Math.random() * words.length)];
}

export function getWordSuffix(word, count) {
    return word.slice(-count).toLowerCase();
}

export function checkWordPrefix(word, suffix) {
    return word.toLowerCase().startsWith(suffix.toLowerCase());
}
