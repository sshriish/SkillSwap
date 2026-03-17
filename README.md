# 🔄 SkillSwap

> Trade skills, grow together.

SkillSwap is a free peer-to-peer skill exchange platform where users teach each other through live video calls using a credit-based economy.

## 🌐 Live App
👉 [Visit SkillSwap](https://swap-and-share-live-git-main-sshriishs-projects.vercel.app)

## ✨ Features

- 🎥 **Live Video Calls** — HD peer-to-peer video with WebRTC
- 💳 **Credit System** — Earn credits by teaching, spend them to learn
- 🤝 **Smart Matching** — Find peers based on skills offered and wanted
- 🖥️ **Screen Sharing** — Share your screen during sessions
- ⭐ **Reviews & Ratings** — Rate peers after every session
- 🔔 **Notifications** — Get notified when someone requests a session
- 🎬 **Trial Videos** — Upload an intro video so peers can decide
- 🏆 **Badge System** — Earn badges as you teach and learn
- 🌙 **Dark Mode** — Easy on the eyes

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS + shadcn/ui |
| Backend | Supabase (PostgreSQL + Auth + Realtime) |
| Video | WebRTC + Metered TURN Server |
| Deployment | Vercel |

## 🚀 Getting Started
```sh
git clone https://github.com/sshriish/SkillSwap.git
cd SkillSwap
npm install
npm run dev
```

## 📁 Project Structure
```
src/
├── pages/          # Landing, Auth, Dashboard, Profile, Matching, Sessions, VideoCall, Credits
├── components/     # AppLayout, VideoControls, ChatPanel + 35 UI components
├── hooks/          # useAuth, useWebRTC, use-mobile, use-toast
└── integrations/   # Supabase client + types
```

## 👨‍💻 Developer

Built by **sshriish** — 2026
