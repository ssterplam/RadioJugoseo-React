# Radio Jugoseo

Proyecto académico de radio online en proceso de migración desde HTML, CSS y JavaScript a **React con Vite**.

Utiliza React-Bootstrap para la interfaz y React Router para la navegación. El reproductor mantiene la transmisión mientras se cambia de sección.

## Estado actual

Implementado:
- Portada y carrusel.
- Inicio con chat externo y tarjetas destacadas.
- Registro con validaciones de campos, RUN, contraseñas y cuentas duplicadas.
- Selección de comunas según la región.
- Login, sesión, cierre de sesión y control de acceso a rutas internas.
- Menú adaptable y opciones visibles según el rol.
- Formulario de contacto con validaciones, contador de caracteres y envío simulado.
- Catálogo de programas, programación semanal y cuatro vistas de detalle.
- Listado de noticias y cuatro vistas de detalle.
- Catálogo de tienda con imágenes, categorías, precios, stock y aviso de últimas unidades.
- Lectura de productos desde localStorage, cuando existe un catálogo guardado.
- Carrito con selección de cantidades y validación de stock.
- Panel lateral con contador de unidades, subtotales y total.
- Modificación de cantidades, eliminación de productos y vaciado del carrito.
- Persistencia del carrito en localStorage y manejo de errores de lectura y guardado.
- Diseño adaptable a dispositivos móviles.

Pendiente:
- Panel administrativo y gestión de datos.
- Reemplazo del rol Vendedor por Locutor y definición de sus permisos.
- Imágenes para el carrusel.
- Rediseño del reproductor para darle mayor protagonismo.
- Ajustes visuales y revisión de contenidos.
- Pruebas unitarias con Vitest y cobertura.

## Alcance

* El proyecto funciona sin backend.
* Las cuentas registradas se guardan en localStorage y la sesión en sessionStorage. El contacto simula el envío y no envía correos reales. No hay pagos reales implementados.
* Utilizar únicamente datos ficticios y contraseñas de prueba. El control de acceso es una simulación frontend, no un sistema de autenticación seguro para producción.
* La radio y el chat dependen de servicios externos.

## Requisitos

- Node.js compatible con la versión de Vite utilizada.
- npm.
- Conexión a Internet para instalar dependencias y utilizar la radio, el chat y las fuentes externas.

## Ejecutar el proyecto

Abrir una terminal en la carpeta que contiene package.json.

Instalar las dependencias:

```bash
npm install
```

Iniciar el servidor de desarrollo:

```bash
npm run dev
```

Abrir la dirección que indique la terminal.

## Compilación de producción

Generar la compilación:

```bash
npm run build
```

Previsualizarla localmente:

```bash
npm run preview
```

## Revisión de código

Ejecutar ESLint:

```bash
npm run lint
```

Las pruebas con Vitest y coverage todavía no están configuradas.

## Cuentas de demostración

| Rol | Correo | Contraseña |
|---|---|---|
| Cliente | cliente@duoc.cl | client123 |
| Vendedor | vendedor@profesor.duoc.cl | vendedor1 |
| Administrador | admin@jugoseo.com | admin123 |

* El rol Vendedor todavía existe en esta versión, pero está previsto reemplazarlo por Locutor. Los paneles de gestión siguen pendientes.
* También es posible crear una cuenta desde “Regístrate aquí”. Las cuentas creadas mediante el formulario reciben el rol Cliente.
* Los datos almacenados localmente pertenecen al navegador y al origen donde se ejecuta el proyecto; no se comparten entre equipos.

## Nota para Windows

Si PowerShell bloquea la ejecución de npm.ps1, utilizar npm.cmd en lugar de npm:

```powershell
npm.cmd install
npm.cmd run dev
```