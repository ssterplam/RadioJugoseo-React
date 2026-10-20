import {
  render,
  screen,
  waitFor,
} from '@testing-library/react'

import userEvent from '@testing-library/user-event'

import {
  describe,
  expect,
  it,
} from 'vitest'

import CarruselInicio from '../components/CarruselInicio.jsx'

function obtenerDiapositivaActiva(contenedor) {
  return contenedor.querySelector('.carousel-item.active')
}

describe('CarruselInicio', () => {
  it('renderiza las cuatro diapositivas con sus títulos e imágenes', () => {
    render(<CarruselInicio />)

    const titulos = [
      'Dale play a Jugoseo',
      'Lleva Jugoseo contigo',
      'Encuentra tu programa',
      'Sé parte de la radio',
    ]

    for (const titulo of titulos) {
      expect(
        screen.getByText(titulo),
      ).toBeInTheDocument()
    }

    const imagenes = [
      'Imagen del programa Dando Jugo',
      'Polera de Radio Jugoseo',
      'Imagen del programa Tocando Bits',
      'Imagen del programa Carrete Radial',
    ]

    for (const descripcion of imagenes) {
      expect(
        screen.getByAltText(descripcion),
      ).toBeInTheDocument()
    }
  })

  it('inicia con la primera diapositiva activa', () => {
    const { container } = render(<CarruselInicio />)

    expect(
      obtenerDiapositivaActiva(container),
    ).toHaveTextContent('Dale play a Jugoseo')
  })

  it('avanza a la segunda diapositiva al pulsar Siguiente', async () => {
    const usuario = userEvent.setup()

    const { container } = render(<CarruselInicio />)

    await usuario.click(
      screen.getByRole('button', {
        name: 'Siguiente',
        exact: true,
      }),
    )

    await waitFor(() => {
      expect(
        obtenerDiapositivaActiva(container),
      ).toHaveTextContent('Lleva Jugoseo contigo')
    })
  })

  it('retrocede de la primera a la última diapositiva al pulsar Anterior', async () => {
    const usuario = userEvent.setup()

    const { container } = render(<CarruselInicio />)

    await usuario.click(
      screen.getByRole('button', {
        name: 'Anterior',
        exact: true,
      }),
    )

    await waitFor(() => {
      expect(
        obtenerDiapositivaActiva(container),
      ).toHaveTextContent('Sé parte de la radio')
    })
  })

  it('permite seleccionar una diapositiva mediante su indicador', async () => {
    const usuario = userEvent.setup()

    const { container } = render(<CarruselInicio />)

    await usuario.click(
      screen.getByRole('button', {
        name: 'Encuentra tu programa',
        exact: true,
      }),
    )

    await waitFor(() => {
      expect(
        obtenerDiapositivaActiva(container),
      ).toHaveTextContent('Encuentra tu programa')
    })
  })

  it('cambia el botón y su estado al pausar y reanudar', async () => {
    const usuario = userEvent.setup()

    render(<CarruselInicio />)

    const botonPausar = screen.getByRole('button', {
      name: 'Pausar carrusel',
      exact: true,
    })

    expect(botonPausar).toHaveAttribute(
      'aria-pressed',
      'false',
    )

    await usuario.click(botonPausar)

    const botonReanudar = screen.getByRole('button', {
      name: 'Reanudar carrusel',
      exact: true,
    })

    expect(botonReanudar).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    await usuario.click(botonReanudar)

    expect(
      screen.getByRole('button', {
        name: 'Pausar carrusel',
        exact: true,
      }),
    ).toHaveAttribute('aria-pressed', 'false')
  })
})