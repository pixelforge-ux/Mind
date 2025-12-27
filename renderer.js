import gsap from 'gsap';
import { createCardUI } from './ui.js';
import { calculateCurrentScore } from './engine.js';

export function renderBoard(gameState, playCardAction) {
    const tableEl = document.getElementById('table-cards');
    const handContainers = {
        0: document.getElementById('player-hand'),
        1: document.getElementById('opponent-hand-top'),
        2: document.getElementById('opponent-hand-left'),
        3: document.getElementById('opponent-hand-right')
    };
    
    tableEl.innerHTML = '';
    Object.values(handContainers).forEach(el => el.innerHTML = '');

    gameState.table.forEach((card, i) => {
        const cardDiv = createCardUI(card, gameState.settings.cardBack);
        const angle = (i * 15) % 360;
        const left = `calc(50% - 32px + ${(i % 4 - 1.5) * 25}px)`;
        const top = `calc(50% - 45px + ${(Math.floor(i/4) - 0.5) * 25}px)`;
        
        cardDiv.style.left = left;
        cardDiv.style.top = top;
        cardDiv.style.transform = `rotate(${angle - 7}deg)`;
        tableEl.appendChild(cardDiv);
        
        if (!card.animPlayed) {
            card.animPlayed = true;
            gsap.from(cardDiv, { scale: 0, rotation: 360, duration: 0.3, ease: "back.out" });
        }
    });
    
    gameState.players.forEach((player, pIdx) => {
        const container = handContainers[pIdx];
        if (!container) return;

        player.hand.forEach((card, cIdx) => {
            const isSelf = pIdx === 0;
            const cardDiv = createCardUI(card, gameState.settings.cardBack, !isSelf);
            
            if (isSelf) {
                cardDiv.style.pointerEvents = 'auto';
                cardDiv.onclick = () => {
                    if (gameState.turn === 0 && !gameState.dealing) playCardAction(0, card);
                };
                const offset = (cIdx - (player.hand.length - 1) / 2) * 75;
                cardDiv.style.left = `calc(50% - 32px + ${offset}px)`;
                cardDiv.style.bottom = '0';
                
                if (!card.animPlayed) {
                    card.animPlayed = true;
                    gsap.from(cardDiv, { y: 100, opacity: 0, duration: 0.5, delay: cIdx * 0.1 });
                }
            } else {
                if (pIdx === 1) { // Top
                    const offset = (cIdx - (player.hand.length - 1) / 2) * 40;
                    cardDiv.style.left = `calc(50% - 32px + ${offset}px)`;
                    cardDiv.style.top = '0';
                    cardDiv.style.transform = 'rotate(180deg)';
                } else if (pIdx === 2) { // Left
                    const offset = (cIdx - (player.hand.length - 1) / 2) * 30;
                    cardDiv.style.top = `calc(50% - 45px + ${offset}px)`;
                    cardDiv.style.left = '0';
                    cardDiv.style.transform = 'rotate(90deg)';
                } else if (pIdx === 3) { // Right
                    const offset = (cIdx - (player.hand.length - 1) / 2) * 30;
                    cardDiv.style.top = `calc(50% - 45px + ${offset}px)`;
                    cardDiv.style.right = '0';
                    cardDiv.style.transform = 'rotate(-90deg)';
                }

                if (!card.animPlayed) {
                    card.animPlayed = true;
                    const axis = (pIdx === 1) ? 'y' : 'x';
                    const val = (pIdx === 1 || pIdx === 2) ? -100 : 100;
                    gsap.from(cardDiv, { [axis]: val, opacity: 0, duration: 0.5, delay: cIdx * 0.1 });
                }
            }
            container.appendChild(cardDiv);
        });
    });
    
    updateScoreboardUI(gameState);
}

function updateScoreboardUI(gameState) {
    const scoresContainer = document.getElementById('scores-container');
    scoresContainer.innerHTML = '';
    gameState.players.forEach((p, i) => {
        const badge = document.createElement('div');
        badge.className = 'score-badge whitespace-nowrap bg-black/40';
        const breakdown = calculateCurrentScore(gameState.players, i);
        badge.innerText = `${p.name}: ${breakdown.total.toLocaleString('fa-IR')} امتیاز (${p.captured.length.toLocaleString('fa-IR')} برگ)`;
        scoresContainer.appendChild(badge);
    });

    document.getElementById('deck-count').innerText = `بانک: ${gameState.deck.length.toLocaleString('fa-IR')}`;
    const roundProgress = Math.floor(((52 - gameState.deck.length) / 52) * 100);
    document.getElementById('game-status').innerText = `پیشرفت: ${roundProgress.toLocaleString('fa-IR')}٪`;
}

export function showLeaderboard(gameState) {
    const leaderboard = document.getElementById('leaderboard');
    const content = document.getElementById('leaderboard-content');
    content.innerHTML = '';

    const results = gameState.players.map(p => ({
        id: p.id,
        breakdown: calculateCurrentScore(gameState.players, p.id, true),
        capturedCount: p.captured.length,
        surs: p.sursCount
    }));

    results.sort((a, b) => b.breakdown.total - a.breakdown.total);

    results.forEach((res, index) => {
        const isUser = res.id === 0;
        const row = document.createElement('div');
        row.className = `p-4 rounded-2xl border ${isUser ? 'border-yellow-500 bg-yellow-500/10' : 'border-gray-700 bg-gray-800/50'}`;
        
        const playerName = gameState.players.find(p => p.id === res.id).name;
        row.innerHTML = `
            <div class="flex justify-between items-center mb-2">
                <span class="font-bold text-lg ${isUser ? 'text-yellow-400' : 'text-white'}">
                    ${index + 1}. ${playerName}
                </span>
                <span class="text-2xl font-black text-yellow-500">${res.breakdown.total.toLocaleString('fa-IR')} امتیاز</span>
            </div>
            <div class="grid grid-cols-2 gap-2 text-sm text-gray-400 border-t border-gray-700 pt-2">
                <div>۱۰ خشت: ${res.breakdown.tenDiamonds.toLocaleString('fa-IR')}</div>
                <div>۲ گشنیز: ${res.breakdown.twoClubs.toLocaleString('fa-IR')}</div>
                <div>تک‌ها: ${res.breakdown.aces.toLocaleString('fa-IR')}</div>
                <div>سربازها: ${res.breakdown.jacks.toLocaleString('fa-IR')}</div>
                <div>سورها (${res.surs}): ${res.breakdown.surs.toLocaleString('fa-IR')}</div>
                <div>هفت خاج: ${res.breakdown.clubsSeven.toLocaleString('fa-IR')}</div>
                <div class="col-span-2 text-gray-300 italic">مجموع کارت‌ها: ${res.capturedCount.toLocaleString('fa-IR')} برگ</div>
            </div>
        `;
        content.appendChild(row);
    });

    leaderboard.classList.remove('hidden');
}