# Radio Jugoseo

Proyecto académico de radio online desarrollado con React, Vite y JavaScript, a partir de una versión previa en HTML, CSS y JavaScript.

La aplicación integra reproducción de radio, programas, noticias, registro de usuarios, una tienda con carrito y pedidos, y paneles de administración con restricciones según el rol.

Funciona exclusivamente como frontend: utiliza almacenamiento del navegador, no tiene backend propio y no procesa pagos reales.

## Tecnologías

### Aplicación

- React.
- Vite.
- JavaScript.
- React Router.
- Bootstrap.
- React-Bootstrap.
- CSS.
- localStorage y sessionStorage.
- Web Locks API para coordinar las escrituras de comercio.

### Testing y calidad de código

- Vitest.
- React Testing Library.
- Testing Library User Event.
- Testing Library Jest DOM.
- jsdom.
- Proveedor de cobertura V8.
- ESLint.

## Funcionalidades

### Portada y navegación

- Portada con identidad visual de Radio Jugoseo.
- Carrusel con imágenes, indicadores y controles de navegación.
- Pausa y reanudación del cambio automático del carrusel.
- Navegación entre secciones mediante React Router.
- Menú adaptable con opciones según el rol.
- Rutas internas protegidas por sesión.
- Restricciones de acceso para Cliente, Locutor y Administrador.

### Radio y programas

- Reproductor fijo en la parte superior.
- Controles de reproducción, pausa y volumen.
- Mensajes ante estados de espera, desconexión y errores de audio.
- Reproductor integrado fuera del contenido de las rutas para mantenerlo al cambiar de sección.
- Catálogo de programas, programación semanal y vistas de detalle.
- Creación y eliminación de programas desde Administración.
- Edición de programas y asignación de locutores.
- Edición limitada de contenido de programas propios desde el panel de Locutor.
- Inicio y finalización de emisiones simuladas.
- Restricción de emisiones simultáneas.
- Bloqueo de reasignación y eliminación de un programa mientras está en emisión.

El estado de emisión es una simulación local. Iniciar un programa no modifica el contenido real del servicio externo de streaming.

### Registro y sesiones

- Registro público de cuentas con rol Cliente.
- Validación de campos obligatorios.
- Validación de RUN y dígito verificador.
- Validación de correo, contraseña y confirmación.
- Comprobación de correos y RUN duplicados.
- Selección de comunas según la región.
- Inicio y cierre de sesión.
- Reglas de correo y rol centralizadas.
- Identificación y versión de cuenta para detectar sesiones obsoletas.

### Gestión de usuarios

- Listado de cuentas locales y de demostración.
- Creación de cuentas internas con rol Locutor o Administrador.
- Edición de nombre, apellido, contraseña y campos habilitados según la cuenta.
- Cambios entre roles internos compatibles.
- Eliminación de cuentas locales.
- Protección de cuentas de demostración y de la cuenta administradora en uso.
- Restricciones ante programas asignados o emisiones vinculadas.
- Actualización de la versión de cuenta al editar un usuario local.

El panel administrativo no crea Clientes: estas cuentas se generan mediante el registro público.

El correo se mantiene en solo lectura. La edición administrativa de RUN, domicilio y región/comuna no está incluida.

### Contacto y noticias

- Formulario de contacto con validaciones.
- Contador de caracteres y mensajes de error.
- Confirmación de envío simulado.
- Listado de noticias.
- Vistas de detalle y navegación de regreso al listado.

El formulario de contacto no envía correos reales.

### Productos y tienda

- Catálogo con imágenes, categorías, precios y stock.
- Avisos de productos agotados y últimas unidades.
- Creación, edición y eliminación de productos desde Administración.
- Validación de datos y códigos duplicados.
- Detección de ediciones desactualizadas para evitar sobrescribir cambios recientes.
- Restricción de eliminación de productos presentes en el carrito guardado.

### Carrito

- Selección y modificación de cantidades.
- Eliminación individual de artículos.
- Vaciado del carrito.
- Contador de unidades, subtotales y total.
- Persistencia local.
- Reconciliación con el catálogo vigente.
- Avisos ante cambios de nombre, precio, disponibilidad o stock.
- Conservación de cantidades para que el usuario resuelva los conflictos.
- Reinicio confirmado de un carrito con datos inválidos, conservando productos y pedidos cuando la estructura permite recuperarlos.

Agregar artículos al carrito no reserva ni descuenta stock.

### Pedidos

- Preparación de un resumen antes de confirmar.
- Revisión de artículos, cantidades, precios y cuenta al confirmar.
- Descuento de stock al guardar correctamente el pedido.
- Vaciado del carrito y creación del pedido en una misma escritura de comercio.
- Historial de pedidos propios.
- Consulta de artículos, cantidades, importes, fechas y estado.
- Panel administrativo con todos los pedidos.
- Avance de estado restringido al administrador.
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

