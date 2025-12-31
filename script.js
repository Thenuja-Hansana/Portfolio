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
        this.audio.volume = 0.4;
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
