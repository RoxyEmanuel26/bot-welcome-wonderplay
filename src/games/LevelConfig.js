export const LEVELS = {
    1: {
        name: "Pemula",
        color: "#00FF87",
        timeLimit: 20,
        lives: 5,
        maxPoint: 5,
        minWordLength: 3,
        systemDesc: "100% 1 huruf",
        getSuffixCount: () => 1
    },
    2: {
        name: "Mudah",
        color: "#00B4D8",
        timeLimit: 15,
        lives: 4,
        maxPoint: 8,
        minWordLength: 3,
        systemDesc: "50% 1 huruf | 50% 2 huruf",
        getSuffixCount: () => (Math.random() < 0.5 ? 1 : 2)
    },
    3: {
        name: "Menengah",
        color: "#FFB703",
        timeLimit: 13,
        lives: 3,
        maxPoint: 10,
        minWordLength: 4,
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
        minWordLength: 4,
        systemDesc: "50% 2 huruf | 50% 3 huruf",
        getSuffixCount: () => (Math.random() < 0.5 ? 2 : 3)
    },
    5: {
        name: "Brutal 💀",
        color: "#FF0054",
        timeLimit: 7,
        lives: 1,
        maxPoint: 15,
        minWordLength: 5,
        systemDesc: "25% 2 huruf | 75% 3 huruf",
        getSuffixCount: () => (Math.random() < 0.25 ? 2 : 3)
    }
};
