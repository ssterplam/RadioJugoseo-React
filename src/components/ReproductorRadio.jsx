import { useEffect, useRef, useState } from 'react'

const STREAM = 'https://stream.zeno.fm/f3wvbbqmdg8uv'

export default function ReproductorRadio() {
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
      window.removeEventListener('offline', manejarDesconexion)
      clearTimeout(timeoutRef.current)
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

  return (
    <div className="jugoseo-player fixed-bottom d-flex align-items-center gap-3">
      <div className="jugoseo-player-cover" />

      <div
        className="jugoseo-player-info d-none d-sm-block"
        style={{ minWidth: 140 }}
      >
        <div className="titulo">
          <span className="jugoseo-live-dot" />
          Jugoseo en vivo
        </div>

        <div className="subtitulo" aria-live="polite">
          {estado}
        </div>
      </div>

      <button
        type="button"
        className="jugoseo-btn-play"
        onClick={alternarReproduccion}
        aria-label={reproduciendo ? 'Pausar' : 'Reproducir'}
      >
        <svg
          width="16"
          height="16"
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
      </button>

      <div className="d-none d-md-flex align-items-center gap-2 ms-auto">
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="currentColor"
          style={{ color: 'var(--jugoseo-texto-tenue)' }}
          aria-hidden="true"
        >
          <path d="M9 4 5.5 6.5H3v3h2.5L9 12V4Z" />
          <path
            d="M11 6.2a2.5 2.5 0 0 1 0 3.6"
            stroke="currentColor"
            strokeWidth="1.2"
            fill="none"
          />
        </svg>

        <input
          type="range"
          className="form-range jugoseo-volume"
          min="0"
          max="1"
          step="0.01"
          value={volumen}
          onChange={cambiarVolumen}
          aria-label="Volumen de la radio"
        />
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
    </div>
  )
}