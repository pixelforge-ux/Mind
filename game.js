import gsap from 'gsap';
import { SUITS, VALUES, NUMERIC_VALUES } from './constants.js';
import { playSound } from './audio.js';
import { createDeck, shuffle, getPossibleTakes, calculateCurrentScore, evaluateCardsValue } from './engine.js';
import { createCardUI, showSur, animateCardMove, updateTurnIndicator, showPointsPopup } from './ui.js';

// --- Constants & State ---
// tombstone: removed SUITS, VALUES, NUMERIC_VALUES constants

let gameState = {
    deck: [],
    players: [],
    table: [],
    turn: 0,
    lastTaker: null,
    settings: {
        cardBack: 1,
        carpet: 1,
        botDifficulty: 'medium',
        playerCount: 2
    },
    isGameActive: false,
    dealing: false,
    isPaused: false
};

// tombstone: removed audioCtx and playSound(name) helper

import { generateNames } from './utils.js';
import { hideAllMenus, setupMenuListeners } from './menu.js';
import { renderBoard, showLeaderboard } from './renderer.js';

const NAMES_LIST = generateNames();

// --- Initialization ---

document.addEventListener('DOMContentLoaded', () => {
    const splash = document.getElementById('splash-screen');
    const progress = document.getElementById('loader-progress');
    const mainMenu = document.getElementById('main-menu');
    mainMenu.style.opacity = '0';
    
    let p = 0;
    const interval = setInterval(() => {
        p += Math.random() * 15;
        if (p >= 100) {
            p = 100;
            clearInterval(interval);
            setTimeout(() => {
                splash.style.opacity = '0';
                mainMenu.style.opacity = '1';
                setTimeout(() => splash.remove(), 800);
            }, 500);
        }
        progress.style.width = `${p}%`;
    }, 150);
});

// tombstone: removed FIRST_NAMES, LAST_NAMES, NAMES_LIST generation (moved to utils.js)
// tombstone: removed hideAllMenus() (moved to menu.js)
// tombstone: removed menu-related window functions (moved to menu.js)

const startMatchmaking = () => {
    hideAllMenus();
    document.getElementById('matchmaking').classList.remove('hidden');
    const foundContainer = document.getElementById('found-players');
    foundContainer.innerHTML = '';
    const count = gameState.settings.playerCount;
    let found = 0;
    const interval = setInterval(() => {
        found++;
        const pDiv = document.createElement('div');
        pDiv.className = 'flex flex-col items-center bg-gray-800 p-3 rounded-xl border border-yellow-500 animate-bounce';
        pDiv.innerHTML = `<div class="w-12 h-12 bg-yellow-600 rounded-full flex items-center justify-center font-bold mb-2">P</div>
                          <span class="text-xs">${NAMES_LIST[Math.floor(Math.random()*NAMES_LIST.length)]}</span>`;
        foundContainer.appendChild(pDiv);
        if (found >= count - 1) {
            clearInterval(interval);
            setTimeout(() => {
                document.getElementById('matchmaking').classList.add('hidden');
                window.startGame();
            }, 1500);
        }
    }, 800 + Math.random() * 400);
};

const startGame = () => {
    hideAllMenus();
    const hud = document.getElementById('hud');
    hud.classList.remove('opacity-0');
    hud.style.display = 'flex';
    gameState.isPaused = false;
    initGame();
};

const backToMain = () => {
    hideAllMenus();
    document.getElementById('main-menu').classList.remove('hidden');
};

setupMenuListeners(gameState, startMatchmaking, startGame, backToMain);

window.pauseGame = () => {
    if (!gameState.isGameActive) return;
    gameState.isPaused = true;
    document.getElementById('pause-menu').classList.remove('hidden');
    hideExitConfirm(); // Reset confirmation state if it was open
};

window.resumeGame = () => {
    gameState.isPaused = false;
    document.getElementById('pause-menu').classList.add('hidden');
    const currentPlayer = gameState.players[gameState.turn];
    if (currentPlayer && currentPlayer.isBot) {
        setTimeout(() => botMove(currentPlayer), 500);
    }
};

window.showExitConfirm = () => {
    document.getElementById('pause-main-content').classList.add('hidden');
    document.getElementById('exit-confirm-content').classList.remove('hidden');
};

window.hideExitConfirm = () => {
    document.getElementById('pause-main-content').classList.remove('hidden');
    document.getElementById('exit-confirm-content').classList.add('hidden');
};

window.exitGame = () => {
    location.reload();
};

