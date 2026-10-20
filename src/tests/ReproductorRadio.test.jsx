import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react'

import userEvent from '@testing-library/user-event'

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import ReproductorRadio from '../components/ReproductorRadio.jsx'

import useEmision from '../hooks/useEmision.js'

vi.mock('../hooks/useEmision.js', () => ({
  default: vi.fn(),
}))

let playMock
let pauseMock
let onlineMock

function montarReproductor() {
  const resultado = render(<ReproductorRadio />)

  const audio = resultado.container.querySelector(
    'audio',
  )

  expect(audio).toBeInTheDocument()

  return {
    ...resultado,
    audio,
  }
}

describe('ReproductorRadio', () => {
  beforeEach(() => {
    useEmision.mockReset()

    useEmision.mockReturnValue({
      emision: null,
      programa: null,
      error: '',
    })

    onlineMock = vi.spyOn(
      window.navigator,
      'onLine',
      'get',
    ).mockReturnValue(true)

    vi.stubGlobal('ResizeObserver', undefined)

    playMock = vi.spyOn(
      window.HTMLMediaElement.prototype,
      'play',
    ).mockImplementation(function () {
      Object.defineProperty(this, 'paused', {
        configurable: true,
        value: false,
      })

      this.dispatchEvent(new Event('playing'))

      return Promise.resolve()
    })

    pauseMock = vi.spyOn(
      window.HTMLMediaElement.prototype,
      'pause',
    ).mockImplementation(function () {
      Object.defineProperty(this, 'paused', {
        configurable: true,
        value: true,
      })

      this.dispatchEvent(new Event('pause'))
    })
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('muestra el estado inicial pausado, el nombre predeterminado y el volumen inicial', () => {
    const { audio } = montarReproductor()

    expect(
      screen.getByRole('region', {
        name: 'Reproductor de Radio Jugoseo',
        exact: true,
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByText('Jugoseo en vivo', {
        exact: true,
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByRole('status'),
    ).toHaveTextContent('Pausado')

    expect(
      screen.getByText(
        'Sin programa activo · simulación',
      ),
    ).toBeInTheDocument()

    expect(
      screen.getByRole('button', {
        name: 'Reproducir la radio',
        exact: true,
      }),
    ).toHaveAttribute('aria-pressed', 'false')

    expect(
      screen.getByRole('slider'),
    ).toHaveValue('0.8')

    expect(
      screen.getByText('80%', {
        exact: true,
      }),
    ).toBeInTheDocument()

    expect(audio.volume).toBeCloseTo(0.8)

    expect(audio).toHaveAttribute(
      'preload',
      'none',
    )

    expect(playMock).not.toHaveBeenCalled()
  })

  it('muestra el nombre y el estado del programa activo', () => {
    useEmision.mockReturnValue({
      emision: {
        programaId: 'programa-prueba',
      },
      programa: {
        nombre: 'Programa activo de prueba',
      },
      error: '',
    })

    montarReproductor()

    expect(
      screen.getByText(
        'Programa activo de prueba',
        { exact: true },
      ),
    ).toHaveAttribute(
      'title',
      'Programa activo de prueba',
    )

    expect(
      screen.getByText(
        'Programa activo · simulación',
      ),
    ).toBeInTheDocument()
  })

  it('informa cuando el estado del programa no está disponible', () => {
    useEmision.mockReturnValue({
      emision: null,
      programa: null,
      error: 'Error de consulta de prueba.',
    })

    montarReproductor()

    expect(
      screen.getByText(
        'Estado del programa no disponible',
      ),
    ).toBeInTheDocument()
  })

  it('solicita reproducir y permite pausar el audio', async () => {
    const usuario = userEvent.setup()

    montarReproductor()

    await usuario.click(
      screen.getByRole('button', {
        name: 'Reproducir la radio',
        exact: true,
      }),
    )

    expect(playMock).toHaveBeenCalledTimes(1)

    expect(
      screen.getByRole('status'),
    ).toHaveTextContent(
      'Transmitiendo en vivo',
    )

    const botonPausa = screen.getByRole(
      'button',
      {
        name: 'Pausar la radio',
        exact: true,
      },
    )

    expect(botonPausa).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    expect(
      screen.getByRole('region', {
        name: 'Reproductor de Radio Jugoseo',
        exact: true,
      }),
    ).toHaveClass('esta-reproduciendo')

    await usuario.click(botonPausa)

    expect(pauseMock).toHaveBeenCalledTimes(1)

    expect(
      screen.getByRole('status'),
    ).toHaveTextContent('Pausado')

    expect(
      screen.getByRole('button', {
        name: 'Reproducir la radio',
        exact: true,
      }),
    ).toHaveAttribute('aria-pressed', 'false')
  })

  it('muestra un error cuando el navegador rechaza la reproducción', async () => {
    const usuario = userEvent.setup()

    playMock.mockRejectedValue(
      new Error('Reproducción rechazada'),
    )

    montarReproductor()

    await usuario.click(
      screen.getByRole('button', {
        name: 'Reproducir la radio',
        exact: true,
      }),
    )

    expect(
      await screen.findByRole('status'),
    ).toHaveTextContent(
      'Transmisión no disponible',
    )

    expect(
      screen.getByRole('button', {
        name: 'Reproducir la radio',
        exact: true,
      }),
    ).toHaveAttribute('aria-pressed', 'false')
  })

  it('no solicita reproducir cuando el navegador está sin conexión', async () => {
    const usuario = userEvent.setup()

    onlineMock.mockReturnValue(false)

    montarReproductor()

    await usuario.click(
      screen.getByRole('button', {
        name: 'Reproducir la radio',
        exact: true,
      }),
    )

    expect(
      screen.getByRole('status'),
    ).toHaveTextContent(
      'Sin conexión a internet',
    )

    expect(playMock).not.toHaveBeenCalled()
  })

  it('pausa e informa la desconexión al recibir el evento offline', async () => {
    const usuario = userEvent.setup()

    montarReproductor()

    await usuario.click(
      screen.getByRole('button', {
        name: 'Reproducir la radio',
        exact: true,
      }),
    )

    onlineMock.mockReturnValue(false)

    fireEvent(
      window,
      new Event('offline'),
    )

    expect(pauseMock).toHaveBeenCalledTimes(1)

    expect(
      screen.getByRole('status'),
    ).toHaveTextContent(
      'Sin conexión a internet',
    )

    expect(
      screen.getByRole('button', {
        name: 'Reproducir la radio',
        exact: true,
      }),
    ).toHaveAttribute('aria-pressed', 'false')
  })

  it('actualiza el volumen del audio y el porcentaje mostrado', () => {
    const { audio } = montarReproductor()

    const control = screen.getByRole('slider')

    fireEvent.change(control, {
      target: { value: '0.35' },
    })

    expect(control).toHaveValue('0.35')

    expect(audio.volume).toBeCloseTo(0.35)

    expect(
      screen.getByText('35%', {
        exact: true,
      }),
    ).toBeInTheDocument()
  })

  it('muestra el estado de espera y el error al superar diez segundos', () => {
    vi.useFakeTimers()

    const { audio } = montarReproductor()

    fireEvent.waiting(audio)

    expect(
      screen.getByRole('status'),
    ).toHaveTextContent('Conectando...')

    act(() => {
      vi.advanceTimersByTime(10000)
    })

    expect(
      screen.getByRole('status'),
    ).toHaveTextContent(
      'Error de conexión presente',
    )
  })

  it.each([
    {
      codigo: 1,
      mensaje: 'Reproducción interrumpida',
    },
    {
      codigo: 2,
      mensaje: 'Error de conexión al streaming',
    },
    {
      codigo: 3,
      mensaje: 'Error al decodificar el audio',
    },
    {
      codigo: 4,
      mensaje:
        'Formato de audio no soportado o servicio no disponible',
    },
    {
      codigo: null,
      mensaje: 'Error en la transmisión',
    },
  ])(
    'muestra el mensaje correspondiente al error de audio $codigo',
    ({ codigo, mensaje }) => {
      const { audio } = montarReproductor()

      Object.defineProperty(audio, 'error', {
        configurable: true,
        value:
          codigo === null
            ? null
            : { code: codigo },
      })

      fireEvent.error(audio)

      expect(
        screen.getByRole('status'),
      ).toHaveTextContent(mensaje)

      expect(
        screen.getByRole('button', {
          name: 'Reproducir la radio',
          exact: true,
        }),
      ).toHaveAttribute('aria-pressed', 'false')
    },
  )
})