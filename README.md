# 🎮 Wonderplay Welcome Bot

Bot Discord multifungsi yang powerful, dibangun dengan **Clean Architecture** menggunakan **Discord.js v14**. Bot ini menyambut member baru dengan pesan dinamis, gambar Canvas, AI Gemini, dan dilengkapi fitur **Valorant Team Roulette** untuk pembagian tim otomatis!

---

## ✨ Fitur Utama

### 1. 👋 Welcome System
Menyambut member baru secara otomatis ketika bergabung ke server.
- Pesan welcome dari **2000+ template** di `pesan.txt`
- **Canvas Welcome Image** — Banner keren dengan avatar, nama, dan nomor member
- **AI Gemini** — Generate ucapan unik dan lucu secara otomatis
- **Rich Embed** — Tampilan kotak berwarna yang profesional
- **Hot Reload** — Edit `pesan.txt` tanpa restart bot

### 2. 👋 Goodbye System
Mengirimkan pesan perpisahan otomatis saat member meninggalkan server.

### 3. 🛡️ Auto-Role
Secara otomatis memberikan Role kepada member baru yang bergabung.

### 4. 🎯 Valorant Team Roulette
Fitur terkeren! Membagi tim Valorant secara acak langsung dari voice channel.
- Deteksi otomatis siapa saja yang ada di voice channel
- Pembagian tim **Attackers vs Defenders** secara random
- Bisa **exclude** player yang tidak ikut main
- **Random Map** dari 12 map Valorant (Bind, Haven, Split, Ascent, Icebox, Breeze, Fracture, Pearl, Lotus, Sunset, Abyss, Corrode) lengkap dengan gambar
- **Tombol Re-Roll** interaktif (Re-Roll Team / Map / Semua)
- **Match History** tercatat otomatis
- Jika jumlah ganjil → 1 orang jadi Spectator

### 5. 📊 Server Stats (Always-On)
Statistik bot yang selalu menyala dan sinkron dengan server Discord secara real-time.
- Total Members (live sync)
- Total Welcomes sent
- Messages Pool
- Last Welcome timestamp

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
| `?roulettevoice @user1 @user2` | Semua Member | Acak tim, exclude user yang di-tag |
| `?testroulettevoice` | Administrator | Test roulette dengan dummy data |
| `?testroulettevoice 6` | Administrator | Test roulette dengan jumlah pemain tertentu |

### Slash Commands (`/`)

| Command | Permission | Deskripsi |
|---------|-----------|-----------|
| `/welcome @user` | Manage Guild | Kirim welcome message ke user tertentu |

---

## 🛠️ Tech Stack

- [Node.js](https://nodejs.org/) (v16.0.0+)
- [Discord.js v14](https://discord.js.org/)
- [Canvas](https://www.npmjs.com/package/canvas) — Generate welcome images
- [@google/generative-ai](https://www.npmjs.com/package/@google/generative-ai) — AI welcome messages
- [dotenv](https://www.npmjs.com/package/dotenv) — Environment variables

---

## 🚀 Getting Started

### Prerequisites

- **Node.js 16.0.0+** — [Download di sini](https://nodejs.org/)
- **Discord Bot Token** — [Buat di Discord Developer Portal](https://discord.com/developers/applications)
- **Gemini API Key** *(opsional)* — [Dapatkan di Google AI Studio](https://aistudio.google.com/)

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

   Edit file `config/.env`:
   ```env
   DISCORD_TOKEN=your_discord_bot_token_here
   OPENAI_API_KEY=your_openai_api_key_here
   WELCOME_CHANNEL_ID=your_welcome_channel_id_here
   GEMINI_API_KEY=your_google_gemini_api_key_here

   # ======== PENGATURAN MODUL BOT ========
   FITUR_WELCOME=on
   FITUR_GOODBYE=on
   FITUR_ROULETTE=on

   # ==== PENGATURAN TAMPILAN WELCOME ====
   USE_EMBED=on
   USE_CANVAS_IMAGE=on
   USE_GEMINI_AI=on

   # ========= FITUR AUTO ROLE =========
   FITUR_AUTO_ROLE=off
   AUTO_ROLE_ID=masukkan_discord_role_id_member_disini

   # Bot Owners (Discord User ID, pisah pakai koma)
   BOT_OWNERS=your_discord_user_id_here
   ```

### Running the Bot

**Development (auto-restart):**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

---

## 🎛️ Konfigurasi Fitur (ON/OFF)

Semua fitur bisa dinyalakan atau dimatikan melalui file `config/.env`:

| Variabel | Fungsi | Default |
|----------|--------|---------|
| `FITUR_WELCOME` | Pesan welcome otomatis saat member join | `on` |
| `FITUR_GOODBYE` | Pesan goodbye otomatis saat member leave | `on` |
| `FITUR_ROULETTE` | Fitur Valorant Team Roulette | `on` |
| `USE_EMBED` | Kirim pesan dalam format Rich Embed | `on` |
| `USE_CANVAS_IMAGE` | Generate gambar welcome dengan Canvas | `on` |
| `USE_GEMINI_AI` | AI-generated welcome messages | `on` |
| `FITUR_AUTO_ROLE` | Beri role otomatis ke member baru | `off` |

---

## 📁 Project Structure

```text
bot-welcome-wonderplay/
├── assets/                  # Gambar map Valorant (12 maps)
├── config/
│   ├── .env                 # Environment variables (RAHASIA)
│   └── .env.example         # Template konfigurasi
├── src/
│   ├── commands/
│   │   ├── rouletteVoice.js      # ?roulettevoice command
│   │   ├── testRouletteVoice.js  # ?testroulettevoice (admin test)
│   │   ├── fitur.js              # ?fitur command (help/menu)
│   │   ├── stats.js              # !stats command
│   │   ├── welcome.js            # /welcome slash command
│   │   ├── welcomePrefix.js      # !welcome prefix command
│   │   └── welc.js               # !welc test command
│   ├── events/
│   │   ├── ready.js              # Bot startup event
│   │   ├── guildMemberAdd.js     # Member join event
│   │   └── guildMemberRemove.js  # Member leave event
│   ├── utils/
│   │   ├── welcomeHandler.js     # Welcome message handler
│   │   ├── canvasBuilder.js      # Canvas image generator
│   │   ├── aiGenerator.js        # Gemini AI message generator
│   │   ├── messageLoader.js      # Template message loader
│   │   ├── statsManager.js       # Statistics manager
│   │   ├── matchHistory.js       # Match history tracker
│   │   ├── valorantMaps.js       # Valorant maps & team splitter
│   │   └── permissions.js        # Permission checker
│   └── index.js                  # Main entry point
├── pesan.txt                # 2000+ template welcome messages
├── stats.json               # Bot statistics data
├── match_history.json       # Roulette match history
├── package.json
├── .gitignore
└── README.md
```

---

## 📄 License

This project is licensed under the ISC License.
