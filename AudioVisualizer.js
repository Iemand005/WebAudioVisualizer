// Audio visualizer 2.0
// Lasse Lauwerys © 2026
// 02/07/2026

'use strict';

/** @param {number} fftSize  */
function AudioVisualizer(fftSize){
    this.elementSource = null;
    this.streamSource = null;
    this.source = null;
    
    /** @type {AudioContext} */
    this.context = AudioVisualizer._sharedContext;
    this.analyser = this.context.createAnalyser();

    this.updateBinCount(fftSize);
    /** @type {Uint8Array?} */
    this._frequencyData = null;
    /** @type {Uint8Array?} */
    this._timeDomainData = null;
}

AudioVisualizer._sharedContext = new AudioContext();
/** @type {WeakMap<HTMLElement, MediaElementAudioSourceNode>} */
AudioVisualizer._elementSources = new WeakMap();

AudioVisualizer.prototype.destroy = function () {
        this.analyser.disconnect();
    };

AudioVisualizer.prototype.disconnectAnalyser = function () {
    if (this.analyser && this.analyser.disconnect) this.analyser.disconnect();
};
/** @param {MediaElementAudioSourceNode | MediaStreamAudioSourceNode} source */
AudioVisualizer.prototype.initialize = function (source) {
    if (this.source && this.source.disconnect) {
        try { this.source.disconnect(this.analyser); } catch (e) {}
    }
    this.analyser.disconnect();
    this.source = source;
    this.source.connect(this.analyser);
    this.analyser.connect(this.context.destination);

	if (AudioVisualizer.sharedContext.state === 'suspended') {
        AudioVisualizer.sharedContext.resume();
	}
}

/** @param {HTMLMediaElement} element */
AudioVisualizer.prototype.initializeWithMediaElement = function (element) {
    this.elementSource = AudioVisualizer._elementSources.get(element);
    if (!this.elementSource) {
        this.elementSource = this.context.createMediaElementSource(element);
        AudioVisualizer._elementSources.set(element, this.elementSource);
    }
    this.initialize(this.elementSource);
};

/** @param {MediaStream} stream */
AudioVisualizer.prototype.initializeWithMediaStream = function (stream) {
    this.streamSource = this.context.createMediaStreamSource(stream);
    this.initialize(this.streamSource);
};

/** @param {number} fftSize  */
AudioVisualizer.prototype.updateBinCount = function (fftSize) {
    this.analyser.fftSize = fftSize || 64;

    const size = this.analyser.frequencyBinCount;

    this._frequencyData = new Uint8Array(size);
    this._timeDomainData = new Uint8Array(size);
};

Object.defineProperty(AudioVisualizer, "sharedContext", {
	get: function() {
		if (!AudioVisualizer._sharedContext) AudioVisualizer._sharedContext = new AudioContext();
		this.context = AudioVisualizer._sharedContext;
		return AudioVisualizer._sharedContext;
	}
});

Object.defineProperty(AudioVisualizer.prototype, "frequencyBinCount", {
  get: function() {
        return this.analyser.frequencyBinCount;
    }
});

Object.defineProperty(AudioVisualizer.prototype, "frequencyData", {
    get: function () {
        const size = this.frequencyBinCount;

        if (!this._frequencyData || this._frequencyData.length != size)
            this._frequencyData = new Uint8Array(size);

        this.analyser.getByteFrequencyData(this._frequencyData);
        return this._frequencyData;
    }
});

Object.defineProperty(AudioVisualizer.prototype, "timeDomainData", {
    get: function() {

         const size = this.frequencyBinCount;

        if (!this._timeDomainData || this._timeDomainData.length != size)
            this._timeDomainData = new Uint8Array(size);

        this.analyser.getByteTimeDomainData(this._timeDomainData);
        return this._timeDomainData;
    }
});