## Roles

| Rol | Funciones principales |
|---|---|
| Cliente | Acceder a las secciones internas, utilizar la tienda, consultar sus pedidos y cancelar los permitidos. |
| Locutor | Acceder a las funciones generales y gestionar el contenido y la emisión de sus programas asignados. |
| Administrador | Gestionar programas, productos, usuarios y pedidos, además de controlar las emisiones simuladas. |

## Cuentas de demostración

| Rol | Correo | Contraseña |
|---|---|---|
| Cliente | cliente@duocuc.cl | client123 |
| Locutor | locutor@jugoseo.com | locutor123 |
| Administrador | admin@jugoseo.com | admin123 |

- La cuenta Cliente corresponde al tipo Socio VIP.
- Las cuentas de demostración están protegidas frente a edición y eliminación desde el panel.
- Es posible registrar Clientes o crear cuentas internas desde Administración.
- Utilizar únicamente datos ficticios y contraseñas de prueba.

Estas credenciales forman parte de una demostración académica y no deben reutilizarse en otros servicios.

## Estructura del proyecto

```text
public/          Recursos estáticos.

src/
  components/    Vistas, paneles, modales, reproductor y rutas protegidas.
  data/          Catálogos, datos iniciales, roles, cuentas demo y sesión.
  hooks/         Hook useEmision.
  tests/         Pruebas automatizadas y preparación del entorno.
  utils/         Validaciones, persistencia y lógica del frontend.
  App.jsx        Organización de rutas y componentes principales.
  main.jsx       Punto de entrada de React.
  styles.css     Estilos de la aplicación.

vite.config.js   Configuración de Vite, Vitest y cobertura.
package.json     Dependencias y scripts del proyecto.
```

## Persistencia y coordinación

Productos, carrito, pedidos y secuencia de pedidos se guardan conjuntamente en la clave `jugoseoComercio` de localStorage.

Las operaciones de comercio preparan y validan sus cambios antes de guardar el estado. Las escrituras utilizan un bloqueo común mediante Web Locks API.

Consideraciones:

- Usuarios, programas y emisión también utilizan persistencia local.
- La sesión se guarda en sessionStorage.
- El carrito es compartido entre las cuentas que utilizan el mismo navegador, perfil y origen; no es independiente por usuario.
- Los datos no se comparten entre equipos ni perfiles del navegador.
- La lectura contempla las claves anteriores de comercio cuando todavía no existe el almacenamiento unificado.
- Las claves antiguas dejan de ser la fuente activa después del primer guardado unificado.
- Los datos dañados no se reemplazan automáticamente de forma silenciosa.
- La recuperación específica del carrito solo se realiza cuando puede conservarse el resto de la estructura de comercio.

Después de actualizar la aplicación, se deben recargar las pestañas abiertas. Las versiones antiguas que no utilicen el bloqueo común no quedan coordinadas con la versión actual.

## Requisitos

- Node.js compatible con las versiones de Vite y sus complementos incluidas en el proyecto.
- npm.
- Navegador compatible con Web Locks API para las escrituras de comercio.
- Ejecución desde localhost durante el desarrollo o HTTPS al publicar.
- Conexión a Internet para instalar dependencias y utilizar los servicios externos de radio y chat.

Si Web Locks API no está disponible, las escrituras de comercio se rechazan en lugar de continuar sin coordinación.

## Instalación y ejecución

Clonar el repositorio:

```bash
git clone [https://github.com/ssterplam/RadioJugoseo-React.git](https://github.com/ssterplam/RadioJugoseo-React.git)
cd RadioJugoseo-React
```

Instalar las dependencias utilizando el archivo de bloqueo publicado:

```bash
npm ci
```

Iniciar el servidor de desarrollo:

```bash
npm run dev
```

Abrir la dirección indicada por Vite en la terminal.

Para comprobar el comportamiento entre pestañas, utilizar exactamente el mismo protocolo, host y puerto.

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Inicia el servidor de desarrollo. |
| `npm run build` | Genera la compilación de producción. |
| `npm run preview` | Previsualiza localmente la compilación de producción. |
| `npm run lint` | Ejecuta ESLint. |
| `npm run test` | Ejecuta la suite de pruebas una vez. |
| `npm run test:watch` | Ejecuta Vitest en modo de observación. |
| `npm run test:coverage` | Ejecuta la suite y genera la cobertura. |

## Pruebas automatizadas

La suite utiliza Vitest y React Testing Library con jsdom como entorno de navegador simulado.

Incluye:

