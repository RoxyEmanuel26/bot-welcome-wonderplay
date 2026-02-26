import mongoose from 'mongoose';

/**
 * Fungsi untuk menghubungkan ke database MongoDB
 * @returns {Promise<mongoose.Connection>}
 */
const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI;

        if (!mongoURI) {
            console.error('❌ MONGODB_URI belum disetel di file .env');
            // Keluar dari proses dengan gagal
            process.exit(1);
        }

        const conn = await mongoose.connect(mongoURI, {
            dbName: 'academy_drix_global'
        });

        console.log(`✅ MongoDB Terkoneksi: academy_drix_global (Shared DB) - Host: ${conn.connection.host}`);
        return conn;
    } catch (error) {
        console.error(`❌ Error Koneksi MongoDB: ${error.message}`);
        process.exit(1);
    }
};

export default connectDB;
