// === НАСТРОЙКИ ГОЛОСА ===
const voiceAir = {
  synth: {
    volume: -6,
    detune: 0,
    portamento: 0.05,
    envelope: {
      attack: 0.05,
      attackCurve: 'exponential',
      decay: 0.2,
      decayCurve: 'exponential',
      sustain: 0.5,
      release: 0.8,
      releaseCurve: 'exponential'
    },
    oscillator: {
      type: 'sine'
    }
  },
  noise: {
    type: 'pink',
    volume: -30
  },
  bitCrusher: {
    bits: 8,
    wet: 0.5
  },
  autoFilter: {
    wet: 0.7,
    frequency: 1,
    type: 'sine',
    depth: 0.4,
    baseFrequency: 200,
    octaves: 3,
    filter: {
      type: 'lowpass',
      rolloff: -12
    }
  },
  pingPongDelay: {
    wet: 0.4,
    delayTime: '8n',
    feedback: 0.3,
    maxDelayTime: 1
  },
  channel: {
    volume: -3,
    pan: -0.6,
    mute: false,
    solo: false
  },
  // Ноты по шагам (8 шагов)
  notes: ['C4', 'D4', 'E4', 'G4', 'A4', 'G4', 'E4', 'D4'],
  // Длительность одной ноты
  noteDuration: '8n',
  // Длина петли
  loop: '2m'
}

// === ССЫЛКИ НА УЗЛЫ ===
let synth = null
let noise = null
let bitCrusher = null
let autoFilter = null
let pingPongDelay = null
let channel = null
let part = null

// === ИНИЦИАЛИЗАЦИЯ ===
export function initVoiceAir() {
  if (synth) return

  // Синтезатор
  synth = new Tone.Synth(voiceAir.synth)

  // Постоянный шум — «эфирный фон»
  noise = new Tone.Noise(voiceAir.noise.type)
  noise.volume.value = voiceAir.noise.volume

  // BitCrusher — «ломает» сигнал
  bitCrusher = new Tone.BitCrusher(voiceAir.bitCrusher.bits)
  bitCrusher.wet.value = voiceAir.bitCrusher.wet

  // AutoFilter — «сканирует» частоты
  autoFilter = new Tone.AutoFilter(voiceAir.autoFilter).start()

  // PingPongDelay — эхо
  pingPongDelay = new Tone.PingPongDelay(voiceAir.pingPongDelay)

  // Канал — напрямую в destination (паттерн преподавателя)
  channel = new Tone.Channel(voiceAir.channel).toDestination()

  // Цепочки: Synth + Noise → BitCrusher → AutoFilter → PingPongDelay → Channel
  synth.chain(bitCrusher, autoFilter, pingPongDelay, channel)
  noise.chain(bitCrusher, autoFilter, pingPongDelay, channel)

  // Шум играет постоянно
  noise.start()

  // Пустой Part — события добавятся через updateAirSequence()
  part = new Tone.Part((time, note) => {
    synth.triggerAttackRelease(
      note.noteName,
      note.duration,
      time,
      note.velocity
    )
  }, []).start(0)

  part.loopEnd = voiceAir.loop
  part.loop = true

  return { synth, noise, bitCrusher, autoFilter, pingPongDelay, channel, part }
}

// === ОБНОВЛЕНИЕ СЕКВЕНСОРА ===
// Вызывается из bindings.js при клике на шаг секвенсора
export function updateAirSequence(activeSteps) {
  if (!part) return

  // Очищаем все события
  part.clear()

  // Добавляем только активные шаги
  activeSteps.forEach((step) => {
    part.add({
      time: `0:${step}:0`,
      noteName: voiceAir.notes[step % voiceAir.notes.length],
      duration: voiceAir.noteDuration,
      velocity: 1
    })
  })
}

// === УПРАВЛЕНИЕ ПАРАМЕТРАМИ ===

// Смена формы волны (sine / square / saw / triangle)
export function setAirWaveform(type) {
  if (!synth) return
  synth.oscillator.type = type
}

// Битность BitCrusher (1–8)
export function setAirBits(bits) {
  if (bitCrusher) bitCrusher.bits.value = bits
}

// Частота AutoFilter (Гц)
export function setAirFilter(freq) {
  if (autoFilter) autoFilter.frequency.value = freq
}

// Feedback PingPongDelay (0–0.9)
export function setAirDelay(feedback) {
  if (pingPongDelay) pingPongDelay.feedback.value = feedback
}

// Громкость канала (в дБ, конвертируется из процентов в script.js)
export function setAirVolume(db) {
  if (channel) channel.volume.value = db
}

// Панорама канала (-1 … 1)
export function setAirPan(value) {
  if (channel) channel.pan.value = value
}

// Громкость постоянного шума (дБ)
export function setAirNoiseVolume(db) {
  if (noise) noise.volume.value = db
}

// === РУЧНОЙ ТРИГГЕР (не используется в текущей версии) ===
export function triggerAirNote(note = 'C4', duration = '8n') {
  if (synth) synth.triggerAttackRelease(note, duration)
}

// === ДОСТУП К УЗЛАМ (для отладки) ===
export function getVoiceAir() {
  return { synth, noise, bitCrusher, autoFilter, pingPongDelay, channel, part }
}