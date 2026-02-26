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
    // Ambil dari .env sesuai level
    const envKeys = {
        1: process.env.SK_STARTER_L1,
        2: process.env.SK_STARTER_L2,
        3: process.env.SK_STARTER_L3,
        4: process.env.SK_STARTER_L4,
        5: process.env.SK_STARTER_L5
    };

    const envValue = envKeys[level];

    // Fallback hardcoded jika .env tidak diset
    const fallback = {
        1: ['bola', 'makan', 'nasi', 'ikan', 'ayam', 'buku', 'meja', 'kursi'],
        2: ['makan', 'rumah', 'bunga', 'pohon', 'langit', 'angin', 'hujan'],
        3: ['sekolah', 'kantor', 'sungai', 'danau', 'gunung', 'pantai'],
        4: ['pelajaran', 'perjalanan', 'kehidupan', 'pemerintah'],
        5: ['pengetahuan', 'pembangunan', 'keberhasilan', 'permasalahan']
    };

    let words;

    if (envValue && envValue.trim().length > 0) {
        // Parse dari .env (split koma, trim spasi, filter kosong)
        words = envValue
            .split(',')
            .map(w => w.trim().toLowerCase())
            .filter(w => w.length > 0);

        if (words.length === 0) {
            console.warn(`⚠️ SK_STARTER_L${level} kosong di .env, pakai fallback`);
            words = fallback[level];
        } else {
            console.log(`📋 SK_STARTER_L${level}: ${words.length} kata tersedia dari .env`);
        }
    } else {
        console.warn(`⚠️ SK_STARTER_L${level} tidak diset di .env, pakai fallback`);
        words = fallback[level];
    }

    // Ambil random dari list
    const picked = words[Math.floor(Math.random() * words.length)];
    console.log(`🎲 Starter word Level ${level}: "${picked}"`);
    return picked;
}

export function getWordSuffix(word, count) {
    return word.slice(-count).toLowerCase();
}

export function checkWordPrefix(word, suffix) {
    return word.toLowerCase().startsWith(suffix.toLowerCase());
}
