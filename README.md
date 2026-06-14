# Station Platform Prototype

A working local prototype for a browser-based radio station platform.

## What is included

- Public NTS-inspired station landing page
- Live now hero
- Channel cards
- Coming up schedule
- Recent broadcasts archive grid
- Creator booth call-to-action
- Private-style creator booth page
- Two browser audio decks
- Local audio file loading
- Play/pause per deck
- Crossfader
- Per-deck volume
- 3-band EQ
- External audio input via browser microphone/device
- Simulated Go Live button
- Master mix routed to a browser MediaStreamDestination for future WebRTC ingest

## Run locally

```bash
npm install
npm run dev
```

Then open the local URL Vite prints, usually:

```bash
http://localhost:5173
```

Do not open `index.html` directly.

## Important

This prototype does not yet connect to Icecast, LibreTime, or a real backend.

The production path is:

```txt
Creator Booth Web Audio master mix
→ WebRTC ingest server
→ FFmpeg or Liquidsoap encoder
→ Icecast
→ public station player
→ listeners
```

## Suggested next build step

Add a Node/WebRTC ingest server and connect the `MediaStreamDestination` from the creator booth to the backend. Then pipe that backend audio into FFmpeg or Liquidsoap and push to Icecast.
