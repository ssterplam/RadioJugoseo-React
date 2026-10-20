import {
  render,
  screen,
} from '@testing-library/react'

import userEvent from '@testing-library/user-event'

import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import ControlesEmision from '../components/ControlesEmision.jsx'

import {
  finalizarEmision,
  iniciarEmision,
} from '../utils/programasStorage.js'

import {
  tieneLocutorDisponible,
} from '../utils/locutoresStorage.js'

vi.mock('../utils/programasStorage.js', () => ({
  finalizarEmision: vi.fn(),
  iniciarEmision: vi.fn(),
}))

vi.mock('../utils/locutoresStorage.js', () => ({
  tieneLocutorDisponible: vi.fn(),
}))

const programaPrueba = {
  id: 'programa-prueba',
  nombre: 'Programa de prueba',
  locutorCorreo: 'locutor@jugoseo.com',
}

function montarControles(propiedades = {}) {
  render(
    <ControlesEmision
      programa={programaPrueba}
      emision={null}
      errorEmision=""
      {...propiedades}
    />,
  )
}

describe('ControlesEmision', () => {
  beforeEach(() => {
    iniciarEmision.mockReset()
    finalizarEmision.mockReset()

    tieneLocutorDisponible.mockReset()
    tieneLocutorDisponible.mockReturnValue(true)
  })

  it('permite iniciar cuando no hay emisión activa y el locutor está disponible', () => {
    montarControles()

    expect(
      screen.getByText(
        'Programa sin emisión activa',
      ),
    ).toBeInTheDocument()

    expect(
      screen.getByRole('button', {
        name: 'Salir al aire',
        exact: true,
      }),
    ).toBeEnabled()

    expect(
      screen.queryByRole('button', {
        name: 'Finalizar emisión',
        exact: true,
      }),
    ).not.toBeInTheDocument()

    expect(
      tieneLocutorDisponible,
    ).toHaveBeenCalledWith(
      'locutor@jugoseo.com',
    )

    expect(
      screen.queryByRole('status'),
    ).not.toBeInTheDocument()
  })

  it('solicita iniciar el programa y muestra el aviso de éxito', async () => {
    const usuario = userEvent.setup()

    montarControles()

    await usuario.click(
      screen.getByRole('button', {
        name: 'Salir al aire',
        exact: true,
      }),
    )

    expect(
      iniciarEmision,
    ).toHaveBeenCalledTimes(1)

    expect(
      iniciarEmision,
    ).toHaveBeenCalledWith(
      programaPrueba.id,
    )

    expect(
      screen.getByRole('status'),
    ).toHaveTextContent(
      'Emisión simulada iniciada.',
    )

    expect(
      screen.getByRole('status'),
    ).toHaveClass('alert-success')
  })

  it('muestra un error si no se puede iniciar la emisión', async () => {
    const usuario = userEvent.setup()

    iniciarEmision.mockImplementation(() => {
      throw new Error('Error simulado de inicio')
    })

    montarControles()

    await usuario.click(
      screen.getByRole('button', {
        name: 'Salir al aire',
        exact: true,
      }),
    )

    expect(
      screen.getByRole('status'),
    ).toHaveTextContent(
      'No se pudo iniciar la emisión. Comprueba su estado e inténtalo nuevamente.',
    )

    expect(
      screen.getByRole('status'),
    ).toHaveClass('alert-danger')
  })

  it('muestra el programa activo y permite finalizar su emisión', async () => {
    const usuario = userEvent.setup()

    montarControles({
      emision: {
        programaId: programaPrueba.id,
      },
    })

    expect(
      screen.getByText(
        'Programa en vivo · simulación',
      ),
    ).toBeInTheDocument()

    expect(
      screen.queryByRole('button', {
        name: 'Salir al aire',
        exact: true,
      }),
    ).not.toBeInTheDocument()

    const botonFinalizar = screen.getByRole(
      'button',
      {
        name: 'Finalizar emisión',
        exact: true,
      },
    )

    expect(botonFinalizar).toBeEnabled()

    await usuario.click(botonFinalizar)

    expect(
      finalizarEmision,
    ).toHaveBeenCalledTimes(1)

    expect(
      finalizarEmision,
    ).toHaveBeenCalledWith(
      programaPrueba.id,
    )

    expect(
      screen.getByRole('status'),
    ).toHaveTextContent(
      'Emisión simulada finalizada.',
    )

    expect(
      screen.getByRole('status'),
    ).toHaveClass('alert-success')
  })

  it('muestra un error si no se puede finalizar la emisión', async () => {
    const usuario = userEvent.setup()

    finalizarEmision.mockImplementation(() => {
      throw new Error('Error simulado de finalización')
    })

    montarControles({
      emision: {
        programaId: programaPrueba.id,
      },
    })

    await usuario.click(
      screen.getByRole('button', {
        name: 'Finalizar emisión',
        exact: true,
      }),
    )

    expect(
      screen.getByRole('status'),
    ).toHaveTextContent(
      'No se pudo finalizar la emisión. Comprueba su estado e inténtalo nuevamente.',
    )

    expect(
      screen.getByRole('status'),
    ).toHaveClass('alert-danger')
  })

  it('bloquea el inicio cuando otro programa tiene una emisión activa', async () => {
    const usuario = userEvent.setup()

    montarControles({
      emision: {
        programaId: 'otro-programa',
      },
    })

    expect(
      screen.getByText(
        'Ya hay otro programa activo.',
      ),
    ).toBeInTheDocument()

    const boton = screen.getByRole('button', {
      name: 'Salir al aire',
      exact: true,
    })

    expect(boton).toBeDisabled()

    await usuario.click(boton)

    expect(
      iniciarEmision,
    ).not.toHaveBeenCalled()
  })

  it.each([
    {
      caso: 'no hay locutor disponible',
      fallaConsulta: false,
    },
    {
      caso: 'falla la consulta del locutor',
      fallaConsulta: true,
    },
  ])(
    'bloquea el inicio cuando $caso',
    async ({ fallaConsulta }) => {
      const usuario = userEvent.setup()

      if (fallaConsulta) {
        tieneLocutorDisponible.mockImplementation(
          () => {
            throw new Error(
              'Error simulado de consulta',
            )
          },
        )
      } else {
        tieneLocutorDisponible.mockReturnValue(
          false,
        )
      }

      montarControles()

      expect(
        screen.getByText(
          'Se requiere un locutor disponible asignado.',
        ),
      ).toBeInTheDocument()

      const boton = screen.getByRole('button', {
        name: 'Salir al aire',
        exact: true,
      })

      expect(boton).toBeDisabled()

      await usuario.click(boton)

      expect(
        iniciarEmision,
      ).not.toHaveBeenCalled()
    },
  )

  it.each([
    {
      caso: 'iniciar',
      emision: null,
      nombreBoton: 'Salir al aire',
    },
    {
      caso: 'finalizar',
      emision: {
        programaId: 'programa-prueba',
      },
      nombreBoton: 'Finalizar emisión',
    },
  ])(
    'bloquea la acción de $caso si existe un error de emisión',
    async ({ emision, nombreBoton }) => {
      const usuario = userEvent.setup()

      montarControles({
        emision,
        errorEmision: 'Error de emisión de prueba.',
      })

      const boton = screen.getByRole('button', {
        name: nombreBoton,
        exact: true,
      })

      expect(boton).toBeDisabled()

      await usuario.click(boton)

      expect(
        iniciarEmision,
      ).not.toHaveBeenCalled()

      expect(
        finalizarEmision,
      ).not.toHaveBeenCalled()
    },
  )
})