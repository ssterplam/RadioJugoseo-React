import {
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'

import Portada from './components/Portada.jsx'
import RutaProtegida from './components/RutaProtegida.jsx'
import RutaPorRol from './components/RutaPorRol.jsx'
import AplicacionInterna from './components/AplicacionInterna.jsx'
import Inicio from './components/Inicio.jsx'
import ReproductorRadio from './components/ReproductorRadio.jsx'
import Registro from './components/Registro.jsx'
import Contacto from './components/Contacto.jsx'
import Programas from './components/Programas.jsx'
import DetallePrograma from './components/DetallePrograma.jsx'
import Noticias from './components/Noticias.jsx'
import DetalleNoticia from './components/DetalleNoticia.jsx'
import Tienda from './components/Tienda.jsx'
import PanelProgramas from './components/PanelProgramas.jsx'

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Portada />} />

        <Route
          path="/registro"
          element={<Registro />}
        />

        <Route element={<RutaProtegida />}>
          <Route
            path="/app"
            element={<AplicacionInterna />}
          >
            <Route
              index
              element={<Navigate to="inicio" replace />}
            />

            <Route
              path="inicio"
              element={<Inicio />}
            />

            <Route
              path="tienda"
              element={<Tienda />}
            />

            <Route
              path="contacto"
              element={<Contacto />}
            />

            <Route
              path="programas"
              element={<Programas />}
            />

            <Route
              path="programas/:programaId"
              element={<DetallePrograma />}
            />

            <Route
              path="noticias"
              element={<Noticias />}
            />

            <Route
              path="noticias/:noticiaId"
              element={<DetalleNoticia />}
            />

            <Route
              element={
                <RutaPorRol
                  permitidos={['Locutor', 'Administrador']}
                />
              }
            >
              <Route
                path="locutor"
                element={<PanelProgramas />}
              />
            </Route>

            <Route
              element={
                <RutaPorRol
                  permitidos={['Administrador']}
                />
              }
            >
              <Route
                path="admin"
                element={<PanelProgramas />}
              />
            </Route>
          </Route>
        </Route>

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>

      <ReproductorRadio />
    </>
  )
}