# Radio Jugoseo

Proyecto académico de radio online desarrollado con React, Vite y JavaScript, a partir de una versión previa en HTML, CSS y JavaScript.

Utiliza Bootstrap y React-Bootstrap para la interfaz, React Router para la navegación y almacenamiento del navegador para la persistencia local.

La aplicación funciona exclusivamente como frontend: no tiene backend propio ni procesa pagos reales.

## Tecnologías

- React.
- Vite.
- JavaScript.
- React Router.
- Bootstrap.
- React-Bootstrap.
- ESLint.
- localStorage y sessionStorage.
- Web Locks API para coordinar las escrituras de comercio entre pestañas.

Vitest, React Testing Library y la generación de cobertura están pendientes de configuración.

## Funcionalidades implementadas

### Portada y navegación

- Portada con identidad visual de Radio Jugoseo.
- Carrusel con imágenes del proyecto, indicadores y controles de navegación.
- Pausa y reanudación del cambio automático del carrusel.
- Navegación entre secciones mediante React Router.
- Menú adaptable con opciones según el rol.
- Rutas internas protegidas por sesión y restricciones por rol.

### Radio y programas

- Reproductor destacado y fijo en la parte superior.
- Controles de reproducción, pausa y volumen.
- Mensajes de conexión, reproducción y errores del servicio de streaming.
- Continuidad del audio al cambiar de sección.
- Ajuste del espacio superior según la altura del reproductor.
- Catálogo de programas, programación semanal y vistas de detalle.
- Creación y eliminación de programas por Administrador.
- Edición y asignación de locutores desde Administración.
- Edición limitada de los programas propios desde el panel de Locutor.
- Inicio y finalización de emisiones simuladas.
- Restricción de emisiones simultáneas y de reasignaciones durante una emisión activa.

La emisión de programas es una simulación local: iniciar un programa no cambia el contenido real del streaming externo.

### Registro y sesiones

- Registro público de cuentas con rol Cliente.
- Validación de campos, RUN y dígito verificador.
- Validación de correo, contraseña y confirmación.
- Comprobación de cuentas duplicadas.
- Selección de comunas según la región.
- Inicio y cierre de sesión.
- Reglas de correo y rol centralizadas.
- Identificación y versión de cuenta para detectar sesiones obsoletas.

### Gestión de usuarios

- Listado de cuentas locales y de demostración.
- Creación de personal con rol Locutor o Administrador.
- Edición de nombre, apellido, contraseña y campos habilitados según la cuenta.
- Cambios entre roles internos compatibles con el correo.
- Eliminación de cuentas locales.
- Protección de cuentas de demostración y de la cuenta administradora en uso.
- Bloqueos ante asignaciones de programas o emisiones vinculadas, según la operación.
- Invalidación de sesiones anteriores al modificar una cuenta local.

El panel no crea Clientes: estas cuentas se generan mediante el registro público.

El correo se mantiene en solo lectura. La edición de datos como RUN, domicilio y región/comuna no forma parte del editor administrativo actual.

### Contacto y noticias

- Formulario de contacto con validaciones.
- Contador de caracteres y mensajes de error.
- Confirmación de envío simulado, sin envío real de correos.
- Listado de noticias y vistas de detalle.

### Productos y tienda

- Catálogo con imágenes, categorías, precios y stock.
- Avisos de productos agotados y de últimas unidades.
- Creación, edición y eliminación de productos desde Administración.
- Validación de datos e identificadores.
- Detección de ediciones desactualizadas para evitar sobrescribir cambios recientes, incluido el stock.
- Restricción de eliminación de productos presentes en el carrito guardado.

### Carrito

- Selección y modificación de cantidades.
- Eliminación de artículos y vaciado del carrito.
- Contador de unidades, subtotales y total.
- Persistencia local.
- Reconciliación con el catálogo vigente.
- Avisos ante cambios de nombre, precio, disponibilidad o stock.
- Conservación de cantidades para que el usuario resuelva los conflictos.
- Recuperación de un carrito con datos inválidos mediante confirmación, sin borrar productos ni pedidos.

Agregar artículos al carrito no reserva ni descuenta stock.

### Pedidos

- Resumen fijo antes de confirmar la compra.
- Comprobación de artículos, cantidades, precios y cuenta antes de guardar.
- Descuento de stock al confirmar correctamente.
- Vaciado del carrito y creación del pedido en una misma escritura de comercio.
- Historial con los pedidos propios de la cuenta conectada.
- Consulta de artículos, cantidades, importes, fechas y estado.
- Panel administrativo con todos los pedidos.
- Cancelación de pedidos permitidos y devolución del stock de los productos que siguen en el catálogo.
- Conservación del pedido cancelado como registro histórico.

Los estados avanzan en este orden:

```text
Pendiente → En preparación → Enviado → Entregado
```

La cancelación está permitida desde:

- Pendiente.
- En preparación.
- Enviado.

Los pedidos Entregados y Cancelados quedan cerrados. No se permiten saltos ni retrocesos de estado.

## Persistencia y coordinación

Productos, carrito, pedidos y secuencia de pedidos se guardan conjuntamente en la clave `jugoseoComercio` de localStorage.

Las confirmaciones y cancelaciones preparan y validan los cambios antes de realizar una única escritura del conjunto.

Las operaciones de escritura de comercio utilizan un bloqueo común mediante Web Locks API. Esto coordina pedidos, productos y carrito entre pestañas que ejecutan la versión actual de la aplicación.

