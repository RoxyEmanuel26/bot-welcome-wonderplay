import mongoose from 'mongoose';

// Konstanta konfigurasi reconnect
const RECONNECT_DELAY_MS = 5000;    // Delay sebelum reconnect (5 detik)
const MAX_RECONNECT_ATTEMPTS = 10;   // Maksimal percobaan reconnect
let reconnectAttempts = 0;
let isConnecting = false;

/**
 * Fungsi untuk menghubungkan ke database MongoDB
 * dengan auto-reconnect jika koneksi terputus
 */
const connectDB = async (): Promise<void> => {
    // Cegah double-connecting
    if (isConnecting) return;
    isConnecting = true;

    try {
        const mongoURI = process.env.MONGODB_URI;

        if (!mongoURI) {
            console.error('❌ MONGODB_URI belum disetel di file .env');
            process.exit(1);
        }

        await mongoose.connect(mongoURI, {
            dbName: 'academy_drix_global',
            // Konfigurasi koneksi agar lebih robust
            serverSelectionTimeoutMS: 10000,   // Timeout 10 detik
            socketTimeoutMS: 45000,            // Socket socket 45 detik
            maxPoolSize: 10,                   // Maksimal 10 koneksi paralel
            retryWrites: true,
        });

        reconnectAttempts = 0;  // Reset counter setelah berhasil
        isConnecting = false;
        console.log(`✅ MongoDB Terkoneksi: academy_drix_global (Shared DB)`);

    } catch (error: unknown) {
        isConnecting = false;
        const message = error instanceof Error ? error.message : String(error);

        // Jika ini koneksi pertama (bot baru nyala), exit total
        if (reconnectAttempts === 0) {
            console.error(`❌ Gagal koneksi MongoDB awal: ${message}`);
            process.exit(1);
        }

        // Jika sudah mencapai batas retry
        if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
            console.error(`❌ MongoDB gagal reconnect setelah ${MAX_RECONNECT_ATTEMPTS}x percobaan. Bot shutdown.`);
            process.exit(1);
        }

        console.warn(`⚠️ Koneksi MongoDB gagal (percobaan ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}). Retry dalam ${RECONNECT_DELAY_MS / 1000}s...`);
        reconnectAttempts++;
        setTimeout(connectDB, RECONNECT_DELAY_MS);
    }
};

// ── EVENT LISTENERS MONGOOSE ─────────────────────────────────────

// Koneksi terputus (bukan saat startup)
mongoose.connection.on('disconnected', () => {
    if (isConnecting) return;  // Jangan trigger jika sedang proses connect
    console.warn('⚠️ MongoDB terputus! Mencoba reconnect...');
    reconnectAttempts++;
    setTimeout(connectDB, RECONNECT_DELAY_MS);
});

// Error pada koneksi yang sudah ada
mongoose.connection.on('error', (err: Error) => {
    console.error(`❌ MongoDB connection error: ${err.message}`);
    // Jangan exit, biarkan 'disconnected' event yang handle reconnect
});

// Koneksi berhasil terhubung ulang
mongoose.connection.on('reconnected', () => {
    reconnectAttempts = 0;
    console.log('✅ MongoDB berhasil terhubung kembali!');
});

// Koneksi pertama kali siap
mongoose.connection.once('open', () => {
    console.log('✅ MongoDB connection open dan siap digunakan.');
});

export default connectDB;
