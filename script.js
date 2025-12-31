/* * ==========================================
         * AUDIO ENGINE
         * ==========================================
         */
const sfx = {
    on: true,
    ctx: null,
    init: function () {
        if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    },
    playTone: function (freq, type, duration, vol = 0.05) {
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
        this.playTone(400, 'square', 0.1);
    },
    open: function () {
        this.init();
        setTimeout(() => this.playTone(300, 'sine', 0.2), 0);
        setTimeout(() => this.playTone(500, 'sine', 0.2), 100);
        setTimeout(() => this.playTone(800, 'sine', 0.3), 200);
    },
    close: function () {
        this.init();
        setTimeout(() => this.playTone(800, 'triangle', 0.15), 0);
        setTimeout(() => this.playTone(400, 'triangle', 0.15), 100);
    }
};

const bgm = {
    on: true,
    audio: new Audio('music.mp3'),
    init: function () {
        this.audio.loop = true;
        this.audio.volume = 0.1;
    },
    play: function () {
        if (!this.on) return;
        const playPromise = this.audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.log("Audio requires interaction first.");
            });
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



/* * ==========================================
 * SPLASH SCREEN LOGIC (RETRO BOOT)
 * ==========================================
 */
window.startSystem = function () {
    bgm.play();
    sfx.click();

    const splash = document.getElementById('splash');
    splash.style.opacity = '0';
    setTimeout(() => { splash.style.display = 'none'; }, 500);

    setTimeout(() => wm.open('home'), 200);
};

document.addEventListener('DOMContentLoaded', () => {
    const bootText = document.getElementById('boot-sequence');
    const loaderCont = document.getElementById('loader-cont');
    const loader = document.getElementById('loader');
    const splashText = document.getElementById('splash-text');
    const btnEnter = document.getElementById('btn-enter');

    const bootLines = [
        "> CHECKING MEMORY... OK",
        "> MOUNTING DRIVES... OK",
        "> LOADING KERNEL... SUCCESS",
        "> INITIALIZING UI..."
    ];

    let lineIndex = 0;

    function typeLine() {
        if (lineIndex < bootLines.length) {
            bootText.innerHTML += bootLines[lineIndex] + '<br>';
            lineIndex++;
            setTimeout(typeLine, 300);
        } else {
            loaderCont.style.display = "block";
            setTimeout(() => {
                loader.style.width = "100%";
            }, 50);

            setTimeout(() => {
                splashText.innerHTML = "SYSTEM READY";
                splashText.style.color = "#fff";
                loaderCont.style.display = "none";
                bootText.style.display = "none";
                btnEnter.style.display = "block";
                btnEnter.focus();
            }, 1500);
        }
    }

    typeLine();
});

// COUNTDOWN LOGIC
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


class WindowManager {
    constructor() {
        this.desktop = document.getElementById('desktop');
        this.taskList = document.getElementById('task-list');
        this.zIndex = 100;
        this.windows = {};
        this.activeWindow = null;
        const style = document.createElement('style');
        style.innerHTML = `@keyframes blink { 0% { opacity: 1; } 50% { opacity: 0; } 100% { opacity: 1; } }`;
        document.head.appendChild(style);
    }

    isMobile() { return window.innerWidth <= 768; }

    open(id) {
        if (this.windows[id]) { this.restore(id); return; }
        sfx.open();

        const tpl = document.getElementById(`tpl-${id}`);
        if (!tpl) {
            console.error(`Template tpl-${id} not found!`);
            return;
        }

        const win = document.createElement('div');
        win.className = 'window';
        win.id = `win-${id}`;

        if (id === 'contact') {
            win.style.width = '480px';
            win.style.height = '740px';
        } else if (id === 'about') {
            win.style.width = '750px';
            win.style.height = '550px';
        } else if (id === 'work') {
            win.style.width = '1000px';
            win.style.height = '750px';
        } else if (id === 'cv') {
            win.style.width = '950px';
            win.style.height = '800px';
        } else {
            win.style.width = '600px';
            win.style.height = '450px';
        }

        if (id === 'home') {
            win.style.width = '800px'; win.style.height = '600px';
            if (!this.isMobile()) { win.style.top = '50%'; win.style.left = '50%'; win.style.transform = 'translate(-50%, -50%)'; }
            win.innerHTML = `<div class="window-header"><div class="window-title">MAIN_TERMINAL</div></div><div class="window-body">${tpl.innerHTML}</div>`;
        } else {
            if (!this.isMobile()) {
                win.style.top = '50%';
                win.style.left = '50%';
                win.style.transform = `translate(-50%, -50%) translate(${Math.random() * 20 - 10}px, ${Math.random() * 20 - 10}px)`;
            }

            // Force new window to top
            this.zIndex += 10;
            win.style.zIndex = this.zIndex;

            win.innerHTML = `<div class="window-header"><div class="controls"><div class="win-btn btn-close" onclick="wm.close('${id}', event)"></div><div class="win-btn btn-min" onclick="wm.minimize('${id}', event)"></div></div><div class="window-title">${id.toUpperCase()}.EXE</div></div><div class="window-body">${tpl.innerHTML}</div><div class="resize-handle"></div>`;
            if (!this.isMobile()) { this.makeDraggable(win); this.makeResizable(win); }
        }
        this.desktop.appendChild(win);
        const tab = document.createElement('div'); tab.className = 'task-tab'; tab.innerText = id.toUpperCase(); tab.setAttribute('data-icon', id.toUpperCase().charAt(0));
        tab.onclick = () => { sfx.click(); if (win.classList.contains('minimized')) this.restore(id); else if (this.activeWindow === id) this.minimize(id); else this.focus(id); };
        this.taskList.appendChild(tab);
        this.windows[id] = { win, tab };
        if (id !== 'home') requestAnimationFrame(() => win.classList.add('open')); else win.style.opacity = '1';
        this.focus(id);
    }

