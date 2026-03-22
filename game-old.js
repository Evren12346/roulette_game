class RouletteGame {
    constructor() {
        this.balance = parseInt(localStorage.getItem('roulette_balance')) || 100;
        this.selectedBet = null;
        this.betAmount = 10;
        this.isSpinning = false;
        this.wins = parseInt(localStorage.getItem('roulette_wins')) || 0;
        this.losses = parseInt(localStorage.getItem('roulette_losses')) || 0;
        this.streak = parseInt(localStorage.getItem('roulette_streak')) || 0;
        this.gamesPlayed = parseInt(localStorage.getItem('roulette_gamesPlayed')) || 0;
        this.topScore = parseInt(localStorage.getItem('roulette_topScore')) || 100;
        this.powerUps = JSON.parse(localStorage.getItem('roulette_powerUps')) || [];
        this.consecutiveWins = parseInt(localStorage.getItem('roulette_consecutiveWins')) || 0;
        this.activePowerUp = null;

        this.wheel = document.getElementById('wheel');
        this.spinBtn = document.getElementById('spin-btn');
        this.resultDiv = document.getElementById('result');
        this.balanceSpan = document.getElementById('balance');
        this.betInput = document.getElementById('bet-input');

        // Power-up definitions
        this.powerUpTypes = {
            noRed: {
                name: 'No Red',
                description: 'Removes red from wheel for one spin',
                icon: '🚫🔴',
                effect: 'removes red segment'
            },
            doubleWin: {
                name: 'Double Win',
                description: 'Double winnings on correct bet',
                icon: '💰✖️2',
                effect: 'doubles winnings'
            },
            freeSpin: {
                name: 'Free Spin',
                description: 'Spin without betting',
                icon: '🎰',
                effect: 'no bet required'
            },
            halfLoss: {
                name: 'Half Loss',
                description: 'Lose only half on wrong bet',
                icon: '🛡️',
                effect: 'reduces loss by half'
            },
            luckyGuess: {
                name: 'Lucky Guess',
                description: '50% chance to win any bet',
                icon: '🍀',
                effect: '50% override chance'
            }
        };

        this.init();
    }

    init() {
        this.updateDisplay();
        this.setupEventListeners();
        this.createWheelSegments();
        this.updatePowerUpDisplay();
    }

    setupEventListeners() {
        // Bet buttons
        document.querySelectorAll('.bet-btn').forEach(btn => {
            btn.addEventListener('click', () => this.selectBet(btn));
        });

        // Bet amount input
        this.betInput.addEventListener('input', (e) => {
            this.betAmount = Math.max(1, Math.min(parseInt(e.target.value) || 0, this.balance));
            e.target.value = this.betAmount;
            this.updateDisplay(); // Update button state when bet amount changes
        });

        // Spin button
        this.spinBtn.addEventListener('click', () => this.spin());
    }

    selectBet(btn) {
        // Remove previous selection
        document.querySelectorAll('.bet-btn').forEach(b => b.classList.remove('selected'));

        // Select new bet
        btn.classList.add('selected');
        this.selectedBet = {
            color: btn.dataset.color,
            multiplier: parseInt(btn.dataset.multiplier)
        };

        // Update button state after bet selection
        this.updateDisplay();
    }

    createWheelSegments() {
        // The wheel is created with CSS conic-gradient
        // Red: 0-120deg, Black: 120-240deg, Green: 240-360deg
    }

    spin() {
        if (this.isSpinning || (!this.selectedBet && !this.freeSpin) || (!this.freeSpin && this.betAmount > this.balance)) {
            return;
        }

        this.isSpinning = true;
        this.spinBtn.disabled = true;
        this.resultDiv.textContent = 'Spinning...';
        this.resultDiv.className = 'result spinning';

        // Only deduct bet if not a free spin
        if (!this.freeSpin) {
            this.balance -= this.betAmount;
        }
        this.gamesPlayed++;
        this.updateDisplay();

        // Calculate result
        const result = this.getRandomResult();
        let won = this.checkWin(result);

        // Apply power-up effects
        if (this.luckyGuess && !won) {
            // 50% chance to override loss
            if (Math.random() < 0.5) {
                won = true;
            }
        }

        // Animate wheel
        this.animateWheel(result, () => {
            this.showResult(result, won);
            this.isSpinning = false;
            this.spinBtn.disabled = false;
            this.resetPowerUps(); // Reset power-ups after spin
        });
    }

    getRandomResult() {
        // Weighted random: Red 45%, Black 45%, Green 10%
        const rand = Math.random();
        if (rand < 0.45) return 'red';
        if (rand < 0.9) return 'black';
        return 'green';
    }

    checkWin(result) {
        return result === this.selectedBet.color;
    }

    animateWheel(result, callback) {
        // Calculate rotation to land on the correct segment
        // The indicator at the top (0 degrees) will show the winning color
        const baseRotation = 1440; // 4 full rotations
        let targetAngle;

        switch(result) {
            case 'red': targetAngle = 60; break;    // Center of red segment (0-120deg)
            case 'black': targetAngle = 180; break; // Center of black segment (120-240deg)
            case 'green': targetAngle = 300; break; // Center of green segment (240-360deg)
        }

        const totalRotation = baseRotation + targetAngle;

        this.wheel.style.transform = `rotate(${totalRotation}deg)`;

        setTimeout(callback, 4000); // Match CSS animation duration
    }

    showResult(result, won) {
        let message, winnings = 0;

        if (won) {
            winnings = this.betAmount * (this.selectedBet.multiplier - 1);
            if (this.doubleWinnings) {
                winnings *= 2;
            }
            this.balance += winnings + this.betAmount; // Return bet + winnings
            this.wins++;
            this.streak++;
            this.consecutiveWins++;
            message = `🎉`;
            if (this.doubleWinnings) {
                message += ` 2️⃣`;
            }
            this.resultDiv.className = 'result win';
            this.playWinSound();

            // Check for power-up award every 3 consecutive wins
            if (this.consecutiveWins % 3 === 0) {
                const powerUp = this.awardRandomPowerUp();
                message += ` 🎁`;
            }
        } else {
            let lossAmount = this.betAmount;
            if (this.halfLoss) {
                lossAmount = Math.floor(lossAmount / 2);
                this.balance += this.betAmount - lossAmount; // Return half the loss
            }
            this.losses++;
            this.streak = 0;
            this.consecutiveWins = 0; // Reset consecutive wins on loss
            message = `💔`;
            if (this.halfLoss) {
                message += ` ⬇️`;
            }
            this.resultDiv.className = 'result lose';
            this.playLoseSound();
        }

        // Check for new top score
        if (this.balance > this.topScore) {
            this.topScore = this.balance;
            message += ` 🏆`;
        }

        this.resultDiv.textContent = message;
        this.updateDisplay();
        this.saveGame();

        // Clear result after 3 seconds
        setTimeout(() => {
            this.resultDiv.textContent = '';
            this.resultDiv.className = 'result';
        }, 3000);
    }

    updateDisplay() {
        this.balanceSpan.textContent = this.balance;
        document.getElementById('wins').textContent = this.wins;
        document.getElementById('losses').textContent = this.losses;
        document.getElementById('streak').textContent = this.streak;
        document.getElementById('gamesPlayed').textContent = this.gamesPlayed;
        document.getElementById('topScore').textContent = this.topScore;

        // Update spin button state - allow spin if bet selected OR free spin active
        this.spinBtn.disabled = this.isSpinning || (!this.selectedBet && !this.freeSpin) || (!this.freeSpin && this.betAmount > this.balance);
    }

    saveGame() {
        localStorage.setItem('roulette_balance', this.balance);
        localStorage.setItem('roulette_wins', this.wins);
        localStorage.setItem('roulette_losses', this.losses);
        localStorage.setItem('roulette_streak', this.streak);
        localStorage.setItem('roulette_gamesPlayed', this.gamesPlayed);
        localStorage.setItem('roulette_topScore', this.topScore);
        localStorage.setItem('roulette_powerUps', JSON.stringify(this.powerUps));
        localStorage.setItem('roulette_consecutiveWins', this.consecutiveWins);
    }

    playWinSound() {
        // Simple audio feedback using Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.2);

            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
        } catch (e) {
            // Audio not supported, silently fail
        }
    }

    playLoseSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(150, audioContext.currentTime + 0.3);

            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (e) {
            // Audio not supported, silently fail
        }
    }

    awardRandomPowerUp() {
        const powerUpKeys = Object.keys(this.powerUpTypes);
        const randomKey = powerUpKeys[Math.floor(Math.random() * powerUpKeys.length)];
        const powerUp = { ...this.powerUpTypes[randomKey], id: Date.now() };
        this.powerUps.push(powerUp);
        this.updatePowerUpDisplay();
        return powerUp;
    }

    usePowerUp(powerUpId) {
        if (this.isSpinning) return;

        const powerUpIndex = this.powerUps.findIndex(p => p.id === powerUpId);
        if (powerUpIndex === -1) return;

        const powerUp = this.powerUps[powerUpIndex];
        this.activePowerUp = powerUp;
        this.powerUps.splice(powerUpIndex, 1);
        this.updatePowerUpDisplay();

        // Apply power-up effect
        this.applyPowerUpEffect(powerUp);

        // Update button state after power-up activation
        this.updateDisplay();
    }

    applyPowerUpEffect(powerUp) {
        switch (powerUp.effect) {
            case 'removes red segment':
                // Modify getRandomResult to exclude red
                this.originalGetRandomResult = this.getRandomResult;
                this.getRandomResult = () => {
                    const rand = Math.random();
                    if (rand < 0.6) return 'black'; // 60% black
                    return 'green'; // 40% green
                };
                break;
            case 'doubles winnings':
                this.doubleWinnings = true;
                break;
            case 'no bet required':
                this.freeSpin = true;
                break;
            case 'reduces loss by half':
                this.halfLoss = true;
                break;
            case '50% override chance':
                this.luckyGuess = true;
                break;
        }

        // Show power-up activation message
        this.resultDiv.textContent = `⚡ ${powerUp.name} activated!`;
        this.resultDiv.className = 'result';
        setTimeout(() => {
            this.resultDiv.textContent = '';
        }, 2000);
    }

    resetPowerUps() {
        // Reset any active power-up effects
        if (this.originalGetRandomResult) {
            this.getRandomResult = this.originalGetRandomResult;
            this.originalGetRandomResult = null;
        }
        this.doubleWinnings = false;
        this.freeSpin = false;
        this.halfLoss = false;
        this.luckyGuess = false;
        this.activePowerUp = null;
    }

    updatePowerUpDisplay() {
        const powerUpContainer = document.getElementById('power-ups');
        if (!powerUpContainer) return;

        powerUpContainer.innerHTML = '';
        this.powerUps.forEach(powerUp => {
            const powerUpDiv = document.createElement('div');
            powerUpDiv.className = 'power-up-item';
            powerUpDiv.innerHTML = `
                <span class="power-up-icon">${powerUp.icon}</span>
                <span class="power-up-name">${powerUp.name}</span>
                <button class="use-power-up-btn" data-id="${powerUp.id}">Use</button>
            `;
            powerUpContainer.appendChild(powerUpDiv);
        });

        // Add event listeners for use buttons
        document.querySelectorAll('.use-power-up-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const powerUpId = parseInt(e.target.dataset.id);
                this.usePowerUp(powerUpId);
            });
        });
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new RouletteGame();
});