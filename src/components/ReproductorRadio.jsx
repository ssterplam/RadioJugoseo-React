import { useEffect, useRef, useState } from 'react'

import useEmision from '../hooks/useEmision.js'

const STREAM = 'https://stream.zeno.fm/f3wvbbqmdg8uv'

export default function ReproductorRadio() {
  const {
    emision,
    programa: programaEnEmision,
    error: errorEmision,
  } = useEmision()

  const playerRef = useRef(null)
  const audioRef = useRef(null)
  const timeoutRef = useRef(null)

  const [reproduciendo, setReproduciendo] = useState(false)
  const [estado, setEstado] = useState('Pausado')
  const [volumen, setVolumen] = useState(0.8)

  function limpiarTimeout() {
    clearTimeout(timeoutRef.current)
  }

  useEffect(() => {
    const audio = audioRef.current

    audio.volume = 0.8

    function manejarDesconexion() {
      audio.pause()
      clearTimeout(timeoutRef.current)
      setReproduciendo(false)
      setEstado('Sin conexión a internet')
    }

    window.addEventListener('offline', manejarDesconexion)

    return () => {
      window.removeEventListener(
        'offline',
        manejarDesconexion,
      )

      clearTimeout(timeoutRef.current)
    }
  }, [])

  useEffect(() => {
    const player = playerRef.current

    if (!player) {
      return
    }

    function actualizarAltura() {
      const altura = Math.ceil(
        player.getBoundingClientRect().height,
      )

      document.documentElement.style.setProperty(
        '--jugoseo-player-alto',
        `${altura}px`,
      )
    }

    actualizarAltura()

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', actualizarAltura)

      return () => {
        window.removeEventListener(
          'resize',
          actualizarAltura,
        )

        document.documentElement.style.removeProperty(
          '--jugoseo-player-alto',
        )
      }
    }

    const observador = new ResizeObserver(actualizarAltura)

    observador.observe(player)

    return () => {
      observador.disconnect()

      document.documentElement.style.removeProperty(
        '--jugoseo-player-alto',
      )
    }
  }, [])

  async function alternarReproduccion() {
    const audio = audioRef.current

    if (!audio.paused) {
      limpiarTimeout()
      audio.pause()
      return
    }

    if (!navigator.onLine) {
      setEstado('Sin conexión a internet')
      return
    }

    try {
      const url = new URL(STREAM)

      if (!['http:', 'https:'].includes(url.protocol)) {
        setEstado('URL de transmisión inválida')
        return
      }

      setEstado('Conectando...')
      await audio.play()
    } catch {
      limpiarTimeout()
      setReproduciendo(false)

      setEstado(
        navigator.onLine
          ? 'Transmisión no disponible'
          : 'Sin conexión a internet',
      )
    }
  }

  function manejarEspera() {
    limpiarTimeout()
    setEstado('Conectando...')

    timeoutRef.current = setTimeout(() => {
      setEstado('Error de conexión presente')
    }, 10000)
  }

  function manejarError() {
    limpiarTimeout()
    setReproduciendo(false)

    const codigo = audioRef.current.error?.code

    const mensajes = {
      1: 'Reproducción interrumpida',
      2: 'Error de conexión al streaming',
      3: 'Error al decodificar el audio',
      4: 'Formato de audio no soportado o servicio no disponible',
    }

    setEstado(
      navigator.onLine
        ? mensajes[codigo] || 'Error en la transmisión'
        : 'Sin conexión a internet',
    )
  }

  function cambiarVolumen(evento) {
    const nuevoVolumen = Number(evento.target.value)

    setVolumen(nuevoVolumen)
    audioRef.current.volume = nuevoVolumen
  }

  const nombrePrograma =
    programaEnEmision?.nombre || 'Jugoseo en vivo'

  const estadoPrograma = errorEmision
    ? 'Estado del programa no disponible'
    : emision
      ? 'Programa activo · simulación'
      : 'Sin programa activo · simulación'

  return (
    <section
      ref={playerRef}
      className={
        'jugoseo-player jugoseo-player-destacado fixed-top' +
        (reproduciendo ? ' esta-reproduciendo' : '')
      }
      aria-label="Reproductor de Radio Jugoseo"
    >
      <div className="container jugoseo-player-contenido">
        <div
          className="jugoseo-player-marca"
          aria-hidden="true"
        >
          J
          <span>RADIO</span>
        </div>

        <div className="jugoseo-player-datos">
          <div className="jugoseo-player-etiqueta">
            <span className="jugoseo-live-dot" />
            RADIO ONLINE
          </div>

          <div
            className="jugoseo-player-nombre"
            title={nombrePrograma}
          >
            {nombrePrograma}
          </div>

          <div
            className="jugoseo-player-estado"
            role="status"
          >
            {estado}
          </div>

          <div className="jugoseo-player-programa">
            {estadoPrograma}
          </div>
        </div>

        <button
          type="button"
          className="jugoseo-btn-play"
          onClick={alternarReproduccion}
          aria-label={
            reproduciendo
              ? 'Pausar la radio'
              : 'Reproducir la radio'
          }
          aria-pressed={reproduciendo}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 16 16"
            fill="currentColor"
            aria-hidden="true"
          >
            {reproduciendo ? (
              <path d="M4 2.5h3v11H4v-11Zm5 0h3v11H9v-11Z" />
            ) : (
              <path d="M4 2.5v11l9-5.5-9-5.5Z" />
            )}
          </svg>

          <span className="jugoseo-player-accion">
            {reproduciendo ? 'Pausar' : 'Escuchar'}
          </span>
        </button>

        <div className="jugoseo-player-volumen">
          <label
            htmlFor="volumenRadioJugoseo"
            className="jugoseo-player-volumen-label"
          >
            Volumen
            <span>{Math.round(volumen * 100)}%</span>
          </label>

          <input
            id="volumenRadioJugoseo"
            type="range"
            className="form-range jugoseo-volume"
            min="0"
            max="1"
            step="0.01"
            value={volumen}
            onChange={cambiarVolumen}
          />
        </div>
      </div>

      <audio
        ref={audioRef}
        src={STREAM}
        preload="none"
        onPlaying={() => {
          limpiarTimeout()
          setReproduciendo(true)
          setEstado('Transmitiendo en vivo')
        }}
        onPause={() => {
          setReproduciendo(false)

          if (!audioRef.current.error && navigator.onLine) {
            setEstado('Pausado')
          }
        }}
        onWaiting={manejarEspera}
        onError={manejarError}
      >
        Tu navegador no soporta audio HTML5.
      </audio>
    </section>
  )
}