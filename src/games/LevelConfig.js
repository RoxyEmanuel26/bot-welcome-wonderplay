export const LEVELS = {
    1: {
        name: "Pemula",
        color: "#00FF87",
        timeLimit: 20,
        lives: 5,
        maxPoint: 5,
        systemDesc: "100% 1 huruf",
        getSuffixCount: () => 1
    },
    2: {
        name: "Mudah",
        color: "#00B4D8",
        timeLimit: 15,
        lives: 4,
        maxPoint: 8,
        systemDesc: "50% 1 huruf | 50% 2 huruf",
        getSuffixCount: () => (Math.random() < 0.5 ? 1 : 2)
    },
    3: {
        name: "Menengah",
        color: "#FFB703",
        timeLimit: 13,
        lives: 3,
        maxPoint: 10,
        systemDesc: "25% 1 huruf | 60% 2 huruf | 15% 3 huruf",
        getSuffixCount: () => {
            const rand = Math.random() * 100;
            if (rand < 25) return 1;
            if (rand < 85) return 2;
            return 3;
        }
    },
    4: {
        name: "Sulit",
        color: "#FF6B35",
        timeLimit: 10,
        lives: 2,
        maxPoint: 12,
        systemDesc: "50% 2 huruf | 50% 3 huruf",
        getSuffixCount: () => (Math.random() < 0.5 ? 2 : 3)
    },
    5: {
        name: "Brutal 💀",
        color: "#FF0054",
        timeLimit: 7,
        lives: 1,
        maxPoint: 15,
        systemDesc: "25% 2 huruf | 75% 3 huruf",
        getSuffixCount: () => (Math.random() < 0.25 ? 2 : 3)
    }
};

export function getMultiplier(wordLength) {
    if (wordLength <= 2) return 0.30;
    if (wordLength === 3) return 0.45;
    if (wordLength === 4) return 0.60;
    if (wordLength === 5) return 0.75;
    if (wordLength === 6) return 0.88;
    if (wordLength === 7) return 1.00;
    if (wordLength === 8) return 1.15;
    if (wordLength === 9) return 1.25;
    if (wordLength === 10) return 1.40;
    if (wordLength === 11) return 1.55;
    if (wordLength === 12) return 1.70;
    return 2.00;   // 13+ huruf
}

export function getLengthFeedback(wordLength) {
    if (wordLength <= 3) return "💡 Kata pendek! Jawab kata lebih panjang untuk poin lebih besar.";
    if (wordLength <= 5) return "👍 Lumayan! Coba kata yang lebih panjang untuk bonus poin.";
    if (wordLength <= 7) return "✅ Bagus! Ini adalah panjang kata standar.";
    if (wordLength <= 9) return "🔥 Kata panjang! Poin bonus aktif!";
    if (wordLength <= 11) return "⚡ Luar biasa! Kata sangat panjang = poin besar!";
    return "👑 MASTER! Kata ultra panjang = poin MAKSIMAL!";
}
