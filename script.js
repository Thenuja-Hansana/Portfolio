/* ==========================================
 * AUDIO ENGINE
 * ========================================== */
const sfx = {
    on: true,
    ctx: null,
    init: function () {
        if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    },
    playTone: function (freq, type, duration, vol = 0.04) {
        if (!this.on || !this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    },
    click: function () {
        this.init();
        this.playTone(400, 'square', 0.08);
    },
    open: function () {
        this.init();
        setTimeout(() => this.playTone(300, 'sine', 0.15), 0);
        setTimeout(() => this.playTone(500, 'sine', 0.15), 80);
        setTimeout(() => this.playTone(800, 'sine', 0.2), 160);
    },
    close: function () {
        this.init();
        setTimeout(() => this.playTone(800, 'triangle', 0.12), 0);
        setTimeout(() => this.playTone(400, 'triangle', 0.12), 80);
    }
};

const bgm = {
    on: true,
    audio: new Audio('music.mp3'),
    init: function () {
        this.audio.loop = true;
        this.audio.volume = 0.08;
    },
    play: function () {
        if (!this.on) return;
        const playPromise = this.audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(() => console.log("Audio requires interaction first."));
        }
    },
    toggle: function () {
        this.on = !this.on;
        if (this.on) this.audio.play();
        else this.audio.pause();
        return this.on;
    }
};

window.addEventListener('DOMContentLoaded', () => { bgm.init(); });


/* ==========================================
 * PARTICLE SYSTEM
 * ========================================== */
class ParticleSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.particleCount = 55;
        this.maxDist = 120;
        this.animId = null;
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        if (this.particles.length === 0) this.createParticles();
    }

    createParticles() {
        this.particles = [];
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.4,
                vy: (Math.random() - 0.5) * 0.4,
                radius: Math.random() * 2 + 1,
                opacity: Math.random() * 0.4 + 0.1
            });
        }
    }

    getColor() {
        const style = getComputedStyle(document.documentElement);
        return style.getPropertyValue('--particle-color').trim();
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        const color = this.getColor();

        // Draw connections
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const dx = this.particles[i].x - this.particles[j].x;
                const dy = this.particles[i].y - this.particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < this.maxDist) {
                    const opacity = (1 - dist / this.maxDist) * 0.15;
                    this.ctx.beginPath();
                    this.ctx.strokeStyle = `rgba(${color}, ${opacity})`;
                    this.ctx.lineWidth = 0.5;
                    this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
                    this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
                    this.ctx.stroke();
                }
            }
        }

        // Draw particles
        for (const p of this.particles) {
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(${color}, ${p.opacity})`;
            this.ctx.fill();

            // Glow
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius * 3, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(${color}, ${p.opacity * 0.1})`;
            this.ctx.fill();
        }
    }

    update() {
        for (const p of this.particles) {
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0 || p.x > this.canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > this.canvas.height) p.vy *= -1;
        }
    }

    animate() {
        this.update();
        this.draw();
        this.animId = requestAnimationFrame(() => this.animate());
    }

    start() { this.animate(); }
}


/* ==========================================
 * SPLASH SCREEN — TYPEWRITER BOOT
 * ========================================== */
window.startSystem = function () {
    bgm.play();
    sfx.click();
    const splash = document.getElementById('splash');
    splash.style.opacity = '0';
    setTimeout(() => { splash.style.display = 'none'; }, 600);
    setTimeout(() => wm.open('home'), 250);
};

document.addEventListener('DOMContentLoaded', () => {
    const bootText = document.getElementById('boot-sequence');
    const loaderCont = document.getElementById('loader-cont');
    const loader = document.getElementById('loader');
    const splashText = document.getElementById('splash-text');
    const btnEnter = document.getElementById('btn-enter');

    const bootLines = [
        "> INITIALIZING SYSTEM BIOS...",
        "> CHECKING MEMORY........... 16384 MB OK",
        "> MOUNTING VIRTUAL DRIVES... OK",
        "> LOADING KERNEL MODULES.... SUCCESS",
        "> ESTABLISHING NETWORK...... CONNECTED",
        "> LOADING PORTFOLIO ENGINE.. READY"
    ];

    let lineIndex = 0;

    function typeLineChar(line, charIndex, callback) {
        if (charIndex < line.length) {
            bootText.innerHTML = bootText.innerHTML.slice(0, -1) + line[charIndex] + '█';
            setTimeout(() => typeLineChar(line, charIndex + 1, callback), 15 + Math.random() * 20);
        } else {
            bootText.innerHTML = bootText.innerHTML.slice(0, -1) + '<br>█';
            callback();
        }
    }

    function typeLine() {
        if (lineIndex < bootLines.length) {
            typeLineChar(bootLines[lineIndex], 0, () => {
                lineIndex++;
                setTimeout(typeLine, 100 + Math.random() * 150);
            });
        } else {
            bootText.innerHTML = bootText.innerHTML.slice(0, -1);
            loaderCont.style.display = "block";
            setTimeout(() => { loader.style.width = "100%"; }, 50);

            setTimeout(() => {
                splashText.innerHTML = "SYSTEM READY";
                splashText.style.color = "#a78bfa";
                loaderCont.style.display = "none";
                bootText.style.display = "none";
                btnEnter.style.display = "block";
                btnEnter.focus();
            }, 1500);
        }
    }

    bootText.innerHTML = '█';
    setTimeout(typeLine, 500);

    // Start particle system
    const canvas = document.getElementById('particle-canvas');
    if (canvas) {
        const ps = new ParticleSystem(canvas);
        ps.start();
    }
});


