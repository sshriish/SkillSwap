# SkillSwap

SkillSwap is a peer-to-peer platform where users exchange skills with each other instead of paying for lessons or services — teach what you know, learn what you don't.

🔗 **Live Demo:** https://skillswap-ten-coral.vercel.app

## Features

- 🔄 Skill matching between users
- 💬 Real-time chat / video calling (WebRTC via TURN relay)
- 🔐 Authentication and user profiles
- ⚡ Fast, modern frontend built with Vite + React

## Tech Stack

- **Frontend:** React, Vite, TypeScript, shadcn/ui, Tailwind CSS
- **Backend / Database:** Supabase (Postgres, Auth, Realtime)
- **Video/Voice:** WebRTC with TURN relay (Metered.live)
- **Deployment:** Vercel
- **CI:** GitHub Actions (keeps the Supabase project active on a schedule)

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Installation

```bash
git clone https://github.com/sshriish/SkillSwap.git
cd SkillSwap
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and fill in your own values:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `VITE_SUPABASE_PROJECT_ID` | Your Supabase project ID |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public API key |
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_TURN_URL` | TURN server URL for WebRTC relay |
| `VITE_TURN_USERNAME` | TURN server username |
| `VITE_TURN_CREDENTIAL` | TURN server credential |

### Run locally

```bash
npm run dev
```

App runs at `http://localhost:5173` by default.

### Run tests

```bash
npm run test
```

## Project Structure
SkillSwap/
├── src/            # Application source code
├── public/         # Static assets
├── supabase/       # Supabase config/migrations
└── .github/        # CI workflows
## Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request.
