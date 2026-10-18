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
import PanelAdmin from './components/PanelAdmin.jsx'
import PanelProductos from './components/PanelProductos.jsx'
import PanelUsuarios from './components/PanelUsuarios.jsx'
import HistorialPedidos from './components/HistorialPedidos.jsx'
import PanelPedidos from './components/PanelPedidos.jsx'

export default function App() {
  return (
    <>
      <ReproductorRadio />

      <div className="jugoseo-vistas">
        <Routes>
          <Route
            path="/"
            element={<Portada />}
          />

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
                path="pedidos"
                element={<HistorialPedidos />}
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
                  element={<PanelAdmin />}
                >
                  <Route
                    index
                    element={
                      <Navigate
                        to="programas"
                        replace
                      />
                    }
                  />

                  <Route
                    path="programas"
                    element={
                      <PanelProgramas permitirAltasBajas />
                    }
                  />

                  <Route
                    path="productos"
                    element={<PanelProductos />}
                  />

                  <Route
                    path="usuarios"
                    element={<PanelUsuarios />}
                  />

                  <Route
                    path="pedidos"
                    element={<PanelPedidos />}
                  />

                  <Route
                    path="*"
                    element={
                      <Navigate
                        to="/app/admin/programas"
                        replace
                      />
                    }
                  />
                </Route>
              </Route>
            </Route>
          </Route>

          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />
        </Routes>
      </div>
    </>
  )
}