/* ==========================================
 * COUNTDOWN
 * ========================================== */
const targetDate = new Date();
targetDate.setDate(targetDate.getDate() + 60);

function updateCountdown() {
    const now = new Date();
    const diff = targetDate - now;
    if (diff <= 0) {
        document.getElementById('countdown-timer').innerHTML = "SYSTEM RESTORED";
        return;
    }
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    document.getElementById('countdown-timer').innerHTML =
        `${days} Days : ${hours.toString().padStart(2, '0')} : ${minutes.toString().padStart(2, '0')} : ${seconds.toString().padStart(2, '0')}`;
}
setInterval(updateCountdown, 1000);
updateCountdown();

function showMaintenance() {
    sfx.click();
    document.getElementById('maintenance-popup').style.display = 'flex';
}


/* ==========================================
 * SCROLL REVEAL — IntersectionObserver
 * ========================================== */
function initScrollReveal(container) {
    const reveals = container.querySelectorAll('.reveal');
    if (reveals.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { root: container, threshold: 0.1 });

    reveals.forEach((el, i) => {
        el.style.transitionDelay = `${i * 0.08}s`;
        observer.observe(el);
    });
}


/* ==========================================
 * WINDOW MANAGER
 * ========================================== */
class WindowManager {
    constructor() {
        this.desktop = document.getElementById('desktop');
        this.taskList = document.getElementById('task-list');
        this.zIndex = 100;
        this.windows = {};
        this.activeWindow = null;
    }

    isMobile() { return window.innerWidth <= 768; }

    open(id) {
        if (this.windows[id]) { this.restore(id); return; }
        sfx.open();

        const tpl = document.getElementById(`tpl-${id}`);
        if (!tpl) { console.error(`Template tpl-${id} not found!`); return; }

        const win = document.createElement('div');
        win.className = 'window';
        win.id = `win-${id}`;

        // Window sizes
        const sizes = {
            contact: { w: '480px', h: '740px' },
            about: { w: '750px', h: '550px' },
            work: { w: '1000px', h: '750px' },
            cv: { w: '950px', h: '800px' },
            home: { w: '800px', h: '600px' },
            links: { w: '600px', h: '450px' }
        };
        const size = sizes[id] || { w: '600px', h: '450px' };
        win.style.width = size.w;
        win.style.height = size.h;

        if (id === 'home') {
            if (!this.isMobile()) {
                win.style.top = '50%';
                win.style.left = '50%';
                win.style.transform = 'translate(-50%, -50%)';
            }
            win.innerHTML = `<div class="window-header"><div class="window-title">MAIN_TERMINAL</div></div><div class="window-body">${tpl.innerHTML}</div>`;
        } else {
            if (!this.isMobile()) {
                win.style.top = '50%';
                win.style.left = '50%';
                win.style.transform = `translate(-50%, -50%) translate(${Math.random() * 20 - 10}px, ${Math.random() * 20 - 10}px)`;
            }
            this.zIndex += 10;
            win.style.zIndex = this.zIndex;
            win.innerHTML = `<div class="window-header"><div class="controls"><div class="win-btn btn-close" onclick="wm.close('${id}', event)"></div><div class="win-btn btn-min" onclick="wm.minimize('${id}', event)"></div></div><div class="window-title">${id.toUpperCase()}.EXE</div></div><div class="window-body">${tpl.innerHTML}</div><div class="resize-handle"></div>`;
            if (!this.isMobile()) {
                this.makeDraggable(win);
                this.makeResizable(win);
            }
        }

        this.desktop.appendChild(win);

        // Taskbar tab
        const tab = document.createElement('div');
        tab.className = 'task-tab';
        tab.innerText = id.toUpperCase();
        tab.setAttribute('data-icon', id.toUpperCase().charAt(0));
        tab.onclick = () => {
            sfx.click();
            if (win.classList.contains('minimized')) this.restore(id);
            else if (this.activeWindow === id) this.minimize(id);
            else this.focus(id);
        };
        this.taskList.appendChild(tab);
        this.windows[id] = { win, tab };

        if (id !== 'home') {
            requestAnimationFrame(() => {
                win.classList.add('open');
                // Init scroll reveal for this window
                setTimeout(() => {
                    const body = win.querySelector('.window-body');
                    if (body) initScrollReveal(body);
                }, 400);
            });
        } else {
            win.style.opacity = '1';
            win.classList.add('open');
        }

        this.focus(id);
    }

