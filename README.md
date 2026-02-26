# Apex Terminal

A high-density, single-page trading terminal with a code-editor-inspired sandy theme.

## Features
- Live-updating watchlist with simulated prices and change percentages.
- Interactive chart area with time-range toggles.
- Simulated Level II bid/ask order book and trade tape.
- Order ticket that appends filled executions to a blotter.
- Portfolio snapshot panel.
- Live news wire that polls Yahoo Finance search news and falls back to simulated headlines if the endpoint is unavailable.

## News source behavior
- Primary source: `https://query1.finance.yahoo.com/v1/finance/search?q=market&newsCount=8`
- Polling cadence: every 15 seconds.
- If remote fetch fails, the UI continues with simulated fallback headlines and clearly labels this in the news panel.

## Run locally
```bash
python3 -m http.server 4173
```
Then open `http://localhost:4173`.
