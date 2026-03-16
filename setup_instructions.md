# SkillSwap — Setup Instructions

## Prerequisites
- Node.js 18+ installed
- npm or bun package manager
- Supabase account (free)
- Metered.ca account for TURN server (free)

## Step 1 — Clone the repository
git clone https://github.com/sshriish/SkillSwap.git
cd SkillSwap

## Step 2 — Install dependencies
npm install

## Step 3 — Set up environment variables
Create a `.env` file in the root folder with:

VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
VITE_TURN_URL=your_turn_server_url
VITE_TURN_USERNAME=your_turn_username
VITE_TURN_CREDENTIAL=your_turn_credential

## Step 4 — Set up Supabase database
1. Go to https://supabase.com and create a project
2. Go to SQL Editor
3. Run the SQL from supabase/migrations/ folder

## Step 5 — Run the app
npm run dev

## Step 6 — Open in browser
Visit http://localhost:5173

## Deployment
The app is deployed on Vercel and auto-deploys on every GitHub push.
Live URL: https://swap-and-share-live-git-main-sshriishs-projects.vercel.app
```

Click **"Commit changes"**

---

## Step 3 — Create `demo video link.txt`

Click **"Add file"** → **"Create new file"**
Name it: `demo video link.txt`
Paste this:
```
SkillSwap Demo Video
=====================
Live App: https://swap-and-share-live-git-main-sshriishs-projects.vercel.app

Demo Video: [Upload your demo video to YouTube and paste the link here]
