// --- AUDIO ENGINE V3 (Reverb + Stereo) ---
class GameAudio {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.4;
        this.master.connect(this.ctx.destination);

        // Simple Reverb
        this.reverb = this.ctx.createConvolver();
        this.generateReverb();
        this.reverbGain = this.ctx.createGain();
        this.reverbGain.gain.value = 0.3;
        this.reverbGain.connect(this.master);
        this.master.connect(this.reverb);
        this.reverb.connect(this.reverbGain);
    }

    generateReverb() {
        const duration = 2;
        const decay = 2;
        const rate = this.ctx.sampleRate;
        const length = rate * duration;
        const buffer = this.ctx.createBuffer(2, length, rate);
        const L = buffer.getChannelData(0);
        const R = buffer.getChannelData(1);
        for (let i = 0; i < length; i++) {
            const n = i / length;
            L[i] = (Math.random() * 2 - 1) * Math.pow(1 - n, decay);
            R[i] = (Math.random() * 2 - 1) * Math.pow(1 - n, decay);
        }
        this.reverb.buffer = buffer;
    }

    playTone(freq, type = 'sine', dur = 0.5) {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.2, this.ctx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);

        osc.connect(gain);
        gain.connect(this.master);
        gain.connect(this.reverb); // Send to reverb

        osc.start();
        osc.stop(this.ctx.currentTime + dur);
    }

    playSuccess(combo) {
        const base = [440, 554, 659]; // A major
        const chord = base.map(f => f * (1 + (combo * 0.1)));
        chord.forEach((f, i) => setTimeout(() => this.playTone(f, 'sine', 1), i * 50));
    }

    playFail() {
        this.playTone(150, 'sawtooth', 0.4);
        this.playTone(140, 'sawtooth', 0.4);
    }
}

const audio = new GameAudio();

// --- GAME LOGIC ---
const types = [
    { id: 'sun', icon: 'fa-sun', color: '#f59e0b', gradient: 'linear-gradient(135deg, #fcd34d, #f59e0b)' },
    { id: 'leaf', icon: 'fa-leaf', color: '#10b981', gradient: 'linear-gradient(135deg, #6ee7b7, #10b981)' },
    { id: 'moon', icon: 'fa-moon', color: '#6366f1', gradient: 'linear-gradient(135deg, #a5b4fc, #6366f1)' }
];

let score = 0;
let combo = 1;
let timeLeft = 60;
let gameActive = false;
let spawnInterval;
let timerInterval;

const gameArea = document.getElementById('gameArea');
const scoreEl = document.getElementById('score');
const comboEl = document.getElementById('combo');
const timeEl = document.getElementById('time');

function startGame() {
    document.getElementById('overlay').style.display = 'none';
    gameActive = true;
    score = 0;
    combo = 1;
    timeLeft = 60;
    updateHUD();

    spawnInterval = setInterval(createOrb, 1200);
    timerInterval = setInterval(() => {
        timeLeft--;
        timeEl.innerText = timeLeft;
        if (timeLeft <= 0) endGame();
    }, 1000);
}

function updateHUD() {
    scoreEl.innerText = score;
    comboEl.innerText = combo + 'x';
    timeEl.innerText = timeLeft;
}

function createOrb() {
    if (!gameActive) return;
    const type = types[Math.floor(Math.random() * types.length)];
    const orb = document.createElement('div');
    orb.className = 'orb';
    orb.innerHTML = `<i class="fas ${type.icon}"></i>`;
    orb.style.background = type.gradient;
    orb.dataset.type = type.id;

    // Random horizontal pos
    const maxLeft = gameArea.offsetWidth - 60;
    orb.style.left = Math.random() * maxLeft + 'px';
    orb.style.top = '-70px';

    gameArea.appendChild(orb);

    // Animate
    const duration = 4 + Math.random() * 3; // 4-7s fall
    gsap.to(orb, {
        y: gameArea.offsetHeight + 100,
        duration: duration,
        ease: 'none',
        onComplete: () => {
            if (orb.parentNode) {
                orb.remove();
                combo = 1; // Break combo if missed
                updateHUD();
            }
        }
    });

    makeDraggable(orb);
}

