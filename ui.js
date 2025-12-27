import gsap from 'gsap';
import { playSound } from './audio.js';

export function createCardUI(card, cardBackIndex, isBack = false) {
    const div = document.createElement('div');
    div.className = 'card';
    if (isBack) {
        div.style.backgroundImage = `url('card_back_${cardBackIndex}.png')`;
    } else {
        const suitChar = card.suit[0];
        const val = card.value === '10' ? '0' : card.value;
        const imgUrl = `https://deckofcardsapi.com/static/img/${val}${suitChar.toUpperCase()}.png`;
        div.style.backgroundImage = `url('${imgUrl}')`;
        div.style.backgroundSize = '100% 100%';
    }
    return div;
}

export function showSur() {
    playSound('sfx_sur');
    const el = document.getElementById('sur-text');
    gsap.set(el, { scale: 0.5, opacity: 0 });
    gsap.to(el, { opacity: 1, scale: 1.2, duration: 0.5, ease: "back.out(1.7)", onComplete: () => {
        gsap.to(el, { opacity: 0, scale: 2, delay: 0.8, duration: 0.4 });
    }});
}

export function animateCardMove(cardDiv, targetPos, duration = 0.5, delay = 0) {
    return gsap.to(cardDiv, {
        left: targetPos.left,
        top: targetPos.top,
        bottom: targetPos.bottom !== undefined ? targetPos.bottom : 'auto',
        right: targetPos.right !== undefined ? targetPos.right : 'auto',
        rotation: targetPos.rotation || 0,
        duration,
        delay,
        ease: "power2.out"
    });
}

export function updateTurnIndicator(playerId, playerCount) {
    const ptr = document.getElementById('turn-ptr');
    const targets = {
        0: { left: '50%', bottom: '140px', rotation: 0 },
        1: { left: '50%', top: '140px', rotation: 180 },
        2: { left: '140px', top: '50%', rotation: 90 },
        3: { right: '140px', top: '50%', rotation: -90 }
    };

    const config = targets[playerId];
    if (!config) return;

    // Reset transform to avoid accumulation during moves
    gsap.killTweensOf(ptr);
    gsap.set(ptr, { y: 0 });

    gsap.to(ptr, {
        opacity: 1,
        left: config.left,
        top: config.top || 'auto',
        bottom: config.bottom || 'auto',
        right: config.right || 'auto',
        xPercent: -50, // Center horizontally/vertically relative to position
        yPercent: -50,
        rotation: config.rotation,
        duration: 0.5,
        ease: "back.out(1.2)",
        onComplete: () => {
            // Smooth float after arriving
            gsap.to(ptr, {
                y: -15,
                duration: 0.8,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut"
            });
        }
    });
}

export function showPointsPopup(points, playerId) {
    if (points <= 0) return;
    
    const popup = document.createElement('div');
    popup.className = 'absolute z-[100] font-black text-2xl text-yellow-400 pointer-events-none drop-shadow-lg';
    popup.innerText = `+${points.toLocaleString('fa-IR')}`;
    
    const targets = {
        0: { left: '50%', bottom: '180px' },
        1: { left: '50%', top: '180px' },
        2: { left: '180px', top: '50%' },
        3: { right: '180px', top: '50%' }
    };

    const config = targets[playerId] || targets[0];
    Object.assign(popup.style, config);
    document.getElementById('game-canvas').appendChild(popup);

    gsap.fromTo(popup, 
        { scale: 0.5, opacity: 0, y: 0 },
        { 
            scale: 1.5, 
            opacity: 1, 
            y: -50, 
            duration: 0.8, 
            ease: "back.out(2)",
            onComplete: () => {
                gsap.to(popup, { opacity: 0, y: -100, duration: 0.4, onComplete: () => popup.remove() });
            }
        }
    );
}