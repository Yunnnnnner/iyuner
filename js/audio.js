class AudioManager {
    constructor() {
        this.audioContext = null;
        this.bgm = null;
        this.currentTrack = null;
        this.volume = 0.5;
        this.enabled = true;
        
        this.init();
    }
    
    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported');
        }
    }
    
    resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
    
    playTone(frequency, duration, type = 'sine', volume = 0.3) {
        if (!this.audioContext || !this.enabled) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    playChord(frequencies, duration, volume = 0.3) {
        if (!this.audioContext || !this.enabled) return;
        
        frequencies.forEach((freq, index) => {
            setTimeout(() => {
                this.playTone(freq, duration, 'sine', volume * 0.6);
            }, index * 50);
        });
    }
    
    playCollectSound(type) {
        if (!this.enabled) return;
        
        switch (type) {
            case 'fragment':
                this.playChord([523.25, 659.25, 783.99], 0.5, 0.3);
                setTimeout(() => this.playTone(1046.5, 0.3, 'sine', 0.2), 200);
                break;
            case 'wing':
                this.playChord([440, 554.37, 659.25, 880], 1.0, 0.4);
                setTimeout(() => this.playChord([880, 1108.73, 1318.51], 0.8, 0.3), 300);
                break;
            case 'candle':
                this.playTone(329.63, 0.3, 'sine', 0.3);
                setTimeout(() => this.playTone(392, 0.4, 'sine', 0.25), 150);
                break;
        }
    }
    
    playFlySound() {
        if (!this.enabled || Math.random() > 0.3) return;
        
        const freq = 200 + Math.random() * 100;
        this.playTone(freq, 0.2, 'sine', 0.1);
    }
    
    playWindSound() {
        if (!this.enabled || Math.random() > 0.1) return;
        
        const noiseBuffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * 0.5, this.audioContext.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        
        for (let i = 0; i < noiseBuffer.length; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        
        const whiteNoise = this.audioContext.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400;
        
        const gainNode = this.audioContext.createGain();
        gainNode.gain.setValueAtTime(0.05, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
        
        whiteNoise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        whiteNoise.start();
    }
    
    playBGM(mapType) {
        if (!this.audioContext || !this.enabled) return;
        
        this.stopBGM();
        
        const melodies = {
            dawn: [
                { freq: 523.25, duration: 1.0 },
                { freq: 587.33, duration: 1.0 },
                { freq: 659.25, duration: 1.0 },
                { freq: 783.99, duration: 2.0 },
                { freq: 659.25, duration: 1.0 },
                { freq: 587.33, duration: 1.0 }
            ],
            cloud: [
                { freq: 440, duration: 1.5 },
                { freq: 554.37, duration: 1.5 },
                { freq: 659.25, duration: 1.5 },
                { freq: 880, duration: 2.0 },
                { freq: 783.99, duration: 1.5 },
                { freq: 659.25, duration: 1.5 }
            ],
            rain: [
                { freq: 349.23, duration: 2.0 },
                { freq: 392, duration: 2.0 },
                { freq: 440, duration: 2.0 },
                { freq: 523.25, duration: 3.0 },
                { freq: 440, duration: 2.0 },
                { freq: 392, duration: 2.0 }
            ]
        };
        
        const melody = melodies[mapType] || melodies.dawn;
        let noteIndex = 0;
        
        const playNextNote = () => {
            if (!this.enabled || !this.currentTrack) return;
            
            const note = melody[noteIndex];
            this.playTone(note.freq, note.duration * 0.8, 'sine', 0.15);
            
            noteIndex = (noteIndex + 1) % melody.length;
            this.currentTrack = setTimeout(playNextNote, note.duration * 1000);
        };
        
        this.currentTrack = setTimeout(playNextNote, 0);
    }
    
    stopBGM() {
        if (this.currentTrack) {
            clearTimeout(this.currentTrack);
            this.currentTrack = null;
        }
    }
    
    playEndingMusic() {
        if (!this.enabled) return;
        
        this.stopBGM();
        
        const endingMelody = [
            { freq: 523.25, duration: 1.0 },
            { freq: 659.25, duration: 1.0 },
            { freq: 783.99, duration: 1.0 },
            { freq: 1046.5, duration: 2.0 },
            { freq: 880, duration: 1.0 },
            { freq: 1046.5, duration: 3.0 }
        ];
        
        let noteIndex = 0;
        
        const playNextNote = () => {
            if (noteIndex >= endingMelody.length) return;
            
            const note = endingMelody[noteIndex];
            this.playChord([note.freq, note.freq * 1.5], note.duration, 0.3);
            
            noteIndex++;
            setTimeout(playNextNote, note.duration * 1000);
        };
        
        playNextNote();
    }
    
    setVolume(value) {
        this.volume = Math.max(0, Math.min(1, value));
    }
    
    toggle() {
        this.enabled = !this.enabled;
        if (!this.enabled) {
            this.stopBGM();
        }
        return this.enabled;
    }
}

const audioManager = new AudioManager();
