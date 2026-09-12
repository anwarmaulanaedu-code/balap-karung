const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

const SoundFX = {
    jump: () => {
        if(audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.1);
        
        gain.gain.setValueAtTime(1.0, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    },
    hit: () => {
        if(audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.2);
        
        gain.gain.setValueAtTime(1.0, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
    },
    win: () => {
        if(audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.type = 'square';
        osc.frequency.setValueAtTime(400, audioCtx.currentTime);
        osc.frequency.setValueAtTime(600, audioCtx.currentTime + 0.15);
        osc.frequency.setValueAtTime(800, audioCtx.currentTime + 0.3);
        osc.frequency.setValueAtTime(1200, audioCtx.currentTime + 0.45);
        
        gain.gain.setValueAtTime(1.0, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);
        
        osc.start();
        osc.stop(audioCtx.currentTime + 0.8);
    },
    beep: () => {
        if(audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        gain.gain.setValueAtTime(1.0, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
    },
    go: () => {
        if(audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'square';
        osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
        gain.gain.setValueAtTime(1.0, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.5);
    }
};

class BGM {
    constructor() {
        this.ctx = audioCtx;
        this.isPlaying = false;
        this.isMuted = false;
        // Simple peppy melody
        this.notes = [261.63, 329.63, 392.00, 523.25, 392.00, 329.63]; 
        this.nextNoteTime = 0;
        this.currentNote = 0;
        this.timerID = null;
    }

    nextNote() {
        const secondsPerBeat = 0.2;
        this.nextNoteTime += secondsPerBeat;
        this.currentNote = (this.currentNote + 1) % this.notes.length;
    }

    scheduleNote(beatNumber, time) {
        if (this.isMuted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.type = 'triangle';
        
        // Add some variation for a walking bass feel
        let freq = this.notes[beatNumber];
        if (beatNumber % 2 !== 0) freq = freq * 0.5; // drop octave on offbeats
        
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.5, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
        osc.start(time);
        osc.stop(time + 0.15);
    }

    scheduler() {
        while (this.nextNoteTime < this.ctx.currentTime + 0.1) {
            this.scheduleNote(this.currentNote, this.nextNoteTime);
            this.nextNote();
        }
        this.timerID = setTimeout(() => this.scheduler(), 25);
    }

    play() {
        if (this.isPlaying || this.isMuted) return;
        this.ctx.resume();
        this.isPlaying = true;
        this.nextNoteTime = this.ctx.currentTime + 0.05;
        this.scheduler();
    }

    stop() {
        this.isPlaying = false;
        clearTimeout(this.timerID);
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.isMuted) {
            this.stop();
        } else {
            if (window.gameState === 'PLAYING') this.play();
        }
        return this.isMuted;
    }
}

class MenuBGM {
    constructor() {
        this.ctx = audioCtx;
        this.isPlaying = false;
        this.isMuted = false;
        // Cheerful major arpeggios
        this.notes = [
            523.25, 659.25, 783.99, 1046.50, // C E G C
            523.25, 659.25, 783.99, 1046.50,
            440.00, 523.25, 659.25, 880.00,  // A C E A
            440.00, 523.25, 659.25, 880.00,
            349.23, 440.00, 523.25, 698.46,  // F A C F
            392.00, 493.88, 587.33, 783.99   // G B D G
        ]; 
        this.nextNoteTime = 0;
        this.currentNote = 0;
        this.timerID = null;
    }

    nextNote() {
        const secondsPerBeat = 0.12; // Faster, more cheerful
        this.nextNoteTime += secondsPerBeat;
        this.currentNote = (this.currentNote + 1) % this.notes.length;
    }

    scheduleNote(beatNumber, time) {
        if (this.isMuted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        // Synth pluck sound
        osc.type = 'sawtooth';
        
        osc.frequency.value = this.notes[beatNumber];
        gain.gain.setValueAtTime(0.3, time); // A bit softer than SFX
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
        osc.start(time);
        osc.stop(time + 0.1);
    }

    scheduler() {
        while (this.nextNoteTime < this.ctx.currentTime + 0.1) {
            this.scheduleNote(this.currentNote, this.nextNoteTime);
            this.nextNote();
        }
        this.timerID = setTimeout(() => this.scheduler(), 25);
    }

    play() {
        if (this.isPlaying || this.isMuted) return;
        this.ctx.resume();
        this.isPlaying = true;
        this.nextNoteTime = this.ctx.currentTime + 0.05;
        this.scheduler();
    }

    stop() {
        this.isPlaying = false;
        clearTimeout(this.timerID);
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.isMuted) {
            this.stop();
        } else {
            if (window.gameState === 'MENU') this.play();
        }
        return this.isMuted;
    }
}

const bgm = new BGM();
const menuBgm = new MenuBGM();
window.SoundFX = SoundFX;
window.bgm = bgm;
window.menuBgm = menuBgm;
