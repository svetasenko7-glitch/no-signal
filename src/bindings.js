let drone = null
let droneActive = false

let prophylaxis = null
let prophylaxisActive = false

let stepHighlightId = null

export function bindControls(state, callbacks) {
  bindPlayPause(state, callbacks)
  bindStations(state, callbacks)
  bindDrone()
  bindProphylaxis()
  bindGlitch(state, callbacks)
  bindToggleSets(state, callbacks)
  bindKnobs(state, callbacks)
  bindSliders(state, callbacks)
  bindSequencerSteps(state)
}

function bindPlayPause(state, callbacks) {
  const playBtn = document.getElementById('playButton')
  if (!playBtn) return

  playBtn.addEventListener('click', () => {
    if (!state.isPlaying) {
      callbacks.onPlay()
      playBtn.textContent = '⏸'
      state.isPlaying = true
      startStepHighlight()
    } else {
      callbacks.onStop()
      playBtn.textContent = '▶'
      state.isPlaying = false
      stopStepHighlight()
    }
  })
}

function startStepHighlight() {
  if (stepHighlightId !== null) return

  stepHighlightId = Tone.getTransport().scheduleRepeat((time) => {
    const ticks = Tone.getTransport().ticks
    const ppq = Tone.getTransport().PPQ
    const step = Math.floor(ticks / (ppq / 2)) % 8

    Tone.getDraw().schedule(() => {
      document.querySelectorAll('.step.step--playing').forEach((el) => {
        el.classList.remove('step--playing')
      })
      document.querySelectorAll(`.step[data-step="${step}"]`).forEach((el) => {
        el.classList.add('step--playing')
      })
    }, time)
  }, '8n')
}

function stopStepHighlight() {
  if (stepHighlightId !== null) {
    Tone.getTransport().clear(stepHighlightId)
    stepHighlightId = null
  }
  document.querySelectorAll('.step.step--playing').forEach((el) => {
    el.classList.remove('step--playing')
  })
}

function bindStations(state, callbacks) {
  document.querySelectorAll('.station').forEach((stationEl) => {
    stationEl.addEventListener('click', () => {
      const station = stationEl.dataset.station

      document.querySelectorAll('.station').forEach((el) => {
        el.classList.remove('station--active')
      })

  
      stationEl.classList.add('station--active')


      state.station = station

      if (callbacks.onStation) {
        callbacks.onStation(station)
      }
    })
  })
}

function bindDrone() {
  const droneBtn = document.getElementById('droneButton')
  if (!droneBtn) return

  droneBtn.addEventListener('click', () => {
    if (!drone) {
      const osc1 = new Tone.Oscillator('C2', 'sine')
      osc1.volume.value = -18

      const osc2 = new Tone.Oscillator('C3', 'triangle')
      osc2.volume.value = -24

      const vibrato = new Tone.Vibrato({
        frequency: 3,
        depth: 0.2,
        wet: 0.5
      })

      const filter = new Tone.Filter(800, 'lowpass')
      filter.Q.value = 1

      const channel = new Tone.Channel({
        volume: -10,
        pan: 0
      }).toDestination()

      osc1.chain(vibrato, filter, channel)
      osc2.chain(vibrato, filter, channel)

      drone = { osc1, osc2, vibrato, filter, channel }
    }

    if (droneActive) {
      drone.osc1.stop()
      drone.osc2.stop()
      droneBtn.classList.remove('toggle--active')
    } else {
      drone.osc1.start()
      drone.osc2.start()
      droneBtn.classList.add('toggle--active')
    }

    droneActive = !droneActive
  })
}

function bindProphylaxis() {
  const btn = document.getElementById('prophylaxisButton')
  if (!btn) return

  btn.addEventListener('click', () => {
    if (!prophylaxis) {
      const beep = new Tone.Oscillator({
        frequency: 1000,
        type: 'sine',
        volume: -20
      })

      const noise = new Tone.Noise('pink')
      noise.volume.value = -30

      const filter = new Tone.Filter(2000, 'lowpass')
      filter.Q.value = 1

      const vibrato = new Tone.Vibrato({
        frequency: 5,
        depth: 0.1,
        wet: 0.5
      })

      const channel = new Tone.Channel({
        volume: -12,
        pan: 0
      }).toDestination()

      beep.chain(vibrato, filter, channel)
      noise.chain(filter, channel)

      prophylaxis = { beep, noise, filter, vibrato, channel }
    }

    if (prophylaxisActive) {
      prophylaxis.beep.stop()
      prophylaxis.noise.stop()
      btn.classList.remove('toggle--active')
    } else {
      prophylaxis.beep.start()
      prophylaxis.noise.start()
      btn.classList.add('toggle--active')
    }

    prophylaxisActive = !prophylaxisActive
  })
}

