class RouletteGame {
    constructor() {
        // Game Settings
        this.difficulty = localStorage.getItem('roulette_difficulty') || 'normal';
        this.soundEnabled = localStorage.getItem('roulette_sound') !== 'false';
        this.spinSpeed = parseInt(localStorage.getItem('roulette_spinSpeed')) || 3;
        this.theme = localStorage.getItem('roulette_theme') || 'dark';

        // Game State
        this.balance = parseInt(localStorage.getItem('roulette_balance')) || this.getStartingBalance();
        this.selectedBet = null;
        this.betAmount = 10;
        this.currentRotation = 0;
        this.isSpinning = false;
        this.wins = parseInt(localStorage.getItem('roulette_wins')) || 0;
        this.losses = parseInt(localStorage.getItem('roulette_losses')) || 0;
        this.streak = parseInt(localStorage.getItem('roulette_streak')) || 0;
        this.gamesPlayed = parseInt(localStorage.getItem('roulette_gamesPlayed')) || 0;
        this.topScore = parseInt(localStorage.getItem('roulette_topScore')) || this.getStartingBalance();
        this.powerUps = JSON.parse(localStorage.getItem('roulette_powerUps')) || [];
        this.consecutiveWins = parseInt(localStorage.getItem('roulette_consecutiveWins')) || 0;
        this.consecutiveLosses = parseInt(localStorage.getItem('roulette_consecutiveLosses')) || 0;
        this.readyPowerUp = JSON.parse(localStorage.getItem('roulette_readyPowerUp')) || null;
        this.tier = localStorage.getItem('roulette_tier') || 'Novice';
        this.tierExp = parseInt(localStorage.getItem('roulette_tierExp')) || 0;
        this.checkpointThresholds = [1000, 10000, 100000, 1000000];
        const savedCheckpointIndex = parseInt(localStorage.getItem('roulette_checkpointIndex'), 10);
        const savedCheckpointThreshold = parseInt(localStorage.getItem('roulette_checkpointThreshold'), 10);
        this.checkpointIndex = Number.isNaN(savedCheckpointIndex) ? -1 : savedCheckpointIndex;
        this.checkpointThreshold = Number.isNaN(savedCheckpointThreshold) ? 0 : savedCheckpointThreshold;
        this.checkpointState = JSON.parse(localStorage.getItem('roulette_checkpointState')) || null;
        this.luckySpinCharge = parseInt(localStorage.getItem('roulette_luckySpinCharge')) || 0;
        this.luckySpinReady = localStorage.getItem('roulette_luckySpinReady') === 'true';
        this.luckySpinActiveThisSpin = false;
        this.sessionGoal = JSON.parse(localStorage.getItem('roulette_sessionGoal')) || null;
        this.comboMultiplier = 1;
        this.nearMissWindow = 0.03;

        // Undo System
        this.undoUses = parseInt(localStorage.getItem('roulette_undoUses')) || 2;
        this.maxUndoUses = 2;
        this.lastGameState = null;

        // Betting History
        this.bettingHistory = JSON.parse(localStorage.getItem('roulette_history')) || [];
        this.maxHistoryItems = 10;

        // Achievements
        this.achievements = {
            first_win: { name: 'First Win', desc: 'Win your first bet', icon: '🎉', unlocked: false },
            ten_wins: { name: 'Ten Times', desc: 'Reach 10 wins', icon: '🔟', unlocked: false },
            high_roller: { name: 'High Roller', desc: 'Reach $500', icon: '💰', unlocked: false },
            lucky_streak: { name: 'Lucky Streak', desc: 'Win 5 in a row', icon: '🔥', unlocked: false },
            power_collector: { name: 'Power Collector', desc: 'Collect 3 power-ups', icon: '⚡', unlocked: false },
            millionaire: { name: 'Millionaire', desc: 'Reach $1000', icon: '👑', unlocked: false }
        };
        this.loadAchievements();

        // Daily Challenges
        this.dailyChallenges = [
            { id: 'wins_5', title: 'Win 5 Times', target: 5, current: 0, reward: 50, completed: false },
            { id: 'streak_3', title: 'Get 3 Streak', target: 3, current: 0, reward: 75, completed: false },
            { id: 'green_twice', title: 'Hit Green 2x', target: 2, current: 0, reward: 100, completed: false },
            { id: 'earn_500', title: 'Earn $500', target: 500, current: 0, reward: 150, completed: false }
        ];
        this.loadDailyChallenges();

        // Tier System
        this.tiers = ['Novice', 'Apprentice', 'Expert', 'Master', 'Legend', 'Mythic'];
        this.tierThresholds = [0, 100, 250, 500, 1000, 2000];

        // DOM Elements
        this.wheelContainer = document.querySelector('.wheel-container');
        this.indicator = document.querySelector('.indicator');
        this.wheel = document.getElementById('wheel');
        this.spinBtn = document.getElementById('spin-btn');
        this.undoBtn = document.getElementById('undo-btn');
        this.restartRunBtn = document.getElementById('restart-run-btn');
        this.resultDiv = document.getElementById('result');
        this.checkpointStatus = document.getElementById('checkpoint-status');
        this.balanceSpan = document.getElementById('balance');
        this.betInput = document.getElementById('bet-input');
        this.toastContainer = document.getElementById('toast-container');
        this.luckyMeterFill = document.getElementById('lucky-meter-fill');
        this.luckyMeterLabel = document.getElementById('lucky-meter-label');
        this.comboStatus = document.getElementById('combo-status');
        this.sessionGoalDiv = document.getElementById('session-goal');

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

        this.powerDownTypes = {
            extraHouseEdge: {
                name: 'Extra House Edge',
                description: 'Red chance increased for one spin',
                icon: '📉🔴',
                effect: 'increase red chance'
            },
            weakWinnings: {
                name: 'Weak Winnings',
                description: 'Win payouts halved for one spin',
                icon: '💸',
                effect: 'half payout'
            },
            noUndo: {
                name: 'No Undo',
                description: 'Undo disabled for one spin',
                icon: '🚫↶',
                effect: 'disable undo'
            },
            randomBet: {
                name: 'Random Bet',
                description: 'Bet selection randomized for one spin',
                icon: '🎲',
                effect: 'randomize bet'
            }
        };

        this.activePowerDown = null;
        this.noUndo = false;
        this.higherRed = false;
        this.halfPayout = false;
        this.randomizeBet = false;

        this.init();
    }

