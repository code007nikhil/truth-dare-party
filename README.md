# Truth & Dare – Friends Party

A free, open-source party game for friends. Create a room, share a 5-letter code, talk over voice or video, and play Truth or Dare where **your friends write the questions and dares**: there is no preset question bank.

Built with **Next.js**, **Tailwind CSS**, **Supabase** (rooms, game state, realtime) and **WebRTC via PeerJS** (voice and video).

> Everything runs in the browser. No accounts, no sign-up forms: players join with a name and an avatar.

---

## Features

**Game**
- Create a room and share an invite code or link; friends join with the code
- A random player is picked each turn, and everyone gets a turn before anyone repeats
- The chosen player picks **Truth** or **Dare**
- Every other player writes a question or dare; **only the host sees them** and picks one (or lets friends say it out loud on the call)
- The host can change the pick, then marks it **Completed** or **Not completed**; scores show on each tile
- Only the host controls the game: start, skip a player, end the game

**Room**
- Voice and video calls (camera is opt-in; voice-first by default)
- Active speaker moves to the top of the room with a green ring
- Raise hand for everyone; the host sees a "Raised hands" bar and can lower any hand
- Host tools: make any player the host, or remove a player
- Text chat with an emoji picker
- 20 built-in avatars, chosen before entering the room (host included)
- Players can join or leave at any time; stale or disconnected players are cleaned up automatically
- Responsive layout: tall chat panel on the right for desktop, stacked layout on tablets and phones

---

## How a turn works

```
Lobby ──► Random player picked ──► Player chooses Truth or Dare
                                          │
                                          ▼
          Friends write a question/dare (or say it out loud on the call)
                                          │
                                          ▼
          Host picks one (can change the pick) ──► Player does it
                                          │
                                          ▼
          Host marks Completed / Not completed ──► Next random player
```

---

## Tech stack

