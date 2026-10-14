import {
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'

import Portada from './components/Portada.jsx'
import RutaProtegida from './components/RutaProtegida.jsx'
import AplicacionInterna from './components/AplicacionInterna.jsx'
import Inicio from './components/Inicio.jsx'
import ReproductorRadio from './components/ReproductorRadio.jsx'
import Registro from './components/Registro.jsx'
import Contacto from './components/Contacto.jsx'
import Programas from './components/Programas.jsx'
import DetallePrograma from './components/DetallePrograma.jsx'

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Portada />} />
        <Route path="/registro" element={<Registro />}/>

        <Route element={<RutaProtegida />}>
          <Route path="/app" element={<AplicacionInterna />}>
            <Route
              index
              element={<Navigate to="inicio" replace />}
            />

            <Route
              path="inicio"
              element={<Inicio />}
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