function makeDraggable(el) {
    let isDragging = false;
    let lastX, lastY;

    // Trail Effect
    const spawnTrail = (x, y, color) => {
        if (Math.random() > 0.3) return; // Optimization
        const t = document.createElement('div');
        t.className = 'trail';
        t.style.left = x + 'px'; t.style.top = y + 'px';
        t.style.background = color;
        gameArea.appendChild(t);
        setTimeout(() => t.remove(), 500);
    };

    const onMove = (e) => {
        if (!isDragging) return;
        const clientX = e.clientX || e.touches[0].clientX;
        const clientY = e.clientY || e.touches[0].clientY;

        const gameRect = gameArea.getBoundingClientRect();
        const x = clientX - gameRect.left - 27.5;
        const y = clientY - gameRect.top - 27.5;

        el.style.left = x + 'px';
        el.style.top = y + 'px';

        // Check bin hover
        document.querySelectorAll('.bin').forEach(bin => {
            const rect = bin.getBoundingClientRect();
            if (clientX > rect.left && clientX < rect.right && clientY > rect.top && clientY < rect.bottom) {
                bin.classList.add('drag-over');
            } else {
                bin.classList.remove('drag-over');
            }
        });

        spawnTrail(x, y, el.style.background);
    };

    const onEnd = (e) => {
        if (!isDragging) return;
        isDragging = false;
        gsap.killTweensOf(el); // Stop falling logic if any

        // Check collision
        const elRect = el.getBoundingClientRect();
        const elCenter = { x: elRect.left + elRect.width / 2, y: elRect.top + elRect.height / 2 };

        let matched = false;
        document.querySelectorAll('.bin').forEach(bin => {
            bin.classList.remove('drag-over');
            const binRect = bin.getBoundingClientRect();

            if (elCenter.x > binRect.left && elCenter.x < binRect.right &&
                elCenter.y > binRect.top && elCenter.y < binRect.bottom) {

                if (bin.dataset.type === el.dataset.type) {
                    matched = true;
                    successMatch(bin);
                } else {
                    failMatch(bin);
                }
            }
        });

        if (!matched) {
            // Drop text? or just disappear
            gsap.to(el, { scale: 0, opacity: 0, duration: 0.2 });
        }
        el.remove();

        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onEnd);
        window.removeEventListener('touchmove', onMove);
        window.removeEventListener('touchend', onEnd);
    };

    const onStart = (e) => {
        if (!gameActive) return;
        e.preventDefault();
        isDragging = true;
        gsap.killTweensOf(el);

        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onEnd);
        window.addEventListener('touchmove', onMove, { passive: false });
        window.addEventListener('touchend', onEnd);
    };

    el.addEventListener('mousedown', onStart);
    el.addEventListener('touchstart', onStart, { passive: false });
}

function successMatch(bin) {
    score += 10 * combo;
    combo++;
    updateHUD();
    audio.playSuccess(Math.min(combo, 10)); // cap pich shift

    // Visuals
    gsap.fromTo(bin, { scale: 1.2 }, { scale: 1, duration: 0.4, ease: "elastic.out(1, 0.3)" });

    const rect = bin.getBoundingClientRect();
    confetti({
        particleCount: 15,
        spread: 40,
        origin: { x: (rect.left + rect.width / 2) / window.innerWidth, y: (rect.top + rect.height / 2) / window.innerHeight },
        colors: [bin.style.color]
    });
}

function failMatch(bin) {
    combo = 1;
    updateHUD();
    audio.playFail();
    gsap.to(bin, { x: 5, duration: 0.05, yoyo: true, repeat: 3 });
}

function endGame() {
    gameActive = false;
    clearInterval(spawnInterval);
    clearInterval(timerInterval);
    document.querySelectorAll('.orb').forEach(o => o.remove());

    document.querySelector('.start-card h1').textContent = "Balance Restored";
    document.querySelector('.start-card p').innerHTML = `Harmony Score: ${score}<br>Max Flow: ${combo}x`;
    document.querySelector('.start-btn').textContent = "Play Again";
    document.getElementById('overlay').style.display = 'flex';
}