| Part | Technology |
| --- | --- |
| Framework | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS |
| Database, auth, realtime | Supabase (Postgres, anonymous auth, Realtime) |
| Voice and video | WebRTC through [PeerJS](https://peerjs.com/) (peer-to-peer mesh) |
| Chat | Supabase Realtime Broadcast (not stored) |

---

## Getting started

### Prerequisites

- Node.js 18.17 or newer
- A free [Supabase](https://supabase.com) project

### 1. Install

```bash
git clone <your-repo-url>
cd truth-dare-party
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com).
2. Go to **Authentication → Providers** and enable **Anonymous sign-ins**.
3. Open the **SQL Editor**, paste the contents of [`supabase/schema.sql`](supabase/schema.sql) and run it. The script is safe to re-run after updates.
4. Go to **Project Settings → API** and copy your **Project URL** and **anon / publishable key**.

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-OR-PUBLISHABLE-KEY
```

The anon/publishable key is designed to be used in the browser. Access is protected by the Row Level Security rules in `schema.sql`. Never put your `service_role` key in this project.

### 4. Run

```bash
npm run dev
```

Open <http://localhost:3000>. To test alone, open a second browser tab: each tab is its own player.

---

## Playing with friends

Browsers only allow microphone and camera access on **https** (or `localhost`), so friends on other devices need a public https URL.

**Deploy to Vercel (recommended)**

1. Push the repo to GitHub and import it in [Vercel](https://vercel.com).
2. Add the two environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
3. Deploy and share your URL.

**Or tunnel your local server**

```bash
npx localtunnel --port 3000
# or: ngrok http 3000
```

---

## Project structure

```
app/
  page.tsx                 Landing page (create / join, creator credit, support card)
  icon.svg, favicon.ico,   Favicon and home-screen icon
  apple-icon.png
  room/[code]/page.tsx     Join screen (name, avatar, camera) then the room
components/
  RoomView.tsx             Room layout and all game screens
  VideoTile.tsx            Video/avatar tile (speaking ring, raised hand, host tools)
  Chat.tsx                 Chat with emoji picker
  Avatar.tsx               The 20 SVG avatars
  AvatarPicker.tsx         Avatar chooser
  SuggestBox.tsx           Box where friends write a question/dare
  TurnReveal.tsx           "Picking the next player" animation
hooks/
  useRoom.ts               Rooms, game state, realtime, presence, WebRTC calls
  useSpeaking.ts           Active-speaker detection
lib/
  supabase.ts              Browser Supabase client
  types.ts                 Shared types
  avatars.ts               Avatar names and colours
public/images/
  Qrcode.png | Qrcode.jpg  Your UPI QR code, shown on the landing page (optional)
supabase/
  schema.sql               Tables, security rules and game functions
```

---

## How it works

- **Game logic lives in the database.** The client only calls Postgres functions with `supabase.rpc(...)` (`create_room`, `join_room`, `start_game`, `choose_kind`, `submit_suggestion`, `select_challenge`, `mark_result`, `kick_player`, and so on). Turn order and permissions (for example "only the host can mark a result") are enforced on the server, not in the browser.
- **Realtime.** Every client subscribes to changes on its room and refreshes its view. A safety-net refresh runs alongside the heartbeat.
- **Row Level Security.** Players can read room data, but cannot write game state directly; they can only change their own mic/camera flags. Suggestions are private: the host sees all of them, everyone else sees only their own.
- **Presence and heartbeat.** Each client sends a heartbeat every 10 seconds. A player silent for 45 seconds is removed, and the turn moves on. If the host drops, the longest-present player becomes host automatically.
- **Voice and video.** Each player opens a PeerJS peer and shares its id through Supabase Presence; every pair of players then connects directly (peer-to-peer mesh). Audio and video never pass through your Supabase project.
- **Chat.** Sent over Supabase Realtime Broadcast. It is **not stored**: messages disappear when the page reloads and late joiners don't see earlier ones.
- **Anonymous identity.** Each browser tab signs in anonymously and keeps its session in `sessionStorage`, so every tab is a separate player.

---

## Customizing

| Want to change | Where |
| --- | --- |
| Look and colours | `tailwind.config.ts`, `app/globals.css` |
| Avatars | `components/Avatar.tsx`, `lib/avatars.ts` (the count is also checked in `schema.sql`: `avatar between 0 and 19`) |
| Creator name, UPI ID, QR code | Constants at the top of `app/page.tsx`, and the image in `public/images/` |
| Favicon | `app/icon.svg`, `app/favicon.ico`, `app/apple-icon.png` |
| Stale-player timeout | `interval '45 seconds'` in the `heartbeat` function in `schema.sql` |
| Speaking sensitivity | `THRESHOLD` in `hooks/useSpeaking.ts` |
| Game rules and flow | `supabase/schema.sql` (server) and `components/RoomView.tsx` (UI) |

---

## Troubleshooting

| Problem | Fix |
| --- | --- |
| "Supabase isn't configured" | Create `.env.local` from `.env.example` and restart `npm run dev` |
| "Sign-in failed" | Enable **Anonymous sign-ins** in Supabase (Authentication → Providers) |
| Errors like "function … does not exist" | Run (or re-run) `supabase/schema.sql` |
| No microphone or camera prompt | You must use https or `localhost`; check browser site permissions |
| Camera missing when testing with two different browsers on one computer | Many systems let only one app use the webcam. Use two tabs of the same browser, or turn the camera on in only one |
| Two tabs behave as the same player | You used "Duplicate tab". Open the invite link in a brand-new tab instead |
| Can't hear someone | Click **Tap to hear** on their tile (browser autoplay rules), and check they aren't muted |
| Terminal shows `GET /images/Qrcode.png 404` | Harmless. The landing page tries `Qrcode.png`, then falls back to `Qrcode.jpg`. Keep only the extension you use in `QR_SOURCES` in `app/page.tsx` to silence it |
| Players on some mobile or office networks can't connect to each other | They may need a TURN relay server (see below) |

---

## Limitations

- **Group size:** the peer-to-peer mesh works well for roughly 6 to 8 people; beyond that video gets heavy for everyone's device.
- **Network traversal:** the default setup uses PeerJS's free public signaling server and public STUN servers. Strict networks may need a TURN server; pass `config: { iceServers: [...] }` when creating the `Peer` in `hooks/useRoom.ts`.
- **Public signaling server:** the free PeerJS cloud is best-effort. For production, [self-host a PeerServer](https://github.com/peers/peerjs-server).
- **Room codes are short** and rooms are readable by any signed-in user who knows the code. Treat rooms as casual and private by obscurity.
- **Removing a player** blocks that browser session; someone who opens a brand-new session gets a new identity.
- **Chat is ephemeral** by design.
- **Scaling video:** to support larger rooms, replace the PeerJS section of `useRoom.ts` with an SFU such as [LiveKit](https://livekit.io/).

---

## Credits and support

Designed and developed by **Nikhil Thakur**.

If you enjoy the game, there is a "Buy me a coffee" card on the landing page with a UPI ID and QR code.

**Forking this project?** Replace the name, UPI ID and QR image with your own (or remove the support card) in `app/page.tsx` and `public/images/`, so contributions go to you.

---

## Contributing

Issues and pull requests are welcome. Before opening a PR:

```bash
npx tsc --noEmit
npm run build
```

If you change the database, update `supabase/schema.sql` and keep it safe to re-run.

---

## Acknowledgements

Built with [Next.js](https://nextjs.org/), [Tailwind CSS](https://tailwindcss.com/), [Supabase](https://supabase.com/) and [PeerJS](https://peerjs.com/). The avatars are original illustrations drawn for this project.