    close(id, e) {
        if (e) e.stopPropagation(); if (id === 'home') return; sfx.close();
        const ref = this.windows[id]; ref.win.classList.remove('open');
        setTimeout(() => { ref.win.remove(); ref.tab.remove(); delete this.windows[id]; }, 200);
    }

    minimize(id, e) {
        if (e) e.stopPropagation(); sfx.click();
        const ref = this.windows[id]; ref.win.classList.add('minimized'); ref.tab.classList.remove('active');
    }

    restore(id) { const ref = this.windows[id]; ref.win.classList.remove('minimized'); this.focus(id); }

    focus(id) {
        if (id !== 'home') {
            this.zIndex += 10;
            this.windows[id].win.style.zIndex = this.zIndex;
        }
        this.activeWindow = id;
        Object.values(this.windows).forEach(obj => obj.tab.classList.remove('active'));
        this.windows[id].tab.classList.add('active');
    }

    makeDraggable(el) {
        if (this.isMobile()) return;
        const header = el.querySelector('.window-header'); let isDragging = false, startX, startY, initialLeft, initialTop;
        header.onmousedown = (e) => { if (e.target.closest('.win-btn')) return; this.focus(el.id.replace('win-', '')); isDragging = true; startX = e.clientX; startY = e.clientY; initialLeft = el.offsetLeft; initialTop = el.offsetTop; document.body.style.cursor = 'grabbing'; document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp); };
        const onMove = (e) => { if (!isDragging) return; el.style.left = `${initialLeft + (e.clientX - startX)}px`; el.style.top = `${initialTop + (e.clientY - startY)}px`; };
        const onUp = () => { isDragging = false; document.body.style.cursor = 'default'; document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    }

    makeResizable(el) {
        if (this.isMobile()) return;
        const handle = el.querySelector('.resize-handle'); if (!handle) return; let isResizing = false, startX, startY, startW, startH;
        handle.onmousedown = (e) => { e.stopPropagation(); isResizing = true; startX = e.clientX; startY = e.clientY; startW = parseInt(document.defaultView.getComputedStyle(el).width, 10); startH = parseInt(document.defaultView.getComputedStyle(el).height, 10); document.addEventListener('mousemove', onResize); document.addEventListener('mouseup', stopResize); };
        const onResize = (e) => { if (!isResizing) return; el.style.width = (startW + e.clientX - startX) + 'px'; el.style.height = (startH + e.clientY - startY) + 'px'; };
        const stopResize = () => { isResizing = false; document.removeEventListener('mousemove', onResize); document.removeEventListener('mouseup', stopResize); };
    }

    toggleStart() { sfx.click(); document.getElementById('start-menu').classList.toggle('show'); }
}

const wm = new WindowManager();

setInterval(() => { const now = new Date(); document.getElementById('clock').innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }, 1000);
document.getElementById('btn-sfx').onclick = function () { sfx.on = !sfx.on; this.classList.toggle('muted', !sfx.on); this.innerText = sfx.on ? '🔊' : '🔇'; sfx.click(); };
document.getElementById('btn-bgm').onclick = function () { const isPlaying = bgm.toggle(); this.classList.toggle('muted', !isPlaying); this.innerText = isPlaying ? '🎵' : '❌'; sfx.click(); };
document.getElementById('btn-theme').onclick = function () { sfx.click(); const body = document.body; body.setAttribute('data-theme', body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'); };
