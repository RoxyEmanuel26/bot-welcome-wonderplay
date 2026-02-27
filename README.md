# 🎮 Wonderplay Welcome Bot v3.5 (TypeScript Edition)

Bot Discord multifungsi yang powerful, dibangun dengan **Clean Architecture (TypeScript)** menggunakan **Discord.js v14** dan **MongoDB**. Bot ini dilengkapi game seru (Sambung Kata, Quiz) dan **Valorant Team Roulette** untuk pembagian tim otomatis!

---

## ✨ Fitur Utama

### 1. 👋 Welcome System (Instan)
Menyambut member baru secara otomatis ketika bergabung ke server.
- Pesan welcome dari **2000+ template** di `pesan.txt`
- **Canvas Welcome Image** — Banner keren dengan avatar, nama, dan nomor member
- **Rich Embed** — Tampilan kotak berwarna yang profesional
- **Hot Reload** — Edit `pesan.txt` tanpa restart bot

### 2. 👋 Goodbye System
Mengirimkan pesan perpisahan otomatis saat member meninggalkan server.

### 3. 🛡️ Auto-Role
Secara otomatis memberikan Role kepada member baru yang bergabung.

### 4. 🎮 Discord Games terintegrasi MongoDB
- **Sambung Kata**: Game interaktif berbatas waktu dengan nyawa (lives) dan skor otomatis tersimpan di Database MongoDB (Shared DB).
- **Leaderboard Global/Seminggu/Sebulan**: Sistem poin terpadu.

### 5. 🎯 Valorant Team Roulette
Fitur terkeren! Membagi tim Valorant secara acak langsung dari voice channel.
- Deteksi otomatis siapa saja yang ada di voice channel
- Pembagian tim **Attackers vs Defenders** secara random
- **Random Map** dari 12 map Valorant lengkap dengan gambar
- **Tombol Re-Roll** interaktif (Re-Roll Team / Map / Semua)

### 6. 📊 Server Stats (Always-On) & Auto-Reconnect DB
- Statistik bot yang menyala dan sinkron secara real-time.
- **Sistem Resilient**: MongoDB akan otomatis reconnect maksimum 10x percobaan jika koneksi tiba-tiba terputus dari *cloud*.
- **Graceful Shutdown**: Pembersihan memori otomatis (game di-cancel) jika bot direstart mendadak.

---

## 📝 Daftar Commands

### Prefix Commands (`!` atau `?`)

| Command | Permission | Deskripsi |
|---------|-----------|-----------|
| `!welcome @user` | Manage Guild | Kirim welcome message ke user tertentu |
| `!welc` | Administrator | Test welcome message di channel target |
| `!stats` | Administrator | Lihat statistik bot |
| `?fitur` | Semua Member | Menampilkan menu bantuan dan semua command bot |
| `?roulettevoice` | Semua Member | Acak pembagian tim Valorant dari voice |
| `?testroulettevoice` | Administrator | Test roulette dengan dummy data |

### Slash Commands (`/`)

| Command | Permission | Deskripsi |
|---------|-----------|-----------|
| `/welcome @user` | Manage Guild | Kirim welcome message ke user tertentu |
| `/sk` | Semua Member | Mulai permainan Sambung Kata |
| `/skstats` | Semua Member | Menampilkan profil stat pemain |
| `/sktop` | Semua Member | Menampilkan Leaderboard Poin Global |

---

## 🛠️ Tech Stack

- **[TypeScript 5+](https://www.typescriptlang.org/)** (Strict Mode Enabled)
- [Node.js](https://nodejs.org/) (v18.0.0+)
- [Discord.js v14](https://discord.js.org/)
- [Mongoose](https://mongoosejs.com/) — MongoDB ODM
- [Canvas](https://www.npmjs.com/package/canvas) — Generate welcome images

---

## 🚀 Getting Started

### Prerequisites

- **Node.js 18.0.0+** — [Download di sini](https://nodejs.org/)
- **MongoDB Cluster** — URL `mongodb+srv://...`
- **Discord Bot Token** — [Buat di Discord Developer Portal](https://discord.com/developers/applications)

### Installation

1. **Clone repository:**
   ```bash
   git clone <repository-url>
   cd bot-welcome-wonderplay
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Konfigurasi Environment:**
   Salin template `.env.example` dan isi dengan data Anda:
   ```bash
   cp config/.env.example config/.env
   ```

4. **Kompilasi TypeScript:**
   ```bash
   npm run build
   ```

5. **Daftarkan Slash Command Pertama Kali:**
   ```bash
   npm run deploy
   ```

### Running the Bot

**Development (auto-restart by tsx):**
```bash
npm run dev
```

**Production:**
```bash
npm run deploy:prod  # Opsional: Jika command berubah
npm start
```

---

## 🎛️ Konfigurasi Fitur (ON/OFF)

Semua fitur bisa dinyalakan atau dimatikan melalui file `config/.env`:

| Variabel | Fungsi | Default |
|----------|--------|---------|
| `MONGODB_URI` | Alamat Cluster Database MongoDB | *(wajib)* |
| `CLIENT_ID` | Application/Client ID Bot Anda | *(wajib)* |
| `FITUR_WELCOME` | Pesan welcome otomatis saat member join | `on` |
| `FITUR_GOODBYE` | Pesan goodbye otomatis saat member leave | `on` |
| `FITUR_ROULETTE` | Fitur Valorant Team Roulette | `on` |
| `USE_EMBED` | Kirim pesan dalam format Rich Embed | `on` |
| `USE_CANVAS_IMAGE` | Generate gambar welcome dengan Canvas | `on` |

---

## 📁 Project Structure

```text
bot-welcome-wonderplay/
├── assets/                  # Gambar map Valorant (12 maps)
├── config/
│   ├── .env                 # Environment variables (RAHASIA)
│   └── .env.example         # Template konfigurasi
├── src/
│   ├── commands/            # Seluruh command Prefix (.ts) & Slash commands
│   ├── database/
│   │   ├── models/          # Mongoose Schema Collections
│   │   └── connection.ts    # Auto-Reconnect DB Logic
│   ├── events/              # Event system (ready, messageCreate, etc)
│   ├── games/               # Logika sistem game (Sambung Kata)
│   ├── types/               # Type Definition kustom TypeScript
│   ├── utils/               # Modul generator dan handler pembantu 
│   ├── deploy-commands.ts   # Script Pendaftaran Slash Command
│   └── index.ts             # Main entry point bot
├── pesan.txt                # 2000+ template welcome messages
├── tsconfig.json            # Konfigurasi TypeScript Compiler Strict
├── package.json
└── README.md
```

---

## 📄 License

This project is licensed under the ISC License.