function bindGlitch(state, callbacks) {
  const glitchBtn = document.getElementById('glitchButton')
  if (!glitchBtn) return

  glitchBtn.addEventListener('click', () => {
    glitchBtn.classList.add('button--flashing')

    const saved = {
      bits: state.airBits,
      filter: state.airFilter,
      delay: state.airDelay,
      dist: state.noiseDist,
      wah: state.noiseWah,
      fdbk: state.noiseFdbk,
      tempo: state.tempo
    }

    const r = {
      bits: 1 + Math.random() * 4,
      filter: 0.1 + Math.random() * 15,
      delay: 0.5 + Math.random() * 0.5,
      dist: 0.5 + Math.random() * 0.5,
      wah: 50 + Math.random() * 700,
      fdbk: 0.5 + Math.random() * 0.4,
      tempo: 60 + Math.random() * 120
    }

    state.airBits = r.bits
    state.airFilter = r.filter
    state.airDelay = r.delay
    state.noiseDist = r.dist
    state.noiseWah = r.wah
    state.noiseFdbk = r.fdbk

    syncKnobFromState(state, 'airBits', callbacks)
    syncKnobFromState(state, 'airFilter', callbacks)
    syncKnobFromState(state, 'airDelay', callbacks)
    syncKnobFromState(state, 'noiseDist', callbacks)
    syncKnobFromState(state, 'noiseWah', callbacks)
    syncKnobFromState(state, 'noiseFdbk', callbacks)

    if (callbacks.onTempo) {
      callbacks.onTempo(r.tempo)
      const tempoInput = document.querySelector('[data-slider="tempo"] .slider__input')
      const tempoValue = document.querySelector('[data-slider="tempo"] .slider__value')
      if (tempoInput) tempoInput.value = r.tempo
      if (tempoValue) tempoValue.textContent = `${Math.round(r.tempo)} BPM`
    }

    const main = document.querySelector('.app__main')
    if (main) {
      main.classList.add('is-glitching')
      setTimeout(() => main.classList.remove('is-glitching'), 300)
    }

    setTimeout(() => {
      state.airBits = saved.bits
      state.airFilter = saved.filter
      state.airDelay = saved.delay
      state.noiseDist = saved.dist
      state.noiseWah = saved.wah
      state.noiseFdbk = saved.fdbk

      syncKnobFromState(state, 'airBits', callbacks)
      syncKnobFromState(state, 'airFilter', callbacks)
      syncKnobFromState(state, 'airDelay', callbacks)
      syncKnobFromState(state, 'noiseDist', callbacks)
      syncKnobFromState(state, 'noiseWah', callbacks)
      syncKnobFromState(state, 'noiseFdbk', callbacks)

      if (callbacks.onTempo) {
        callbacks.onTempo(saved.tempo)
        const tempoInput = document.querySelector('[data-slider="tempo"] .slider__input')
        const tempoValue = document.querySelector('[data-slider="tempo"] .slider__value')
        if (tempoInput) tempoInput.value = saved.tempo
        if (tempoValue) tempoValue.textContent = `${saved.tempo} BPM`
      }

      glitchBtn.classList.remove('button--flashing')
    }, 500)
  })
}

function bindToggleSets(state, callbacks) {
  document.querySelectorAll('.toggle-set').forEach((set) => {
    const setName = set.dataset.set

    set.querySelectorAll('.toggle').forEach((btn) => {
      btn.addEventListener('click', () => {
        const value = btn.dataset.value

        set.querySelectorAll('.toggle').forEach((b) => {
          b.classList.remove('toggle--active')
          b.classList.remove('toggle--noise')
        })

        btn.classList.add('toggle--active')
        if (setName === 'noiseType') btn.classList.add('toggle--noise')

        if (setName === 'airWaveform') {
          state.airWaveform = value
          callbacks.onAirWaveform(value)
        } else if (setName === 'noiseType') {
          state.noiseType = value
          callbacks.onNoiseType(value)
        }
      })
    })
  })
}