    getStartingBalance() {
        switch(this.difficulty) {
            case 'easy': return 500;
            case 'hard': return 50;
            default: return 100;
        }
    }

    init() {
        this.applyTheme();
        this.initSessionGoal();
        this.updateDisplay();
        this.setupEventListeners();
        this.updatePowerUpDisplay();
        this.updateAchievementsDisplay();
        this.updateDailyChallengesDisplay();
        this.updateBettingHistory();
        this.updateLuckyMeter();
        this.updateComboStatus();
        this.updateSessionGoalDisplay();
        this.applySelectedBet();
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
            this.updateDisplay();
        });

        // Spin button
        this.spinBtn.addEventListener('click', () => this.spin());

        // Undo button
        this.undoBtn.addEventListener('click', () => this.undo());

        // Restart run button
        this.restartRunBtn.addEventListener('click', () => this.restartRun());

        // Quick bet buttons
        document.querySelectorAll('.quick-bet-btn').forEach(btn => {
            btn.addEventListener('click', () => this.adjustBetAmount(btn.dataset.action));
        });

        // Settings Modal
        document.getElementById('settings-btn').addEventListener('click', () => this.openSettings());
        document.querySelector('.close').addEventListener('click', () => this.closeSettings());
        document.getElementById('theme-toggle').addEventListener('click', () => this.toggleTheme());
        document.getElementById('sound-toggle').addEventListener('click', () => this.toggleSound());
        document.getElementById('reset-btn').addEventListener('click', () => this.resetGame());
        document.getElementById('export-btn').addEventListener('click', () => this.exportStats());
        document.getElementById('spin-speed').addEventListener('change', (e) => this.setSpinSpeed(e.target.value));
        document.getElementById('difficulty-select').addEventListener('change', (e) => this.setDifficulty(e.target.value));

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('settings-modal');
            if (e.target === modal) this.closeSettings();
        });
    }

    openSettings() {
        document.getElementById('settings-modal').classList.add('show');
    }

    closeSettings() {
        document.getElementById('settings-modal').classList.remove('show');
    }

    toggleTheme() {
        this.theme = this.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('roulette_theme', this.theme);
        this.applyTheme();
    }

    applyTheme() {
        if (this.theme === 'light') {
            document.body.classList.add('light-mode');
        } else {
            document.body.classList.remove('light-mode');
        }
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        localStorage.setItem('roulette_sound', this.soundEnabled);
        const btn = document.getElementById('sound-toggle');
        btn.textContent = this.soundEnabled ? '🔊' : '🔇';
    }

    setSpinSpeed(speed) {
        this.spinSpeed = parseInt(speed);
        localStorage.setItem('roulette_spinSpeed', this.spinSpeed);
        const speedLabels = ['Very Slow', 'Slow', 'Normal', 'Fast', 'Very Fast'];
        document.getElementById('speed-label').textContent = speedLabels[this.spinSpeed - 1];
    }

    setDifficulty(difficulty) {
        this.difficulty = difficulty;
        localStorage.setItem('roulette_difficulty', this.difficulty);
        alert('Difficulty will apply to next session. Reset if you want new starting balance.');
    }

    selectBet(btn) {
        document.querySelectorAll('.bet-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.selectedBet = {
            color: btn.dataset.color,
            multiplier: parseInt(btn.dataset.multiplier)
        };
        this.updateDisplay();
    }

    applySelectedBet() {
        document.querySelectorAll('.bet-btn').forEach(btn => {
            btn.classList.toggle('selected', this.selectedBet && btn.dataset.color === this.selectedBet.color);
        });
    }

    adjustBetAmount(action) {
        const actions = {
            plus10: () => Math.min(this.balance, this.betAmount + 10),
            double: () => Math.min(this.balance, Math.max(1, this.betAmount * 2)),
            half: () => Math.max(1, Math.floor(this.balance / 2)),
            allin: () => Math.max(1, this.balance)
        };

        const nextAmount = actions[action] ? actions[action]() : this.betAmount;
        this.betAmount = nextAmount;
        this.betInput.value = this.betAmount;
        this.updateDisplay();
    }

    formatCurrency(value) {
        return `$${value.toLocaleString()}`;
    }

    showToast(message, type = 'info') {
        if (!this.toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        this.toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            setTimeout(() => toast.remove(), 200);
        }, 2400);
    }

    updateLuckyMeter() {
        if (!this.luckyMeterFill || !this.luckyMeterLabel) return;

        const progress = this.luckySpinReady ? 100 : Math.min(100, (this.luckySpinCharge / 5) * 100);
        this.luckyMeterFill.style.width = `${progress}%`;
        this.luckyMeterLabel.textContent = this.luckySpinReady ? 'READY' : `${this.luckySpinCharge}/5`;
    }

    advanceLuckyMeter(amount = 1) {
        if (this.luckySpinReady) {
            return;
        }

        this.luckySpinCharge = Math.min(5, this.luckySpinCharge + amount);
        if (this.luckySpinCharge >= 5) {
            this.luckySpinReady = true;
            this.showToast('Lucky Spin is ready: next spin gets a bonus effect.', 'success');
        }

        this.updateLuckyMeter();
    }

    chooseRandomSessionGoal() {
        const templates = [
            { type: 'wins_in_spins', title: 'Win 3 of the next 5 spins', reward: 120, targetWins: 3, targetSpins: 5 },
            { type: 'hit_green', title: 'Hit green once', reward: 150, target: 1 },
            { type: 'streak', title: 'Reach a 4-win streak', reward: 160, target: 4 },
            { type: 'profit', title: 'Earn $250 this session', reward: 140, target: 250 }
        ];

        const choice = templates[Math.floor(Math.random() * templates.length)];
        return {
            ...choice,
            progress: 0,
            spinsUsed: 0,
            wins: 0,
            startBalance: this.balance
        };
    }

    initSessionGoal() {
        if (!this.sessionGoal) {
            this.sessionGoal = this.chooseRandomSessionGoal();
            this.saveSessionGoal();
        }
    }

    saveSessionGoal() {
        localStorage.setItem('roulette_sessionGoal', JSON.stringify(this.sessionGoal));
    }

    updateSessionGoalDisplay() {
        if (!this.sessionGoalDiv || !this.sessionGoal) return;

        let progressText = '';
        switch (this.sessionGoal.type) {
            case 'wins_in_spins':
                progressText = `${this.sessionGoal.wins}/${this.sessionGoal.targetWins} wins • ${this.sessionGoal.spinsUsed}/${this.sessionGoal.targetSpins} spins`;
                break;
            case 'hit_green':
                progressText = `${this.sessionGoal.progress}/${this.sessionGoal.target} hits`;
                break;
            case 'streak':
                progressText = `${this.sessionGoal.progress}/${this.sessionGoal.target} streak`;
                break;
            case 'profit':
                progressText = `${this.formatCurrency(this.sessionGoal.progress)} / ${this.formatCurrency(this.sessionGoal.target)}`;
                break;
        }

        this.sessionGoalDiv.innerHTML = `
            <div class="session-goal-title">${this.sessionGoal.title}</div>
            <div class="session-goal-progress">${progressText} • Reward ${this.formatCurrency(this.sessionGoal.reward)}</div>
        `;
    }

    completeSessionGoal() {
        this.balance += this.sessionGoal.reward;
        this.showToast(`Session goal complete: +${this.formatCurrency(this.sessionGoal.reward)}`, 'success');
        this.sessionGoal = this.chooseRandomSessionGoal();
        this.saveSessionGoal();
        this.updateSessionGoalDisplay();
    }

    updateSessionGoalAfterSpin(result, won) {
        if (!this.sessionGoal) return;

        switch (this.sessionGoal.type) {
            case 'wins_in_spins': {
                this.sessionGoal.spinsUsed += 1;
                if (won) this.sessionGoal.wins += 1;

                const reached = this.sessionGoal.wins >= this.sessionGoal.targetWins;
                const exhausted = this.sessionGoal.spinsUsed >= this.sessionGoal.targetSpins;
                if (reached) {
                    this.completeSessionGoal();
                    return;
                }
                if (exhausted) {
                    this.showToast('Session goal expired. New goal!', 'warning');
                    this.sessionGoal = this.chooseRandomSessionGoal();
                }
                break;
            }
            case 'hit_green':
                if (result === 'green') {
                    this.sessionGoal.progress += 1;
                }
                if (this.sessionGoal.progress >= this.sessionGoal.target) {
                    this.completeSessionGoal();
                    return;
                }
                break;
            case 'streak':
                this.sessionGoal.progress = this.streak;
                if (this.sessionGoal.progress >= this.sessionGoal.target) {
                    this.completeSessionGoal();
                    return;
                }
                break;
            case 'profit':
                this.sessionGoal.progress = Math.max(0, this.balance - this.sessionGoal.startBalance);
                if (this.sessionGoal.progress >= this.sessionGoal.target) {
                    this.completeSessionGoal();
                    return;
                }
                break;
        }

        this.saveSessionGoal();
        this.updateSessionGoalDisplay();
    }

    getComboBonusMultiplier() {
        if (this.streak >= 6) return 1.35;
        if (this.streak >= 4) return 1.2;
        if (this.streak >= 2) return 1.1;
        return 1;
    }

    updateComboStatus() {
        this.comboMultiplier = this.getComboBonusMultiplier();
        if (this.comboStatus) {
            this.comboStatus.textContent = `Combo: x${this.comboMultiplier.toFixed(2)}`;
        }
    }

    getSpinOutcome() {
        let rand = Math.random();
        let boundaries;
        let color;

        if (this.noRed) {
            boundaries = [0.6];
            color = rand < boundaries[0] ? 'black' : 'green';
        } else if (this.higherRed) {
            boundaries = [0.7, 0.95];
            if (rand < boundaries[0]) color = 'red';
            else if (rand < boundaries[1]) color = 'black';
            else color = 'green';
        } else {
            boundaries = [0.445, 0.89];
            if (rand < boundaries[0]) color = 'red';
            else if (rand < boundaries[1]) color = 'black';
            else color = 'green';
        }

        const nearMiss = boundaries.some(boundary => Math.abs(rand - boundary) <= this.nearMissWindow);
        return { color, nearMiss };
    }

    triggerNearMissDrama() {
        if (!this.wheelContainer || !this.indicator) return;

        this.wheelContainer.classList.remove('near-miss-pulse');
        this.indicator.classList.remove('near-miss-flash');

        void this.wheelContainer.offsetWidth;

        this.wheelContainer.classList.add('near-miss-pulse');
        this.indicator.classList.add('near-miss-flash');

        setTimeout(() => {
            this.wheelContainer.classList.remove('near-miss-pulse');
            this.indicator.classList.remove('near-miss-flash');
        }, 500);
    }

    getSerializableState() {
        return {
            balance: this.balance,
            selectedBet: this.selectedBet ? { ...this.selectedBet } : null,
            betAmount: this.betAmount,
            currentRotation: this.currentRotation,
            wins: this.wins,
            losses: this.losses,
            streak: this.streak,
            gamesPlayed: this.gamesPlayed,
            topScore: this.topScore,
            powerUps: this.powerUps.map(powerUp => ({ ...powerUp })),
            consecutiveWins: this.consecutiveWins,
            consecutiveLosses: this.consecutiveLosses,
            readyPowerUp: this.readyPowerUp ? { ...this.readyPowerUp } : null,
            tier: this.tier,
            tierExp: this.tierExp,
            undoUses: this.undoUses,
            bettingHistory: this.bettingHistory.map(item => ({ ...item })),
            achievements: JSON.parse(JSON.stringify(this.achievements)),
            dailyChallenges: JSON.parse(JSON.stringify(this.dailyChallenges)),
            luckySpinCharge: this.luckySpinCharge,
            luckySpinReady: this.luckySpinReady,
            sessionGoal: this.sessionGoal ? { ...this.sessionGoal } : null
        };
    }

    applySerializableState(state) {
        this.balance = state.balance;
        this.selectedBet = state.selectedBet ? { ...state.selectedBet } : null;
        this.betAmount = state.betAmount;
        this.currentRotation = state.currentRotation || 0;
        this.wins = state.wins;
        this.losses = state.losses;
        this.streak = state.streak;
        this.gamesPlayed = state.gamesPlayed;
        this.topScore = state.topScore;
        this.powerUps = (state.powerUps || []).map(powerUp => ({ ...powerUp }));
        this.consecutiveWins = state.consecutiveWins;
        this.consecutiveLosses = state.consecutiveLosses;
        this.readyPowerUp = state.readyPowerUp ? { ...state.readyPowerUp } : null;
        this.tier = state.tier;
        this.tierExp = state.tierExp;
        this.undoUses = state.undoUses;
        this.bettingHistory = (state.bettingHistory || []).map(item => ({ ...item }));
        this.achievements = JSON.parse(JSON.stringify(state.achievements));
        this.dailyChallenges = JSON.parse(JSON.stringify(state.dailyChallenges));
        this.luckySpinCharge = state.luckySpinCharge || 0;
        this.luckySpinReady = !!state.luckySpinReady;
        this.sessionGoal = state.sessionGoal ? { ...state.sessionGoal } : this.chooseRandomSessionGoal();
        this.luckySpinActiveThisSpin = false;
        this.lastGameState = null;
        this.resetPowerUps();
        this.applySelectedBet();
        this.betInput.value = this.betAmount;
        this.wheel.style.transition = 'none';
        this.wheel.style.transform = `rotate(${this.currentRotation}deg)`;
        void this.wheel.offsetWidth;
        this.wheel.style.transition = '';
        this.updateAchievementsDisplay();
        this.updateDailyChallengesDisplay();
        this.updateBettingHistory();
        this.updatePowerUpDisplay();
        this.updateTier();
        this.updateDisplay();
        this.updateLuckyMeter();
        this.updateComboStatus();
        this.updateSessionGoalDisplay();
    }

    saveCheckpoint(index) {
        this.checkpointIndex = index;
        this.checkpointThreshold = this.checkpointThresholds[index];
        this.checkpointState = this.getSerializableState();
    }

    checkForCheckpoint() {
        let reachedIndex = this.checkpointIndex;

        for (let i = this.checkpointIndex + 1; i < this.checkpointThresholds.length; i++) {
            if (this.balance >= this.checkpointThresholds[i]) {
                reachedIndex = i;
            } else {
                break;
            }
        }

        if (reachedIndex > this.checkpointIndex) {
            this.saveCheckpoint(reachedIndex);
            return this.checkpointThreshold;
        }

        return null;
    }

    restartRun() {
        if (!this.checkpointState || this.isSpinning) {
            return;
        }

        this.applySerializableState(this.checkpointState);
        this.saveGame();

        this.resultDiv.textContent = `↺ Restarted from ${this.formatCurrency(this.checkpointThreshold)} checkpoint`;
        this.resultDiv.className = 'result';
        this.showToast(`Run restarted from ${this.formatCurrency(this.checkpointThreshold)}.`, 'info');
        setTimeout(() => {
            this.resultDiv.textContent = '';
        }, 2500);
    }

    spin() {
        if (this.isSpinning || (!this.selectedBet && !this.freeSpin) || (!this.freeSpin && this.betAmount > this.balance)) {
            return;
        }

        // Apply queued power-up from 3-loss streak
        if (this.readyPowerUp) {
            this.resultDiv.textContent = `⚡ ${this.readyPowerUp.name} auto-activated!`;
            this.usePowerUp(this.readyPowerUp.id);
            this.readyPowerUp = null;
            this.updatePowerUpDisplay();
        }

        // Apply power-down effects that could influence this spin
        if (this.randomizeBet && !this.freeSpin) {
            const betBtns = Array.from(document.querySelectorAll('.bet-btn'));
            if (betBtns.length > 0) {
                const randomBtn = betBtns[Math.floor(Math.random() * betBtns.length)];
                this.selectBet(randomBtn);
                this.resultDiv.textContent = `🎲 Random bet applied: ${this.selectedBet.color}`;
            }
        }

        // Save game state for undo
        this.lastGameState = {
            balance: this.balance,
            wins: this.wins,
            losses: this.losses,
            streak: this.streak,
            consecutiveWins: this.consecutiveWins,
            consecutiveLosses: this.consecutiveLosses
        };
        this.luckySpinActiveThisSpin = this.luckySpinReady;

        this.isSpinning = true;
        this.spinBtn.disabled = true;
        this.undoBtn.disabled = true;
        this.resultDiv.textContent = 'Spinning...';
        this.resultDiv.className = 'result spinning';

        if (!this.freeSpin) {
            this.balance -= this.betAmount;
        }
        this.gamesPlayed++;
        this.updateDisplay();

        const outcome = this.getSpinOutcome();
        const result = outcome.color;
        const nearMiss = outcome.nearMiss;
        let won = this.checkWin(result);

        if (this.luckyGuess && !won) {
            if (Math.random() < 0.5) {
                won = true;
            }
        }

        const spinDuration = this.spinSpeed === 1 ? 2 : this.spinSpeed === 2 ? 3 : this.spinSpeed === 3 ? 4 : this.spinSpeed === 4 ? 5 : 6;

        this.animateWheel(result, () => {
            this.showResult(result, won, nearMiss);
            this.isSpinning = false;
            this.spinBtn.disabled = false;
            this.undoBtn.disabled = false;
            this.resetPowerUps();
        }, spinDuration);
    }

    getRandomResult() {
        if (this.noRed) {
            const rand = Math.random();
            if (rand < 0.6) return 'black';
            return 'green';
        }

        if (this.higherRed) {
            const rand = Math.random();
            if (rand < 0.7) return 'red';
            if (rand < 0.95) return 'black';
            return 'green';
        }

        const rand = Math.random();
        if (rand < 0.445) return 'red';
        if (rand < 0.89) return 'black';
        return 'green';
    }

    checkWin(result) {
        return result === this.selectedBet.color;
    }

    animateWheel(result, callback, duration) {
        const baseRotation = 3600 + (this.spinSpeed - 1) * 720; // at least 10 full spins
        const targetAngles = {
            red: 300,
            black: 180,
            green: 60
        };
        const normalizedRotation = ((this.currentRotation % 360) + 360) % 360;
        const targetAngle = targetAngles[result];
        const adjustment = (targetAngle - normalizedRotation + 360) % 360;
        const nextRotation = this.currentRotation + baseRotation + adjustment;

        this.currentRotation = nextRotation;
        const animationDuration = `${duration}s`;

        this.wheel.style.transition = `transform ${animationDuration} cubic-bezier(0.25, 0.1, 0.25, 1)`;
        this.wheel.style.transform = `rotate(${nextRotation}deg)`;

        setTimeout(callback, duration * 1000);
    }

    showResult(result, won, nearMiss = false) {
        let message, winnings = 0;
        let baseMultiplier = this.selectedBet.multiplier;
        let netDelta = 0;

        // Progressive multiplier based on streak
        if (this.streak >= 5) baseMultiplier *= 1.25;
        if (this.streak >= 10) baseMultiplier *= 1.5;

        if (won) {
            winnings = this.betAmount * (baseMultiplier - 1);
            if (this.doubleWinnings) {
                winnings *= 2;
            }
            if (this.halfPayout) {
                winnings = Math.floor(winnings / 2);
            }
            if (this.luckySpinActiveThisSpin) {
                winnings = Math.floor(winnings * 1.5);
            }
            winnings = Math.floor(winnings * this.comboMultiplier);
            this.balance += winnings + this.betAmount;
            this.wins++;
            this.streak++;
            this.consecutiveWins++;
            this.consecutiveLosses = 0;
            this.tierExp += 10;
            netDelta = winnings;

            message = `🎉 ${result.toUpperCase()} +${this.formatCurrency(winnings)}`;
            if (this.doubleWinnings) message += ` 2️⃣`;
            if (this.luckySpinActiveThisSpin) message += ` ✨`;
            if (this.comboMultiplier > 1) message += ` 🔥`;

            this.updateChallenge('wins_5');
            this.updateChallenge('streak_3');
            if (result === 'green') this.updateChallenge('green_twice');

            this.checkAchievements();
            this.resultDiv.className = 'result win';
            this.playWinSound();

            if (this.consecutiveWins % 3 === 0) {
                const powerUp = this.awardRandomPowerUp();
                message += ` 🎁`;
            }
        } else {
            let lossAmount = this.betAmount;
            if (this.halfLoss) {
                lossAmount = Math.floor(lossAmount / 2);
                this.balance += this.betAmount - lossAmount;
            }
            if (this.luckySpinActiveThisSpin) {
                const refund = Math.floor(lossAmount / 2);
                this.balance += refund;
                lossAmount -= refund;
            }
            this.losses++;
            this.streak = 0;
            this.consecutiveWins = 0;
            this.consecutiveLosses++;
            this.tierExp += 2;
            netDelta = -lossAmount;

            message = `💔 ${result.toUpperCase()} -${this.formatCurrency(lossAmount)}`;
            if (this.halfLoss) message += ` ⬇️`;
            if (this.luckySpinActiveThisSpin) message += ` ✨`;

            if (this.consecutiveLosses > 0 && this.consecutiveLosses % 3 === 0) {
                const penalty = this.awardRandomPowerDown();
                this.applyPowerDownEffect(penalty);
                message += ` ⚠️`;
                this.resultDiv.textContent = `⚠️ ${penalty.name} triggered!`; 
                this.updatePowerUpDisplay();
            }

            this.resultDiv.className = 'result lose';
            this.playLoseSound();
        }

        if (this.balance > this.topScore) {
            this.topScore = this.balance;
            message += ` 🏆`;
        }

        if (this.luckySpinActiveThisSpin) {
            this.luckySpinReady = false;
            this.luckySpinCharge = 0;
            this.luckySpinActiveThisSpin = false;
        } else {
            this.advanceLuckyMeter(nearMiss && !won ? 2 : 1);
            if (nearMiss && !won) {
                this.triggerNearMissDrama();
                this.showToast('Near miss! Lucky meter charged +2.', 'info');
            }
        }

        this.updateChallenge('earn_500', this.topScore);
        this.updateTier();
        this.updateComboStatus();
        this.updateSessionGoalAfterSpin(result, won);
        const unlockedCheckpoint = this.checkForCheckpoint();
        if (unlockedCheckpoint) {
            message += ` 🚩${this.formatCurrency(unlockedCheckpoint)}`;
            this.showToast(`Checkpoint reached: ${this.formatCurrency(unlockedCheckpoint)}`, 'success');
        }

        this.resultDiv.textContent = message;
        this.addBettingHistory(this.selectedBet.color, won, this.betAmount);
        this.updateDisplay();
        this.updateLuckyMeter();
        this.saveGame();

        if (won && netDelta >= 100) {
            this.showToast(`Big hit: ${result.toUpperCase()} paid ${this.formatCurrency(netDelta)}.`, 'success');
        }

        setTimeout(() => {
            this.resultDiv.textContent = '';
            this.resultDiv.className = 'result';
        }, 3000);
    }

    undo() {
        if (!this.lastGameState || this.undoUses <= 0) return;

        this.balance = this.lastGameState.balance;
        this.wins = this.lastGameState.wins;
        this.losses = this.lastGameState.losses;
        this.streak = this.lastGameState.streak;
        this.consecutiveWins = this.lastGameState.consecutiveWins;
        this.consecutiveLosses = this.lastGameState.consecutiveLosses || 0;
        this.gamesPlayed--;
        this.undoUses--;
        this.lastGameState = null;

        this.bettingHistory.pop();
        
        this.resultDiv.textContent = '↶ Undone!';
        this.resultDiv.className = 'result';
        setTimeout(() => {
            this.resultDiv.textContent = '';
        }, 2000);

        this.updateDisplay();
        this.updateBettingHistory();
        this.saveGame();
    }

    updateDisplay() {
        this.balanceSpan.textContent = this.balance;
        document.getElementById('wins').textContent = this.wins;
        document.getElementById('losses').textContent = this.losses;
        document.getElementById('streak').textContent = this.streak;
        document.getElementById('gamesPlayed').textContent = this.gamesPlayed;
        document.getElementById('topScore').textContent = this.topScore;

        document.getElementById('undo-btn').textContent = `↶ Undo (${this.undoUses})`;
        this.spinBtn.disabled = this.isSpinning || (!this.selectedBet && !this.freeSpin) || (!this.freeSpin && this.betAmount > this.balance);
        this.undoBtn.disabled = this.isSpinning || this.noUndo || this.undoUses <= 0;
        this.restartRunBtn.disabled = this.isSpinning || !this.checkpointState;

        if (this.checkpointStatus) {
            const nextThreshold = this.checkpointThresholds[this.checkpointIndex + 1];
            if (this.checkpointState && nextThreshold) {
                this.checkpointStatus.textContent = `Checkpoint: ${this.formatCurrency(this.checkpointThreshold)} • Next: ${this.formatCurrency(nextThreshold)}`;
            } else if (this.checkpointState) {
                this.checkpointStatus.textContent = `Checkpoint: ${this.formatCurrency(this.checkpointThreshold)} • Final checkpoint reached`;
            } else {
                this.checkpointStatus.textContent = `Next checkpoint: ${this.formatCurrency(this.checkpointThresholds[0])}`;
            }
        }

        this.updateLuckyMeter();
        this.updateSessionGoalDisplay();
        this.updateComboStatus();
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
        localStorage.setItem('roulette_consecutiveLosses', this.consecutiveLosses);
        localStorage.setItem('roulette_readyPowerUp', JSON.stringify(this.readyPowerUp));
        localStorage.setItem('roulette_tier', this.tier);
        localStorage.setItem('roulette_tierExp', this.tierExp);
        localStorage.setItem('roulette_undoUses', this.undoUses);
        localStorage.setItem('roulette_history', JSON.stringify(this.bettingHistory));
        localStorage.setItem('roulette_checkpointIndex', this.checkpointIndex);
        localStorage.setItem('roulette_checkpointThreshold', this.checkpointThreshold);
        localStorage.setItem('roulette_checkpointState', JSON.stringify(this.checkpointState));
        localStorage.setItem('roulette_luckySpinCharge', this.luckySpinCharge);
        localStorage.setItem('roulette_luckySpinReady', this.luckySpinReady);
        localStorage.setItem('roulette_sessionGoal', JSON.stringify(this.sessionGoal));
    }

    playWinSound() {
        if (!this.soundEnabled) return;
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
        } catch (e) {}
    }

    playLoseSound() {
        if (!this.soundEnabled) return;
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
        } catch (e) {}
    }

    awardRandomPowerUp() {
        const powerUpKeys = Object.keys(this.powerUpTypes);
        const randomKey = powerUpKeys[Math.floor(Math.random() * powerUpKeys.length)];
        const powerUp = { ...this.powerUpTypes[randomKey], id: Date.now() };
        this.powerUps.push(powerUp);
        this.updatePowerUpDisplay();
        this.showToast(`Power-Up found: ${powerUp.name}`, 'success');
        return powerUp;
    }

    awardRandomPowerDown() {
        const powerDownKeys = Object.keys(this.powerDownTypes);
        const randomKey = powerDownKeys[Math.floor(Math.random() * powerDownKeys.length)];
        const powerDown = { ...this.powerDownTypes[randomKey], id: Date.now() };
        this.activePowerDown = powerDown;
        this.showToast(`Power-Down triggered: ${powerDown.name}`, 'warning');
        return powerDown;
    }

    applyPowerDownEffect(powerDown) {
        switch (powerDown.effect) {
            case 'increase red chance':
                this.higherRed = true;
                break;
            case 'half payout':
                this.halfPayout = true;
                break;
            case 'disable undo':
                this.noUndo = true;
                break;
            case 'randomize bet':
                this.randomizeBet = true;
                break;
        }
        this.resultDiv.textContent = `💥 ${powerDown.name} active for next spin!`;
        this.resultDiv.className = 'result';
    }

    usePowerUp(powerUpId) {
        if (this.isSpinning) return;

        const powerUpIndex = this.powerUps.findIndex(p => p.id === powerUpId);
        if (powerUpIndex === -1) return;

        const powerUp = this.powerUps[powerUpIndex];
        this.activePowerUp = powerUp;
        this.powerUps.splice(powerUpIndex, 1);
        this.updatePowerUpDisplay();

        this.applyPowerUpEffect(powerUp);
        this.updateDisplay();
    }

    applyPowerUpEffect(powerUp) {
        switch (powerUp.effect) {
            case 'removes red segment':
                this.originalGetRandomResult = this.getRandomResult;
                this.noRed = true;
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

        this.resultDiv.textContent = `⚡ ${powerUp.name} activated!`;
        this.resultDiv.className = 'result';
        setTimeout(() => {
            this.resultDiv.textContent = '';
        }, 2000);
    }

    resetPowerUps() {
        this.noRed = false;
        this.doubleWinnings = false;
        this.freeSpin = false;
        this.halfLoss = false;
        this.luckyGuess = false;
        this.activePowerUp = null;

        this.higherRed = false;
        this.halfPayout = false;
        this.noUndo = false;
        this.randomizeBet = false;
        this.activePowerDown = null;
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

        document.querySelectorAll('.use-power-up-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const powerUpId = parseInt(e.target.dataset.id);
                this.usePowerUp(powerUpId);
            });
        });

        const readyPowerUpLabel = document.getElementById('ready-power-up');
        if (readyPowerUpLabel) {
            readyPowerUpLabel.textContent = this.readyPowerUp
                ? `Queued: ${this.readyPowerUp.icon} ${this.readyPowerUp.name} (auto-apply next spin)`
                : 'No queued power-up.';
        }

        const activePowerDownLabel = document.getElementById('active-power-down');
        if (activePowerDownLabel) {
            activePowerDownLabel.textContent = this.activePowerDown
                ? `Active power-down: ${this.activePowerDown.icon} ${this.activePowerDown.name}`
                : 'No active power-down.';
        }
    }

    // Achievements System
    checkAchievements() {
        if (this.wins === 1 && !this.achievements.first_win.unlocked) {
            this.unlockAchievement('first_win');
        }
        if (this.wins === 10 && !this.achievements.ten_wins.unlocked) {
            this.unlockAchievement('ten_wins');
        }
        if (this.balance >= 500 && !this.achievements.high_roller.unlocked) {
            this.unlockAchievement('high_roller');
        }
        if (this.streak === 5 && !this.achievements.lucky_streak.unlocked) {
            this.unlockAchievement('lucky_streak');
        }
        if (this.powerUps.length >= 3 && !this.achievements.power_collector.unlocked) {
            this.unlockAchievement('power_collector');
        }
        if (this.balance >= 1000 && !this.achievements.millionaire.unlocked) {
            this.unlockAchievement('millionaire');
        }
    }

    unlockAchievement(id) {
        this.achievements[id].unlocked = true;
        this.saveAchievements();
        this.updateAchievementsDisplay();
        this.playWinSound();
    }

    loadAchievements() {
        const saved = localStorage.getItem('roulette_achievements');
        if (saved) {
            const savedAchievements = JSON.parse(saved);
            Object.keys(this.achievements).forEach(key => {
                if (savedAchievements[key]) {
                    this.achievements[key].unlocked = savedAchievements[key].unlocked;
                }
            });
        }
    }

    saveAchievements() {
        localStorage.setItem('roulette_achievements', JSON.stringify(this.achievements));
    }

    updateAchievementsDisplay() {
        const achievementsDiv = document.getElementById('achievements');
        if (!achievementsDiv) return;

        achievementsDiv.innerHTML = '';
        Object.entries(this.achievements).forEach(([id, achievement]) => {
            const div = document.createElement('div');
            div.className = `achievement ${achievement.unlocked ? 'unlocked' : ''}`;
            div.title = achievement.desc;
            div.innerHTML = `
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-name">${achievement.name}</div>
                <div class="achievement-desc">${achievement.unlocked ? '✓' : '🔒'}</div>
            `;
            achievementsDiv.appendChild(div);
        });
    }

    // Daily Challenges
    updateChallenge(id, value = 1) {
        this.dailyChallenges.forEach(challenge => {
            if (challenge.id === id && !challenge.completed) {
                if (id === 'earn_500') {
                    challenge.current = value;
                } else if (id === 'green_twice' && value > challenge.current) {
                    challenge.current++;
                } else if (id !== 'earn_500') {
                    challenge.current += value;
                }

                if (challenge.current >= challenge.target) {
                    challenge.completed = true;
                    this.balance += challenge.reward;
                    this.playWinSound();
                    this.showToast(`Challenge complete: ${challenge.title} (+${this.formatCurrency(challenge.reward)})`, 'success');
                }
            }
        });
        this.updateDailyChallengesDisplay();
        this.saveDailyChallenges();
    }

    loadDailyChallenges() {
        const saved = localStorage.getItem('roulette_challenges');
        if (saved) {
            this.dailyChallenges = JSON.parse(saved);
        }
    }

    saveDailyChallenges() {
        localStorage.setItem('roulette_challenges', JSON.stringify(this.dailyChallenges));
    }

    updateDailyChallengesDisplay() {
        const challengesDiv = document.getElementById('challenges');
        if (!challengesDiv) return;

        challengesDiv.innerHTML = '';
        this.dailyChallenges.forEach(challenge => {
            const div = document.createElement('div');
            div.className = `challenge ${challenge.completed ? 'completed' : ''}`;
            const progress = Math.min(100, Math.floor((challenge.current / challenge.target) * 100));
            div.innerHTML = `
                <div class="challenge-title">${challenge.title}</div>
                <div class="challenge-progress">${challenge.completed ? '✓ Complete!' : `${challenge.current}/${challenge.target} • +$${challenge.reward}`}</div>
            `;
            challengesDiv.appendChild(div);
        });
    }

    // Tier System
    updateTier() {
        for (let i = this.tiers.length - 1; i >= 0; i--) {
            if (this.tierExp >= this.tierThresholds[i]) {
                this.tier = this.tiers[i];
                break;
            }
        }

        const nextTierIndex = this.tiers.indexOf(this.tier) + 1;
        const nextThreshold = this.tierThresholds[nextTierIndex] || this.tierThresholds[this.tierThresholds.length - 1];
        const currentThreshold = this.tierThresholds[this.tiers.indexOf(this.tier)];
        const progress = Math.min(100, Math.floor(((this.tierExp - currentThreshold) / (nextThreshold - currentThreshold)) * 100));

        document.getElementById('current-tier').textContent = this.tier;
        document.getElementById('tier-bar').style.width = progress + '%';
    }

    // Betting History
    addBettingHistory(color, won, amount) {
        this.bettingHistory.unshift({
            color, won, amount, timestamp: new Date().toLocaleTimeString()
        });
        if (this.bettingHistory.length > this.maxHistoryItems) {
            this.bettingHistory.pop();
        }
        this.updateBettingHistory();
    }

    updateBettingHistory() {
        const historyDiv = document.getElementById('history');
        if (!historyDiv) return;

        historyDiv.innerHTML = '';
        this.bettingHistory.forEach(item => {
            const div = document.createElement('div');
            div.className = `history-item ${item.won ? 'win' : 'loss'}`;
            div.textContent = `${item.won ? '✓' : '✗'} ${item.color} - $${item.amount}`;
            historyDiv.appendChild(div);
        });
    }

    resetGame() {
        if (confirm('Are you sure? This will reset all stats!')) {
            localStorage.clear();
            location.reload();
        }
    }

    exportStats() {
        const stats = {
            balance: this.balance,
            topScore: this.topScore,
            wins: this.wins,
            losses: this.losses,
            winRate: ((this.wins / (this.wins + this.losses)) * 100).toFixed(2) + '%',
            gamesPlayed: this.gamesPlayed,
            tier: this.tier,
            achievements: Object.keys(this.achievements).filter(k => this.achievements[k].unlocked),
            exportDate: new Date().toLocaleString()
        };

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(stats, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "roulette_stats.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new RouletteGame();
});
