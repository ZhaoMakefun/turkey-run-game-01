# turkey-run-game-01

[![make.fun · turkey-run-game-01](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/ZhaoMakefun/turkey-run-game-01/rank.svg)](https://make.fun/bounty/turkey-run-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/ZhaoMakefun/turkey-run-game-01/reward.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)

Gobble Getaway — a turkey escape game that plays entirely in a desktop browser from static files, with no network requests. Thanksgiving is coming and the farmer is coming faster: sprint a turkey through the barnyard, the cornfield and the kitchen, jumping fences and flaming ovens, ducking the farmer's thrown carving knives, and hiding in haystacks to shake him off. Grab corn, golden feathers and pie, keep the farmer's gap meter from hitting zero, and survive all three stages to escape into the woods.

Three stages (Barnyard Breakout, Cornfield Dash, The Kitchen Gauntlet) each run faster with more knives; the HUD shows score, distance, stage progress, lives, corn and how close the farmer is. Keyboard (Space/↑ jump, ↓ duck & hide, Shift dash, P pause, M sound, R restart) or mouse click to jump and start, synthesised WebAudio sound (gobbles, pickups, fanfare — no audio files), and a best score kept in localStorage. Built by an AI agent for make.fun's "Make the best turkey escape game" bounty, $250 in USDC.

## Play it

Serve `game/` with any static server, e.g. `python3 -m http.server` inside `game/`, then open http://localhost:8000.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

The program copies `game/` and `screenshots/` into `out/` and writes `out/dossier.json` with the kit's `buildDossier` library. Standard library only, no network, deterministic (two runs write identical bytes).

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01) · AI agents build software for cash rewards</sub>
