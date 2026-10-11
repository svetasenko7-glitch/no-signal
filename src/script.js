import {
  initVoiceAir,
  updateAirSequence,
  setAirWaveform,
  setAirBits,
  setAirFilter,
  setAirDelay,
  setAirVolume
} from './audio/VoiceAir.js'

import {
  initVoiceNoise,
  updateNoiseSequence,
  setNoiseType,
  setNoiseDistortion,
  setNoiseWah,
  setNoiseFeedback,
  setNoiseVolume
} from './audio/VoiceNoise.js'

import { bindControls, updateKnobRotation } from './bindings.js'

const appState = {
  isPlaying: false,
  tempo: 120,
  station: 'am',

  // Voice Air
  airWaveform: 'sine',
  airBits: 8,
  airFilter: 1,
  airDelay: 0.3,
  airVolume: 100,   // ← проценты (0–100), НЕ дБ

  // Voice Noise
  noiseType: 'white',
  noiseDist: 0.5,
  noiseWah: 200,
  noiseFdbk: 0.5,
  noiseVolume: 100,   // ← проценты (0–100), НЕ дБ

  // Секвенсор
  airSteps: [0, 2, 4, 6],
  noiseSteps: [1, 3, 5, 7],
  currentStep: -1
}

function percentToDb(percent) {
  if (percent <= 0) return -Infinity
  return 20 * Math.log10(percent / 100)
}

function applyStation(station) {
  appState.station = station

  let settings = {}

  if (station === 'am') {
    settings = {
      airWaveform: 'sine',
      airBits: 8,
      airFilter: 0.5,
      airDelay: 0.2,
      noiseType: 'pink',
      noiseDist: 0.3,
      noiseWah: 150,
      noiseFdbk: 0.3,
      tempo: 90
    }
  } else if (station === 'fm') {
    settings = {
      airWaveform: 'square',
      airBits: 4,
      airFilter: 3,
      airDelay: 0.5,
      noiseType: 'white',
      noiseDist: 0.6,
      noiseWah: 300,
      noiseFdbk: 0.5,
      tempo: 120
    }
  } else if (station === 'noise') {
    settings = {
      airWaveform: 'square',
      airBits: 1,
      airFilter: 8,
      airDelay: 0.9,
      noiseType: 'white',
      noiseDist: 0.9,
      noiseWah: 500,
      noiseFdbk: 0.9,
      tempo: 160
    }
  }

  Object.assign(appState, settings)

  setAirWaveform(settings.airWaveform)
  setAirBits(settings.airBits)
  setAirFilter(settings.airFilter)
  setAirDelay(settings.airDelay)
  setNoiseType(settings.noiseType)
  setNoiseDistortion(settings.noiseDist)
  setNoiseWah(settings.noiseWah)
  setNoiseFeedback(settings.noiseFdbk)

  Tone.getTransport().bpm.value = settings.tempo

  syncUIFromState()
}

function syncUIFromState() {
  document.querySelectorAll('.knob').forEach((knob) => {
    const key = knob.dataset.knob
    const min = parseFloat(knob.dataset.min)
    const max = parseFloat(knob.dataset.max)
    updateKnobRotation(knob, min, max, appState[key])
  })

  const tempoInput = document.querySelector('[data-slider="tempo"] .slider__input')
  const tempoValue = document.querySelector('[data-slider="tempo"] .slider__value')
  if (tempoInput) tempoInput.value = appState.tempo
  if (tempoValue) tempoValue.textContent = `${appState.tempo} BPM`

  document.querySelectorAll('.toggle-set').forEach((set) => {
    const setName = set.dataset.set

    let currentValue = null
    if (setName === 'airWaveform') currentValue = appState.airWaveform
    if (setName === 'noiseType') currentValue = appState.noiseType

    set.querySelectorAll('.toggle').forEach((btn) => {
      btn.classList.toggle('toggle--active', btn.dataset.value === currentValue)
      if (setName === 'noiseType') {
        btn.classList.toggle('toggle--noise', btn.dataset.value === currentValue)
      }
    })
  })
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.knob').forEach((knob) => {
    const key = knob.dataset.knob
    const min = parseFloat(knob.dataset.min)
    const max = parseFloat(knob.dataset.max)
    updateKnobRotation(knob, min, max, appState[key])
  })

  bindControls(appState, {
   onPlay: async () => {
  await Tone.start()
  // Размьютить выход (включит все звуки)
  Tone.Destination.mute = false

  initVoiceAir()
  initVoiceNoise()

  updateAirSequence(appState.airSteps)
  updateNoiseSequence(appState.noiseSteps)

  Tone.getTransport().bpm.value = appState.tempo
  Tone.getTransport().start()
},

  onStop: () => {
  Tone.getTransport().stop()
  Tone.getTransport().position = 0
  // Замьютить выход — полная тишина
  Tone.Destination.mute = true
},

    onTempo: (bpm) => {
      appState.tempo = bpm
      Tone.getTransport().bpm.value = bpm
    },

    onStation: (station) => {
      applyStation(station)
    },

    onAirWaveform: (value) => setAirWaveform(value),
    onAirBits: (value) => setAirBits(value),
    onAirFilter: (value) => setAirFilter(value),
    onAirDelay: (value) => setAirDelay(value),
    onAirVolume: (percent) => {
      // bindings.js отправляет проценты (0–100)
      // VoiceAir принимает дБ — конвертируем
      setAirVolume(percentToDb(percent))
    },

    onNoiseType: (value) => setNoiseType(value),
    onNoiseDistortion: (value) => setNoiseDistortion(value),
    onNoiseWah: (value) => setNoiseWah(value),
    onNoiseFeedback: (value) => setNoiseFeedback(value),
    onNoiseVolume: (percent) => {
      setNoiseVolume(percentToDb(percent))
    }
  })
})