function initGame() {
    gameState.deck = createDeck(SUITS, VALUES, NUMERIC_VALUES);
    shuffle(gameState.deck);
    
    gameState.players = [];
    const difficulties = ['easy', 'medium', 'hard'];
    for (let i = 0; i < gameState.settings.playerCount; i++) {
        const name = i === 0 ? "شما" : NAMES_LIST[Math.floor(Math.random() * NAMES_LIST.length)];
        const botDifficulty = gameState.isMultiplayer 
            ? difficulties[Math.floor(Math.random() * difficulties.length)] 
            : gameState.settings.botDifficulty;
            
        gameState.players.push({
            id: i,
            name: name,
            hand: [],
            captured: [],
            score: 0,
            sursCount: 0,
            isBot: i !== 0,
            difficulty: botDifficulty
        });
    }
    
    gameState.table = [];
    gameState.turn = 0;
    gameState.isGameActive = true;
    gameState.lastTaker = null;

    dealInitial();
}

// tombstone: removed function createDeck()
// tombstone: removed function shuffle(array)

// --- Game Logic ---

function endGame() {
    gameState.isGameActive = false;
    showLeaderboard(gameState);
}

function dealInitial() {
    gameState.dealing = true;
    for (let i = 0; i < 4; i++) {
        const card = gameState.deck.pop();
        if (card) gameState.table.push(card);
    }
    
    gameState.players.forEach(p => {
        for (let i = 0; i < 4; i++) {
            const card = gameState.deck.pop();
            if (card) p.hand.push(card);
        }
    });
    
    renderBoard(gameState, playCard);
    playSound('sfx_deal');
    gameState.dealing = false;
    checkTurn();
}

function dealRound() {
    if (gameState.deck.length === 0) {
        endGame();
        return;
    }
    
    gameState.players.forEach(p => {
        for (let i = 0; i < 4; i++) {
            p.hand.push(gameState.deck.pop());
        }
    });
    
    renderBoard(gameState, playCard);
    playSound('sfx_deal');
    checkTurn();
}

function checkTurn() {
    const currentPlayer = gameState.players[gameState.turn];
    const turnLabel = document.getElementById('current-turn');
    
    updateTurnIndicator(gameState.turn, gameState.players.length);

    if (currentPlayer.isBot) {
        turnLabel.innerText = `نوبت ${currentPlayer.name}`;
        setTimeout(() => botMove(currentPlayer), 1500);
    } else {
        turnLabel.innerText = "نوبت شما";
    }
}

function botMove(bot) {
    if (!gameState.isGameActive || gameState.isPaused) return;
    
    let cardToPlay = bot.hand[0];
    for (let card of bot.hand) {
        const possible = getPossibleTakes(card, gameState.table);
        if (possible.length > 0) {
            cardToPlay = card;
            break;
        }
    }
    
    playCard(bot.id, cardToPlay);
}

function playCard(playerId, card) {
    if (gameState.isPaused) return;
    const player = gameState.players[playerId];
    player.hand = player.hand.filter(c => c !== card);
    
    const takes = getPossibleTakes(card, gameState.table);
    
    if (takes.length > 0) {
        const capturedCards = [card, ...takes];
        const movePoints = evaluateCardsValue(capturedCards);
        
        player.captured.push(...capturedCards);
        gameState.table = gameState.table.filter(c => !takes.includes(c));
        gameState.lastTaker = playerId;
        
        let surPoints = 0;
        if (gameState.table.length === 0 && card.value !== 'J' && (gameState.deck.length > 0 || gameState.players.some(p => p.hand.length > 0))) {
            player.sursCount++;
            surPoints = 5;
            showSur();
        }
        
        const totalPointsGained = movePoints + surPoints;
        if (totalPointsGained > 0) {
            showPointsPopup(totalPointsGained, playerId);
        }
        
        playSound('sfx_take');
    } else {
        gameState.table.push(card);
    }
    
    renderBoard(gameState, playCard);
    
    gameState.turn = (gameState.turn + 1) % gameState.players.length;
    
    const allHandsEmpty = gameState.players.every(p => p.hand.length === 0);
    if (allHandsEmpty) {
        if (gameState.deck.length === 0) {
            if (gameState.lastTaker !== null) {
                gameState.players[gameState.lastTaker].captured.push(...gameState.table);
                gameState.table = [];
            }
            endGame();
        } else {
            setTimeout(dealRound, 1000);
        }
    } else {
        checkTurn();
    }
}

// tombstone: removed function getPossibleTakes(playedCard, tableCards)

// --- UI Rendering ---

// tombstone: removed renderBoard() (moved to renderer.js)
// tombstone: removed endGame() (moved to renderer.js)