- Las cuentas, programas y el estado de emisión también utilizan persistencia local.
- La sesión se guarda en sessionStorage.
- El carrito es compartido entre las cuentas que utilizan el mismo navegador, perfil y origen; no es un carrito independiente por usuario.
- Los datos no se comparten entre equipos ni entre perfiles del navegador.
- La lectura contempla las claves anteriores de comercio cuando todavía no existe el almacenamiento unificado.
- Las claves antiguas se conservan, pero dejan de ser la fuente activa después del primer guardado unificado.

Después de actualizar la aplicación, recargar todas las pestañas abiertas. Una versión antigua que escriba sin utilizar el bloqueo común no queda coordinada.

Si el JSON completo o la estructura general de comercio están dañados, la aplicación no los reemplaza automáticamente. La recuperación específica solo permite reiniciar el carrito cuando puede conservar el resto de la estructura.

## Roles

| Rol | Funciones principales |
|---|---|
| Cliente | Acceder a las secciones internas, comprar, consultar sus pedidos y cancelar los permitidos. |
| Locutor | Funciones generales de la aplicación y gestión autorizada de sus programas asignados. |
| Administrador | Gestión de programas, productos, usuarios y pedidos, además del control de emisiones simuladas. |

Las cuentas autenticadas pueden consultar su propio historial. El panel administrativo de pedidos es independiente y muestra todos los pedidos.

## Cuentas de demostración

| Rol | Correo | Contraseña |
|---|---|---|
| Cliente | cliente@duocuc.cl | client123 |
| Locutor | locutor@jugoseo.com | locutor123 |
| Administrador | admin@jugoseo.com | admin123 |

- La cuenta Cliente corresponde al tipo Socio VIP.
- Las cuentas de demostración están protegidas frente a edición y eliminación desde el panel.
- También se pueden registrar Clientes o crear cuentas internas desde Administración.
- Utilizar únicamente datos ficticios y contraseñas de prueba.

## Alcance y limitaciones

- Proyecto académico exclusivamente frontend.
- Sin backend propio, base de datos de servidor ni integración con Webpay.
- Sin cobros, pagos ni reembolsos reales.
- El contacto simula el envío.
- La transmisión de radio y el chat dependen de servicios externos.
- El control de acceso y el almacenamiento de credenciales son una simulación académica, no una solución segura para producción.
- Web Locks coordina las operaciones de la aplicación, pero no impide modificaciones manuales del almacenamiento.
- Las pruebas manuales realizadas no sustituyen las pruebas automatizadas de fallos y concurrencia pendientes.

## Requisitos

- Node.js compatible con las versiones instaladas de Vite y sus complementos.
- npm.
- Navegador compatible con Web Locks API.
- Ejecutar desde localhost durante el desarrollo o desde HTTPS al publicar.
- Conexión a Internet para instalar dependencias y utilizar la radio y el chat.

Si Web Locks no está disponible, las escrituras de comercio se rechazan en lugar de continuar sin coordinación.

## Instalación y ejecución

Abrir una terminal en la carpeta que contiene `package.json`.

Instalar las dependencias:

```bash
npm install
```

Iniciar el servidor de desarrollo:

```bash
npm run dev
```

Abrir la dirección indicada por Vite.

Para comprobar el comportamiento entre pestañas, utilizar exactamente el mismo protocolo, host y puerto en ambas.

## Compilación y revisión

Generar la compilación de producción:

```bash
npm run build
```

Previsualizarla localmente:

```bash
npm run preview
```

Ejecutar ESLint:

```bash
npm run lint
```

## Estado del testing

Vitest, React Testing Library y coverage todavía no están configurados. Actualmente no existe un script `test` en `package.json`.

Se han realizado comprobaciones manuales durante el desarrollo. La suite automatizada y sus resultados se incorporarán en el siguiente bloque.

El trabajo pendiente contempla:

- Pruebas unitarias de validaciones y lógica.
- Pruebas de renderizado, props, estado y eventos de componentes.
- Pruebas de formularios y navegación.
- Mocks de dependencias y APIs del navegador cuando corresponda.
- Casos relevantes de pedidos, stock, fallos de escritura y recuperación del carrito.
- Reporte de cobertura que incluya todos los componentes.
- Al menos una prueba relevante para cada componente.
- Objetivo de cobertura por archivo de al menos 60%, con explicación de los archivos que queden por debajo.
- Evidencias reales y análisis de resultados en el documento de testing.

No se incorporarán pruebas End to End automatizadas a esta entrega.

## Pendientes para cerrar la entrega

- Configurar Vitest, React Testing Library y el proveedor de cobertura.
- Implementar y ejecutar las pruebas.
- Analizar los resultados y corregir fallos reproducibles.
- Generar las métricas de cobertura globales y por archivo.
- Completar el documento de testing con alcance, arquitectura, casos, evidencias, resultados y conclusión.
- Realizar una revisión final de navegación y responsividad.
- Actualizar este README con los comandos y resultados de testing cuando estén disponibles.

El carrusel con imágenes y el reproductor destacado en la parte superior ya están implementados.

La entrega contempla el enlace del repositorio de GitHub y el documento de pruebas y testing, según las instrucciones del docente.

## Nota para Windows

Si PowerShell bloquea la ejecución de `npm.ps1`, utilizar `npm.cmd` en lugar de `npm`:

```powershell
npm.cmd install
npm.cmd run dev
npm.cmd run lint
npm.cmd run build
```