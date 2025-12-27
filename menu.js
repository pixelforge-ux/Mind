export function hideAllMenus() {
    const menus = ['main-menu', 'bot-setup', 'online-setup', 'matchmaking', 'settings-menu', 'pause-menu', 'leaderboard'];
    menus.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });
}

export function setupMenuListeners(gameState, startMatchmaking, startGame, backToMain) {
    window.showBotSetup = () => {
        gameState.isMultiplayer = false;
        hideAllMenus();
        document.getElementById('bot-setup').classList.remove('hidden');
        window.setPlayerCount(gameState.settings.playerCount);
    };

    window.showOnlineSetup = () => {
        gameState.isMultiplayer = true;
        hideAllMenus();
        document.getElementById('online-setup').classList.remove('hidden');
        window.setPlayerCount(gameState.settings.playerCount);
    };

    window.startMatchmaking = startMatchmaking;
    window.startGame = startGame;
    window.backToMain = backToMain;

    window.showSettings = () => {
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('settings-menu').classList.remove('hidden');
    };

    window.setPlayerCount = (n) => {
        gameState.settings.playerCount = n;
        [2, 3, 4].forEach(num => {
            const botEl = document.getElementById(`pc-${num}`);
            const onlineEl = document.getElementById(`pc-online-${num}`);
            if (botEl) botEl.classList.toggle('opacity-50', num !== n);
            if (onlineEl) onlineEl.classList.toggle('opacity-50', num !== n);
        });
    };

    window.setCardBack = (n) => {
        gameState.settings.cardBack = n;
        [1, 2, 3].forEach(num => {
            document.getElementById(`cb-${num}`).classList.toggle('active', num === n);
        });
    };

    window.setCarpet = (n) => {
        gameState.settings.carpet = n;
        document.getElementById('game-canvas').style.backgroundImage = `url('carpet_${n}.png')`;
        [1, 2, 3].forEach(num => {
            document.getElementById(`cp-${num}`).classList.toggle('active', num === n);
        });
    };
}