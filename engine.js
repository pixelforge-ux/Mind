export function createDeck(suits, values, numericValues) {
    let deck = [];
    suits.forEach(suit => {
        values.forEach(value => {
            deck.push({ suit, value, num: numericValues[value] });
        });
    });
    return deck;
}

export function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

export function getPossibleTakes(playedCard, tableCards) {
    if (tableCards.length === 0) return [];
    
    // Jack takes all except King and Queen
    if (playedCard.value === 'J') {
        return tableCards.filter(c => c.value !== 'K' && c.value !== 'Q');
    }
    
    // King takes King
    if (playedCard.value === 'K') {
        const king = tableCards.find(c => c.value === 'K');
        return king ? [king] : [];
    }
    
    // Queen takes Queen
    if (playedCard.value === 'Q') {
        const queen = tableCards.find(c => c.value === 'Q');
        return queen ? [queen] : [];
    }
    
    // Numbered cards: check for combinations that sum to 11 OR direct matches
    const match = tableCards.find(c => c.num === playedCard.num);
    const targets = tableCards.filter(c => c.num < 11);
    
    function findSum(arr, target, partial = []) {
        let s = partial.reduce((a, b) => a + b.num, 0);
        if (s + playedCard.num === 11) return partial;
        if (s + playedCard.num > 11) return null;
        for (let i = 0; i < arr.length; i++) {
            let n = arr[i];
            let remaining = arr.slice(i + 1);
            let result = findSum(remaining, target, partial.concat([n]));
            if (result) return result;
        }
        return null;
    }
    
    const combo = findSum(targets, 11 - playedCard.num);
    if (combo) return combo;
    if (match) return [match];
    
    return [];
}

export function calculateCurrentScore(players, playerId, finalCalc = false) {
    const p = players[playerId];
    const captured = p.captured;
    
    let breakdown = {
        tenDiamonds: captured.find(c => c.value === '10' && c.suit === 'diamonds') ? 3 : 0,
        twoClubs: captured.find(c => c.value === '2' && c.suit === 'clubs') ? 2 : 0,
        aces: captured.filter(c => c.value === 'A').length,
        jacks: captured.filter(c => c.value === 'J').length,
        surs: p.sursCount * 5,
        clubsSeven: 0,
        total: 0
    };

    if (finalCalc) {
        const clubCounts = players.map(pl => pl.captured.filter(c => c.suit === 'clubs').length);
        const maxClubs = Math.max(...clubCounts);
        if (p.captured.filter(c => c.suit === 'clubs').length === maxClubs && maxClubs > 0) {
            const winners = clubCounts.filter(c => c === maxClubs).length;
            if (winners === 1) breakdown.clubsSeven = 7;
        }
    }

    breakdown.total = breakdown.tenDiamonds + breakdown.twoClubs + breakdown.aces + breakdown.jacks + breakdown.surs + breakdown.clubsSeven;
    return breakdown;
}

export function evaluateCardsValue(cards) {
    let pts = 0;
    cards.forEach(c => {
        if (c.value === '10' && c.suit === 'diamonds') pts += 3;
        else if (c.value === '2' && c.suit === 'clubs') pts += 2;
        else if (c.value === 'A') pts += 1;
        else if (c.value === 'J') pts += 1;
    });
    return pts;
}