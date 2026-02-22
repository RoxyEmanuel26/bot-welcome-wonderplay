# 🎮 Wonderplay Welcome Bot

Welcome to the **Wonderplay Welcome Bot** repository! This is a feature-rich, clean-architecture Discord bot built with Discord.js (v14), designed to greet new members dynamically using Canvas for customized welcome cards and Gemini AI for personalized welcome messages.

## ✨ Features

- **Clean Architecture (v3.5):** Organized into clean `commands`, `events`, and `utils` modules.
- **Dual Command System:** Supports both Prefix Commands (e.g., `!welcome`) and Slash Commands (`/welcome`).
- **Dynamic Welcome Messages:**
  - Auto-greets new members when they join the server (`guildMemberAdd` event).
  - Can be triggered manually via `/welcome` or `!welcome`.
- **Canvas Integration:** Generates beautiful, customized welcome images for each new member.
- **AI-Powered:** Uses Google's generative AI (Gemini) to craft smart, unique welcome messages.
- **Server Stats:** Built-in commands and managers to handle server statistics (`stats.js`).
- **Permissions & Cooldowns:** Built-in spam prevention and permission checks.

## 🛠️ Tech Stack

- [Node.js](https://nodejs.org/) (v16.0.0 or higher)
- [Discord.js (v14)](https://discord.js.org/)
- [Canvas](https://www.npmjs.com/package/canvas)
- [@google/generative-ai](https://www.npmjs.com/package/@google/generative-ai)
- [dotenv](https://www.npmjs.com/package/dotenv)

## 🚀 Getting Started

### Prerequisites

You need **Node.js 16.0.0+** installed on your machine.

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd bot-welcome-wonderplay
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configuration:**
   Create a folder named `config` in the root directory if it doesn't exist, and create a `.env` file inside it:
   ```bash
   mkdir config
   # Create a .env file inside the config folder
   ```
   
   Add the following variables to your `config/.env` file:
   ```env
   # config/.env
   DISCORD_TOKEN=your_discord_bot_token_here
   WELCOME_CHANNEL_ID=your_welcome_channel_id_here
   GEMINI_API_KEY=your_google_gemini_api_key_here  # If required by generative-ai implementation
   ```

### Running the Bot

**For Development (auto-restart on file changes):**
```bash
npm run dev
```

**For Production:**
```bash
npm start
```

## 📁 Project Structure

```text
bot-welcome-wonderplay/
├── config/
│   └── .env                 # Environment variables
├── src/
│   ├── commands/            # Slash & Prefix commands (e.g., welcome, stats)
│   ├── events/              # Event listeners (e.g., ready, guildMemberAdd)
│   ├── utils/               # Utilities (welcomeHandler, messageLoader, statsManager)
│   └── index.js             # Main entry point & command/event loader
├── package.json
└── README.md
```

## 📝 Commands

- `/welcome` (`!welcome`) - Send a welcome message to a specific user.
- `/stats` (`!stats`) - View server statistics.

*(Use `/` in your Discord server to explore all available slash commands).*

## 📄 License

This project is licensed under the ISC License.
