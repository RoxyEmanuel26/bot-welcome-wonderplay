import axios from 'axios';
import WordHistory from '../database/models/WordHistory.js';

const KBBI_BASE_URL = 'https://kbbi.raf555.dev/api/v1';

export interface KbbiValidationResult {
    valid: boolean;
    definition: string;
}

const MEMORY_CACHE_MAX = 1000;
const memoryCache = new Map<string, KbbiValidationResult>();

function setCacheWithLimit(key: string, value: KbbiValidationResult): void {
    if (memoryCache.size >= MEMORY_CACHE_MAX) {
        const firstKey = memoryCache.keys().next().value!;
        memoryCache.delete(firstKey);
    }
    memoryCache.set(key, value);
}

export async function validateWord(word: string): Promise<KbbiValidationResult> {
    const wordLower = word.toLowerCase().trim();

    // 1. Cek memory cache
    if (memoryCache.has(wordLower)) {
        console.log(`💾 Memory Cache: "${wordLower}"`);
        return memoryCache.get(wordLower)!;
    }

    // 2. Cek MongoDB cache
    try {
        const cached = await WordHistory.findOne({ word: wordLower }).lean() as any;
        if (cached) {
            console.log(`🗄️ MongoDB Cache: "${wordLower}"`);
            const result: KbbiValidationResult = { valid: cached.isValid, definition: cached.definition };
            setCacheWithLimit(wordLower, result);

            // Update usage count (fire-and-forget, no await needed)
            WordHistory.updateOne(
                { word: wordLower },
                { $inc: { usageCount: 1 }, $set: { lastUsed: new Date() } }
            ).catch(() => { });

            return result;
        }
    } catch (dbErr: any) {
        console.warn('⚠️ MongoDB cache check failed:', dbErr.message);
    }

    // 3. Fetch dari KBBI API
    let response;
    try {
        response = await axios.get(
            `${KBBI_BASE_URL}/entry/${encodeURIComponent(wordLower)}`,
            { timeout: 5000 }
        );
    } catch (error: any) {
        if (error.response?.status === 404) {
            const result: KbbiValidationResult = { valid: false, definition: '' };
            setCacheWithLimit(wordLower, result);
            console.log(`🔍 KBBI API: "${wordLower}" → ❌ Invalid (404)`);
            return result;
        }

        console.warn(`⚠️ KBBI retry untuk: "${wordLower}"`);
        await new Promise(r => setTimeout(r, 500));

        try {
            response = await axios.get(
                `${KBBI_BASE_URL}/entry/${encodeURIComponent(wordLower)}`,
                { timeout: 5000 }
            );
        } catch (retryError: any) {
            if (retryError.response?.status === 404) {
                const result: KbbiValidationResult = { valid: false, definition: '' };
                setCacheWithLimit(wordLower, result);
                console.log(`🔍 KBBI API: "${wordLower}" → ❌ Invalid (404)`);
                return result;
            }

            console.error(`❌ KBBI tidak dapat dijangkau setelah 2x percobaan: "${wordLower}" →`, retryError.message);
            console.warn(`⚠️ FALLBACK: "${wordLower}" dianggap valid (API down)`);
            return { valid: true, definition: '(tidak dapat diverifikasi - API timeout)' };
        }
    }

    const data = response.data;
    const isValid = Array.isArray(data.entries) && data.entries.length > 0;
    const definition = isValid
        ? (data.entries[0]?.definitions?.[0]?.definition || 'Tidak ada definisi')
        : '';

    const result: KbbiValidationResult = { valid: isValid, definition };

    // Simpan ke memory cache
    setCacheWithLimit(wordLower, result);

    // Simpan ke MongoDB cache (fire-and-forget)
    WordHistory.create({
        word: wordLower,
        isValid,
        definition,
        usageCount: 1,
        lastUsed: new Date()
    } as any).catch((dbErr: any) => {
        if (dbErr.code !== 11000) {
            console.warn('⚠️ MongoDB save failed:', dbErr.message);
        }
    });

    console.log(`🔍 KBBI API: "${wordLower}" → ${isValid ? '✅ Valid' : '❌ Invalid'}`);
    return result;
}

export function getRandomStartWord(level: number | string): string {
    // Ambil dari .env sesuai level
    const envKeys: Record<string, string | undefined> = {
        '1': process.env.SK_STARTER_L1,
        '2': process.env.SK_STARTER_L2,
        '3': process.env.SK_STARTER_L3,
        '4': process.env.SK_STARTER_L4,
        '5': process.env.SK_STARTER_L5
    };

    const envValue = envKeys[level.toString()];

    // Fallback hardcoded jika .env tidak diset
    const fallback: Record<string, string[]> = {
        '1': ['bola', 'makan', 'nasi', 'ikan', 'ayam', 'buku', 'meja', 'kursi'],
        '2': ['makan', 'rumah', 'bunga', 'pohon', 'langit', 'angin', 'hujan'],
        '3': ['sekolah', 'kantor', 'sungai', 'danau', 'gunung', 'pantai'],
        '4': ['pelajaran', 'perjalanan', 'kehidupan', 'pemerintah'],
        '5': ['pengetahuan', 'pembangunan', 'keberhasilan', 'permasalahan']
    };

    let words: string[];

    if (envValue && envValue.trim().length > 0) {
        // Parse dari .env (split koma, trim spasi, filter kosong)
        words = envValue
            .split(',')
            .map(w => w.trim().toLowerCase())
            .filter(w => w.length > 0);

        if (words.length === 0) {
            console.warn(`⚠️ SK_STARTER_L${level} kosong di .env, pakai fallback`);
            words = fallback[level.toString()];
        } else {
            console.log(`📋 SK_STARTER_L${level}: ${words.length} kata tersedia dari .env`);
        }
    } else {
        console.warn(`⚠️ SK_STARTER_L${level} tidak diset di .env, pakai fallback`);
        words = fallback[level.toString()];
    }

    // Ambil random dari list
    const picked = words[Math.floor(Math.random() * words.length)];
    console.log(`🎲 Starter word Level ${level}: "${picked}"`);
    return picked;
}

export function getWordSuffix(word: string, count: number): string {
    return word.slice(-count).toLowerCase();
}

export function checkWordPrefix(word: string, suffix: string): boolean {
    return word.toLowerCase().startsWith(suffix.toLowerCase());
}