function bindKnobs(state, callbacks) {
  document.querySelectorAll('.knob').forEach((knob) => {
    const key = knob.dataset.knob
    const min = parseFloat(knob.dataset.min)
    const max = parseFloat(knob.dataset.max)

    let mouseDown = false
    let cursorY = 0

    knob.addEventListener('mousedown', (e) => {
      e.preventDefault()
      mouseDown = true
      cursorY = e.screenY
    })

    window.addEventListener('mousemove', (e) => {
      if (!mouseDown) return

      const delta = cursorY - e.screenY
      if (delta === 0) return

      const range = max - min
      const step = range / 100
      let value = state[key] + delta * step

      if (value < min) value = min
      if (value > max) value = max

      state[key] = value

      updateKnobRotation(knob, min, max, value)
      applyKnobCallback(key, value, callbacks)

      cursorY = e.screenY
    })

    window.addEventListener('mouseup', () => {
      mouseDown = false
    })
  })
}

function bindSliders(state, callbacks) {
  document.querySelectorAll('.slider').forEach((slider) => {
    const key = slider.dataset.slider
    const input = slider.querySelector('.slider__input')
    const valueLabel = slider.querySelector('.slider__value')

    if (!input) return

    input.addEventListener('input', () => {
      const value = input.valueAsNumber
      state[key] = value

      if (valueLabel) {
        if (key === 'tempo') {
          valueLabel.textContent = `${value} BPM`
        } else {
          valueLabel.textContent = `${value}%`
        }
      }

      if (key === 'tempo') {
        callbacks.onTempo(value)
      } else if (key === 'airVolume') {
        callbacks.onAirVolume(value)
      } else if (key === 'noiseVolume') {
        callbacks.onNoiseVolume(value)
      }
    })
  })
}

function bindSequencerSteps(state) {
  document.querySelectorAll('.sequencer-row .step').forEach((step) => {
    step.addEventListener('click', () => {
      const row = step.dataset.row
      const index = parseInt(step.dataset.step, 10)

      if (row === 'air') {
        toggleArrayItem(state.airSteps, index)
        step.classList.toggle('step--active')
        import('./audio/VoiceAir.js').then(({ updateAirSequence }) => {
          updateAirSequence(state.airSteps)
        })
      } else if (row === 'noise') {
        toggleArrayItem(state.noiseSteps, index)
        step.classList.toggle('step--active')
        import('./audio/VoiceNoise.js').then(({ updateNoiseSequence }) => {
          updateNoiseSequence(state.noiseSteps)
        })
      }
    })
  })
}

export function updateKnobRotation(knobEl, min, max, value) {
  const body = knobEl.querySelector('.knob__body')
  if (!body) return

  const percent = (value - min) / (max - min)
  const deg = -140 + percent * 280

  body.style.transform = `rotate(${deg}deg)`
}

function syncKnobFromState(state, key, callbacks) {
  const knob = document.querySelector(`.knob[data-knob="${key}"]`)
  if (!knob) return

  const min = parseFloat(knob.dataset.min)
  const max = parseFloat(knob.dataset.max)
  const value = state[key]

  updateKnobRotation(knob, min, max, value)
  applyKnobCallback(key, value, callbacks)
}

function applyKnobCallback(key, value, callbacks) {
  switch (key) {
    case 'airBits':   callbacks.onAirBits(value);         break
    case 'airFilter': callbacks.onAirFilter(value);       break
    case 'airDelay':  callbacks.onAirDelay(value);        break
    case 'noiseDist': callbacks.onNoiseDistortion(value); break
    case 'noiseWah':  callbacks.onNoiseWah(value);        break
    case 'noiseFdbk': callbacks.onNoiseFeedback(value);   break
  }
}

function toggleArrayItem(arr, index) {
  const i = arr.indexOf(index)
  if (i === -1) {
    arr.push(index)
  } else {
    arr.splice(i, 1)
  }
}