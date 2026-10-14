# Radio Jugoseo

Proyecto académico de radio online en proceso de migración desde HTML, CSS y JavaScript a **React con Vite**.

Utiliza React-Bootstrap para la interfaz y React Router para la navegación. El reproductor mantiene la transmisión mientras se cambia de sección.

## Estado actual

Implementado:
- Portada y carrusel.
- Inicio con chat externo y tarjetas destacadas.
- Registro y login con validaciones.
- Sesión y acceso a páginas internas según rol.
- Formulario de contacto con envío simulado.
- Catálogo de programas, programación semanal y páginas de detalle.
- Diseño adaptable a dispositivos móviles.

Pendiente:
- Noticias, tienda, carrito y panel administrativo.
- Pruebas unitarias con Vitest y cobertura.
- Mejoras visuales y reemplazo del rol Vendedor por Locutor.

El proyecto funciona sin backend. Las cuentas se guardan en localStorage y la sesión en sessionStorage. Utilizar únicamente datos y contraseñas de prueba.

## Requisitos

- Node.js compatible con la versión de Vite utilizada.
- npm.
- Conexión a Internet para la transmisión de radio y el chat externo.

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

## Cuentas de demostración

| Rol | Correo | Contraseña |
|---|---|---|
| Cliente | cliente@duoc.cl | client123 |
| Vendedor | vendedor@profesor.duoc.cl | vendedor1 |
| Administrador | admin@jugoseo.com | admin123 |

Los paneles de Vendedor y Administrador todavía están pendientes de migración.

También es posible crear una cuenta desde “Regístrate aquí”.

## Nota para Windows

Si PowerShell bloquea la ejecución de npm.ps1, utilizar npm.cmd en lugar de npm:

```powershell
npm.cmd install
npm.cmd run dev
```