    close(id, e) {
        if (e) e.stopPropagation();
        if (id === 'home') return;
        sfx.close();
        const ref = this.windows[id];
        ref.win.classList.remove('open');
        ref.win.classList.remove('focused');
        setTimeout(() => {
            ref.win.remove();
            ref.tab.remove();
            delete this.windows[id];
        }, 350);
    }

    minimize(id, e) {
        if (e) e.stopPropagation();
        sfx.click();
        const ref = this.windows[id];
        ref.win.classList.add('minimized');
        ref.win.classList.remove('focused');
        ref.tab.classList.remove('active');
    }

    restore(id) {
        const ref = this.windows[id];
        ref.win.classList.remove('minimized');
        this.focus(id);
    }

    focus(id) {
        // Remove focused from all
        Object.values(this.windows).forEach(obj => {
            obj.tab.classList.remove('active');
            obj.win.classList.remove('focused');
        });

        if (id !== 'home') {
            this.zIndex += 10;
            this.windows[id].win.style.zIndex = this.zIndex;
        }

        this.activeWindow = id;
        this.windows[id].tab.classList.add('active');
        this.windows[id].win.classList.add('focused');
    }

    makeDraggable(el) {
        if (this.isMobile()) return;
        const header = el.querySelector('.window-header');
        let isDragging = false, startX, startY, initialLeft, initialTop;

        header.onmousedown = (e) => {
            if (e.target.closest('.win-btn')) return;
            this.focus(el.id.replace('win-', ''));
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;

            // Remove centering transform so offset works correctly
            el.style.transform = 'none';
            initialLeft = el.offsetLeft;
            initialTop = el.offsetTop;

            document.body.style.cursor = 'grabbing';
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
        };

        const onMove = (e) => {
            if (!isDragging) return;
            el.style.left = `${initialLeft + (e.clientX - startX)}px`;
            el.style.top = `${initialTop + (e.clientY - startY)}px`;
        };

        const onUp = () => {
            isDragging = false;
            document.body.style.cursor = 'default';
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        };
    }

    makeResizable(el) {
        if (this.isMobile()) return;
        const handle = el.querySelector('.resize-handle');
        if (!handle) return;
        let isResizing = false, startX, startY, startW, startH;

        handle.onmousedown = (e) => {
            e.stopPropagation();
            isResizing = true;
            startX = e.clientX;
            startY = e.clientY;
            startW = parseInt(document.defaultView.getComputedStyle(el).width, 10);
            startH = parseInt(document.defaultView.getComputedStyle(el).height, 10);
            document.addEventListener('mousemove', onResize);
            document.addEventListener('mouseup', stopResize);
        };

        const onResize = (e) => {
            if (!isResizing) return;
            el.style.width = (startW + e.clientX - startX) + 'px';
            el.style.height = (startH + e.clientY - startY) + 'px';
        };

        const stopResize = () => {
            isResizing = false;
            document.removeEventListener('mousemove', onResize);
            document.removeEventListener('mouseup', stopResize);
        };
    }

    toggleStart() {
        sfx.click();
        document.getElementById('start-menu').classList.toggle('show');
    }
}

const wm = new WindowManager();

/* ==========================================
 * CLOCK & SYSTEM TRAY
 * ========================================== */
setInterval(() => {
    const now = new Date();
    document.getElementById('clock').innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}, 1000);

document.getElementById('btn-sfx').onclick = function () {
    sfx.on = !sfx.on;
    this.classList.toggle('muted', !sfx.on);
    this.innerText = sfx.on ? '🔊' : '🔇';
    sfx.click();
};

document.getElementById('btn-bgm').onclick = function () {
    const isPlaying = bgm.toggle();
    this.classList.toggle('muted', !isPlaying);
    this.innerText = isPlaying ? '🎵' : '❌';
    sfx.click();
};

document.getElementById('btn-theme').onclick = function () {
    sfx.click();
    const body = document.body;
    const current = body.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';

    // Flash transition effect
    const flash = document.createElement('div');
    flash.style.cssText = 'position:fixed;inset:0;background:white;opacity:0.15;pointer-events:none;z-index:9998;transition:opacity 0.4s';
    document.body.appendChild(flash);
    setTimeout(() => { flash.style.opacity = '0'; }, 50);
    setTimeout(() => { flash.remove(); }, 500);

    body.setAttribute('data-theme', next);
};
