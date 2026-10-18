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
- Catálogo de programas, programación semanal y vistas de detalle.
- Listado de noticias y vistas de detalle.
- Catálogo de tienda con imágenes, categorías, precios, stock y aviso de últimas unidades.
- Carrito con selección de cantidades, validación de stock, subtotales y total.
- Modificación de cantidades, eliminación de productos y vaciado del carrito.
- Persistencia del carrito y de los catálogos gestionados en localStorage.
- Panel de administrador para programas, productos y usuarios.
- Gestión de programas: creación, edición, eliminación y asignación de locutores.
- Emisión simulada de programas, con control de emisiones activas y reasignaciones.
- Gestión de productos: creación, edición y eliminación.
- Gestión de usuarios: listado, creación de personal, edición y eliminación de cuentas locales.
- Protección de cuentas de demostración y de la cuenta administradora en uso.
- Invalidación de sesiones anteriores al editar o eliminar una cuenta local.
- Diseño adaptable a dispositivos móviles.

Pendiente:
- Gestión de pedidos: confirmación desde el carrito, historial de pedidos y panel administrador.
- Pruebas de regresión finales del flujo completo.
- Reemplazo de imágenes provisionales del carrusel.
- Rediseño del reproductor para darle mayor protagonismo.
- Ajustes visuales y revisión de contenidos.
- Pruebas unitarias con Vitest y cobertura.

## Alcance

* El proyecto funciona sin backend.
* Las cuentas, programas, productos y carrito se guardan en localStorage; la sesión se guarda en sessionStorage.
* El contacto simula el envío y no envía correos reales.
* No hay pagos reales implementados.
* Utilizar únicamente datos ficticios y contraseñas de prueba.
* El control de acceso es una simulación frontend, no un sistema de autenticación seguro para producción.
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
| Cliente | cliente@duocuc.cl | client123 |
| Locutor | locutor@jugoseo.com | locutor123 |
| Administrador | admin@jugoseo.com | admin123 |

* La cuenta Cliente corresponde a un Socio VIP.
* La cuenta Locutor permite acceder al panel de locutor y gestionar los programas asignados.
* La cuenta Administrador permite acceder al panel de administración de programas, productos y usuarios.
* También es posible crear una cuenta desde “Regístrate aquí”. Las cuentas creadas mediante el formulario reciben el rol Cliente.
* Los datos almacenados localmente pertenecen al navegador y al origen donde se ejecuta el proyecto; no se comparten entre equipos.

## Nota para Windows

Si PowerShell bloquea la ejecución de npm.ps1, utilizar npm.cmd en lugar de npm:

```powershell
npm.cmd install
npm.cmd run dev
```