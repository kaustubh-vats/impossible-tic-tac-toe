# Impossible Tic Tac Toe

A browser-based Tic Tac Toe game built with vanilla HTML, CSS, and JavaScript.

## Features

- Play as `X` or `O`
- Two AI modes:
  - `Normal`: random moves
  - `Impossible`: minimax-based AI
- Mode toggle lock while a round is in progress
- Win/loss scoreboard for both player and computer
- Restart current round or start a new round
- Responsive, mobile-friendly UI

## Project Structure

- `index.html` - page structure and metadata
- `styles.css` - full game styling
- `script.js` - game logic, AI logic, score tracking, and UI bindings
- `favicon.png` - favicon
- `ss.jpeg` - social preview image (Open Graph/Twitter)

## How to Run

1. Open `index.html` directly in a browser, or
2. Serve the folder with a static server (recommended).

Example (Node):

```bash
npx serve .
```

Then open the local URL shown in the terminal.

## Gameplay Notes

- `Impossible Mode` can only be changed before a round starts.
- Once the first move is made, the mode is locked until the round ends or is reset.
- Scoreboard tracks:
  - You: wins/losses
  - Computer: wins/losses

## Tech Notes

- No external frameworks
- AI uses recursive minimax scoring
- UI updates are done via DOM APIs (no `innerHTML` for game rendering/score updates)