- Pruebas de renderizado, propiedades, estado y eventos.
- Validación de formularios y mensajes de error.
- Navegación, redirecciones y restricciones por rol.
- Lectura, escritura y validación del almacenamiento local.
- Gestión de usuarios, productos, carrito, pedidos y programas.
- Confirmación y cancelación de pedidos con actualización de stock.
- Control del estado de emisión.
- Actualización y limpieza de listeners del hook useEmision.
- Fallos de almacenamiento y operaciones rechazadas.

### Ejecutar toda la suite

```bash
npm run test
```

### Ejecutar un archivo específico

```bash
npm run test -- src/tests/pedidosStorage.test.js
```

### Generar cobertura de toda la suite

```bash
npm run test:coverage
```

También se puede utilizar:

```bash
npm run test -- --coverage
```

### Reportes generados

La configuración genera reportes de texto, HTML y resumen JSON dentro de `coverage/`.

Para consultar el detalle visual, abrir:

```text
coverage/index.html
```

El reporte incluye los archivos JavaScript y JSX de `src`, excluyendo los archivos de pruebas y `src/main.jsx`.

Una ejecución filtrada a un archivo de pruebas no representa la cobertura global de la suite. Para obtener los resultados generales, ejecutar el comando de cobertura sin indicar una ruta de test.

## Resultados de testing

Última ejecución completa registrada el 19 de octubre de 2026:

```text
Test Files  41 passed (41)
     Tests  484 passed (484)
```

| Métrica | Cobertura global |
|---|---:|
| Statements | 95,75 % |
| Branches | 91,34 % |
| Functions | 99,04 % |
| Lines | 95,68 % |

Todos los archivos incluidos en ese reporte superaron el 60 % en las cuatro métricas.

Estos resultados corresponden a la ejecución local documentada para la entrega. Deben actualizarse si cambia el código o la suite.

### Interpretación y límites

La cobertura indica qué código fue ejecutado durante las pruebas; no garantiza la ausencia de errores ni la evaluación de todas las combinaciones posibles.

Las pruebas utilizan funciones reales y simulaciones controladas cuando corresponde:

- La API de bloqueos se simula en las pruebas de comercio.
- Los eventos de almacenamiento se disparan de forma controlada.
- Se simulan fallos y dependencias específicas para evaluar escenarios concretos.
- La coordinación real entre pestañas no queda certificada por estas simulaciones.
- Las pruebas del reproductor no garantizan la disponibilidad del streaming externo.

No se implementaron pruebas End to End en un navegador real para esta entrega.

## Oportunidades de mejora

- Ampliar las ramas pendientes de HistorialPedidos.
- Completar funciones y condiciones no cubiertas de validacionesRegistro.
- Revisar funciones pendientes de ProductoCard.
- Añadir casos para las condiciones de validación y protección que permanecen sin cobertura.
- Comprobar la coordinación real entre pestañas en un navegador compatible.
- Complementar las pruebas con verificaciones del streaming y del chat en condiciones reales.

Los pendientes representan oportunidades de ampliación; no pruebas fallidas de la ejecución registrada.

## Alcance y limitaciones

- Proyecto académico exclusivamente frontend.
- Sin backend propio ni base de datos de servidor.
- Sin integración con Webpay.
- Sin cobros, pagos ni reembolsos reales.
- El formulario de contacto simula el envío.
- El control de emisión no modifica la transmisión real de la radio.
- La radio y el chat dependen de servicios externos.
- Los datos y credenciales se gestionan localmente como parte de una simulación académica.
- El control de acceso del cliente no constituye una solución de seguridad para producción.
- Web Locks API coordina las operaciones de la aplicación, pero no impide modificaciones manuales del almacenamiento.
- No se realizaron auditorías integrales de seguridad, pruebas de carga ni evaluaciones de infraestructura.

## Documentación de la entrega

El informe de cobertura de testing complementa este repositorio con:

- Objetivo y alcance.
- Arquitectura y herramientas.
- Casos de componentes, formularios, servicios y navegación.
- Cobertura global y por archivo.
- Criterios de aceptación.
- Casos pendientes.
- Evidencias de ejecución.
- Resultados generales y conclusión.

Los porcentajes y estados de aprobación deben respaldarse con las evidencias de la ejecución completa correspondiente.

## Nota para Windows y PowerShell

Si PowerShell bloquea la ejecución de `npm.ps1`, utilizar `npm.cmd` en lugar de `npm`:

```powershell
npm.cmd ci
npm.cmd run dev
npm.cmd run test
npm.cmd run test:coverage
npm.cmd run build
npm.cmd run lint
```

No es necesario cambiar la política de ejecución de PowerShell para utilizar esta alternativa.