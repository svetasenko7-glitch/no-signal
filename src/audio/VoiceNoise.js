// === НАСТРОЙКИ ГОЛОСА ===
const voiceNoise = {
  noiseSynth: {
    noise: { type: 'white' },
    envelope: {
      attack: 0.001,
      decay: 0.3,
      sustain: 0.2,
      release: 0.3
    },
    volume: -6
  },
  metalSynth: {
    volume: -12,
    frequency: 200,
    envelope: {
      attack: 0.001,
      decay: 0.1,
      release: 0.01
    },
    harmonicity: 5.1,
    modulationIndex: 32,
    resonance: 4000,
    octaves: 1.5
  },
  ambientNoise: {
    type: 'brown',
    volume: -35
  },
  distortion: {
    wet: 0.6,
    distortion: 0.5,
    oversample: '4x'
  },
  autoWah: {
    wet: 0.8,
    baseFrequency: 200,
    octaves: 2,
    sensitivity: 0.5
  },
  feedbackDelay: {
    wet: 0.7,
    delayTime: '16n',
    feedback: 0.7,
    maxDelayTime: 1
  },
  channel: {
    volume: -3,
    pan: 0.6,
    mute: false,
    solo: false
  },
  // Длительность одной помехи
  noteDuration: '16n',
  // Длина петли
  loop: '2m'
}

// === ССЫЛКИ НА УЗЛЫ ===
let noiseSynth = null
let metalSynth = null
let ambientNoise = null
let distortion = null
let autoWah = null
let feedbackDelay = null
let channel = null
let part = null

// === ИНИЦИАЛИЗАЦИЯ ===
export function initVoiceNoise() {
  if (noiseSynth) return

  // Синтезаторы
  noiseSynth = new Tone.NoiseSynth(voiceNoise.noiseSynth)
  metalSynth = new Tone.MetalSynth(voiceNoise.metalSynth)

  // Постоянный эфирный шум
  ambientNoise = new Tone.Noise(voiceNoise.ambientNoise.type)
  ambientNoise.volume.value = voiceNoise.ambientNoise.volume

  // Эффекты
  distortion = new Tone.Distortion(voiceNoise.distortion)
  autoWah = new Tone.AutoWah(voiceNoise.autoWah)
  feedbackDelay = new Tone.FeedbackDelay(voiceNoise.feedbackDelay)

  // Канал — напрямую в destination (паттерн преподавателя)
  channel = new Tone.Channel(voiceNoise.channel).toDestination()

  // Три цепочки идут в общие эффекты → Channel
  noiseSynth.chain(distortion, autoWah, feedbackDelay, channel)
  metalSynth.chain(distortion, autoWah, feedbackDelay, channel)
  ambientNoise.chain(distortion, autoWah, feedbackDelay, channel)

  // Постоянный шум играет всегда
  ambientNoise.start()

  // Пустой Part — события добавятся через updateNoiseSequence()
  part = new Tone.Part((time, note) => {
    noiseSynth.triggerAttackRelease(note.duration, time, note.velocity)
    metalSynth.triggerAttackRelease('C4', '32n', time)
  }, []).start(0)

  part.loopEnd = voiceNoise.loop
  part.loop = true

  return {
    noiseSynth,
    metalSynth,
    ambientNoise,
    distortion,
    autoWah,
    feedbackDelay,
    channel,
    part
  }
}

// === ОБНОВЛЕНИЕ СЕКВЕНСОРА ===
// Вызывается из bindings.js при клике на шаг секвенсора
export function updateNoiseSequence(activeSteps) {
  if (!part) return

  // Очищаем все события
  part.clear()

  // Добавляем только активные шаги
  activeSteps.forEach((step) => {
    part.add({
      time: `0:${step}:0`,
      noteName: 'C4',
      duration: voiceNoise.noteDuration,
      velocity: 1
    })
  })
}

// === УПРАВЛЕНИЕ ПАРАМЕТРАМИ ===

// Смена типа шума (white / pink / brown)
export function setNoiseType(type) {
  if (noiseSynth) noiseSynth.noise.type = type
}

// Сила перегруза Distortion (0–1)
export function setNoiseDistortion(amount) {
  if (distortion) distortion.distortion = amount
}

// Базовая частота AutoWah (Гц)
export function setNoiseWah(freq) {
  if (autoWah) autoWah.baseFrequency = freq
}

// Feedback FeedbackDelay (0–0.9)
export function setNoiseFeedback(feedback) {
  if (feedbackDelay) feedbackDelay.feedback.value = feedback
}

// Громкость канала (в дБ, конвертируется из процентов в script.js)
export function setNoiseVolume(db) {
  if (channel) channel.volume.value = db
}

// Панорама канала (-1 … 1)
export function setNoisePan(value) {
  if (channel) channel.pan.value = value
}

// Громкость постоянного эфирного шума (дБ)
export function setNoiseAmbientVolume(db) {
  if (ambientNoise) ambientNoise.volume.value = db
}

// === РУЧНОЙ ТРИГГЕР (не используется в текущей версии) ===
export function triggerNoiseHit(duration = '16n') {
  if (noiseSynth) noiseSynth.triggerAttackRelease(duration)
  if (metalSynth) metalSynth.triggerAttackRelease('C4', '32n')
}

// === ДОСТУП К УЗЛАМ (для отладки) ===
export function getVoiceNoise() {
  return {
    noiseSynth,
    metalSynth,
    ambientNoise,
    distortion,
    autoWah,
    feedbackDelay,
    channel,
    part
  }
}