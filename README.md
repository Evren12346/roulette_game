# Lucky Roulette

A simple yet addictive luck-based roulette game with a dark, modern interface.

## Features

- **Simple Gameplay**: Bet on Red, Black, or Green with different multipliers
- **Visual Feedback**: Smooth spinning wheel animation with satisfying results
- **Audio Effects**: Win/lose sound feedback for enhanced experience
- **Statistics Tracking**: Keep track of wins, losses, win streaks, games played, and top score
- **Power-Up System**: Earn power-ups every 3 consecutive wins for strategic advantages
- **Persistent Balance**: Your balance and stats save automatically
- **Responsive Design**: Works on desktop and mobile devices
- **Top Score Challenge**: Try to beat your personal best balance!
## Power-Ups

Earn power-ups every 3 consecutive wins in a row! Use them strategically to improve your odds:

- **🚫🔴 No Red**: Removes red from the wheel for one spin (better odds for black/green)
- **💰✖️2 Double Win**: Double your winnings on a correct bet
- **🎰 Free Spin**: Spin the wheel without betting any money
- **🛡️ Half Loss**: Lose only half your bet amount on incorrect bets
- **🍀 Lucky Guess**: 50% chance to win any bet you place
## How to Play

1. **Place Your Bet**: Choose Red (2x payout), Black (2x payout), or Green (10x payout)
2. **Set Bet Amount**: Enter how much you want to bet (up to your current balance)
3. **Spin!**: Click the SPIN button to start the wheel
4. **Watch & Win**: The wheel spins and lands on a color - match your bet to win!

## Odds
- **Red**: 44.5% chance, 2x payout
- **Black**: 44.5% chance, 2x payout  
- **Green**: 11% chance, 10x payout

## Install (macOS, Linux, Windows)

### 1) Clone the repository

```bash
git clone https://github.com/Evren12346/roulette_game.git
cd roulette_game
```

### 2) Install prerequisites

#### macOS

Install Node.js (includes npm):

```bash
brew install node
```

Verify:

```bash
node -v
npm -v
```

#### Linux (Ubuntu/Debian)

Install Node.js and npm:

```bash
sudo apt update
sudo apt install -y nodejs npm
```

Verify:

```bash
node -v
npm -v
```

#### Windows (PowerShell)

Install Node.js using winget:

```powershell
winget install OpenJS.NodeJS.LTS
```

Then open a new terminal and verify:

```powershell
node -v
npm -v
```

### 3) Install project dependencies

```bash
npm install
```

### 4) Start the game (desktop app)

```bash
npm start
```

## Run as Browser Version (optional)

If you prefer running the static web version in a browser, use a local server.

### macOS / Linux

```bash
python3 -m http.server 8000
```

### Windows (PowerShell)

```powershell
py -m http.server 8000
```

Open: http://localhost:8000

## Running the Game

### As Desktop App (Recommended)
```bash
npm start
```

### As Web App
```bash
python3 -m http.server 8000
```
Then open http://localhost:8000 in your browser

## Game Mechanics

- Start with $100 balance
- Minimum bet: $1
- Maximum bet: Your current balance
- Stats persist between sessions
- Win streaks encourage continued play
- Track total games played and your highest balance achieved
- Try to beat your personal top score!

## Tips for Addiction-Free Play

Remember this is a game of pure chance! Set limits and play responsibly.