# SCRAPFALL

An original retro first-person mech shooter with online co-op for 1–8 pilots, set in the Rust Valley junkyard.

[Play the hosted game](https://neon-four-desmond.yummypin134.chatgpt.site/)

## Play

Create a squad, share its invite link or eight-character code, and have the squad leader launch the operation. Defend the salvage core through three waves of rogue mechs. The squad loses if core integrity reaches zero.

- **WASD:** move and strafe
- **Mouse or Left/Right arrows:** aim
- **Click or Space:** fire dual autocannons
- **Escape:** release controls / pause your input (the shared match continues)
- **Touchscreens:** movement/fire buttons and drag-to-aim controls

Unlimited ammo is balanced by weapon heat. Armor repairs near the core. Destroyed mechs redeploy after six seconds at a cost of 25 core integrity. There is no friendly fire.

## Technology

React and TypeScript, Vinext/Vite, a Canvas raycasting renderer, Cloudflare Workers, and a D1 SQLite database. Multiplayer uses periodic HTTP synchronization with server-validated movement, shots, and optimistic concurrency control.

## Local development

Use Node.js 24 and pnpm 11.25.0. From the repository root:

```sh
pnpm install --frozen-lockfile
pnpm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_spotty_absorbing_man.sql
pnpm run dev
```

Open the URL printed by the development server. The build supplies the local D1 configuration; the migration creates the room table. The existing migration should be applied once to a fresh local database.

The current hosted deployment runs through ChatGPT Sites. This repository backs up the full source; uploading to GitHub alone does not deploy its multiplayer backend. See [starter setup details](docs/starter-setup.md) for the retained framework and hosting instructions.

## Tests

```sh
node --experimental-strip-types tests/mech.mjs
node --experimental-strip-types tests/full-squad.mjs
node --experimental-strip-types tests/concurrent-squad.mjs
node --experimental-strip-types tests/regressions.mjs
node --experimental-strip-types tests/reconnect.mjs
node node_modules/typescript/bin/tsc --noEmit
```

The tests cover eight simulated pilots, three complete waves, concurrent API handlers with SQLite, movement and weapon validation, cover, respawning, reconnects, leader transfer, victory, and defeat. Automated simulations do not substitute for testing eight physical devices over live networks.

## Source map

- `app/page.tsx` — squad lobby, input, HUD, synchronization
- `app/lib/render.ts` — retro renderer, mech sprites, cockpit and radar
- `app/lib/mech.ts` — authoritative game rules and enemy pathfinding
- `app/api/mech/route.ts` — multiplayer API and concurrency control
- `db/` and `drizzle/` — database schema and migrations
- `tests/` — game and multiplayer regression tests

Mechs, junkyard visuals, and gameplay code are original to this project.
