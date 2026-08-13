# Plantilla de seguimiento de testing para Notion

Este documento está pensado para usarlo como base de datos o página maestra en Notion para seguir el estado de testing de todas las funcionalidades de la app.

## 1. Estructura recomendada en Notion

Crear una base de datos con estas propiedades:

- Nombre de funcionalidad
- Área / Módulo
- Prioridad (Alta / Media / Baja)
- Tipo de prueba (Funcional / UI / Integración / Rendimiento / Seguridad / Compatibilidad)
- Estado (Por probar / En prueba / Aprobada / Con errores / Bloqueada)
- Responsable
- Fecha de última prueba
- Versión / Build
- Resultado esperado
- Observaciones
- Error encontrado (Sí / No)
- Severidad del bug
- Evidencia / Link

## 2. Vista recomendada

Crear estas vistas dentro de la base de datos:

1. Todas las funcionalidades
2. Por estado
3. Por prioridad
4. Bugs abiertos
5. Funcionalidades aprobadas

## 3. Plantilla de pruebas por funcionalidad

### 1. Arquitectura de datos y multi-tenant

- Objetivo: validar que el sistema soporta múltiples tenants con branding y datos propios.
- Casos de prueba:
  - Crear un tenant nuevo y verificar que carga su branding.
  - Subir logo propio y confirmar que se muestra en la app y en reportes.
  - Configurar datos del corredor y verificar que se imprimen en el reporte final.
  - Confirmar que un tenant no ve datos de otro tenant.
- Resultado esperado:
  - Cada tenant conserva su identidad visual y sus datos sin mezclarse con otros.

### 2. Formulario de tasación inteligente

- Objetivo: validar que el ingreso de datos de propiedad sea correcto y completo.
- Casos de prueba:
  - Completar formulario con una propiedad residencial estándar.
  - Completar campos de superficies, ambientes, servicios y aptitudes.
  - Confirmar que los campos obligatorios funcionan correctamente.
  - Probar valores límite y datos vacíos.
  - Verificar que los datos se guardan correctamente.
- Resultado esperado:
  - Los datos ingresados se persisten correctamente y el formulario valida la información.

### 3. Integración con PropPick / SrapIA

- Objetivo: validar la extracción de datos desde la extensión y su inserción en el formulario.
- Casos de prueba:
  - Simular un anuncio con datos completos y verificar que el sistema extrae los campos.
  - Validar que se calculan correctamente las superficies cubierta/descubierta.
  - Verificar que se detecta el tipo de propiedad de forma automática.
  - Confirmar que el comparable se agrega al listado con aviso visual.
  - Probar con datos incompletos o incoherentes.
- Resultado esperado:
  - La integración carga comparables correctamente y evita errores de mapeo.

### 4. Base de datos de comparables y homogenización

- Objetivo: validar que la comparación entre propiedades sea técnica y consistente.
- Casos de prueba:
  - Cargar comparables con diferentes superficies.
  - Verificar que la superficie homogenizada se calcula con el factor configurado.
  - Confirmar que el valor homogenizado por m2 se calcula correctamente.
  - Probar con valores de superficie cero o valores inválidos.
- Resultado esperado:
  - Los comparables se analizan de manera homogénea y los cálculos son consistentes.

### 5. Motor de precios, sugerencias y zonas de comercialización

- Objetivo: validar que las sugerencias de precio sean coherentes y útiles.
- Casos de prueba:
  - Cargar varios comparables y verificar el valor mínimo, promedio y máximo.
  - Confirmar las zonas de venta, prueba y no venta.
  - Verificar los márgenes de negociación aplicados al precio de publicación.
  - Probar con comparables muy dispersos y verificar el comportamiento.
- Resultado esperado:
  - El sistema genera rangos y sugerencias realistas y explicables.

### 6. Generador de reportes PDF premium

- Objetivo: validar que el reporte final se genera correctamente y se visualiza bien.
- Casos de prueba:
  - Generar un reporte corto y verificar que se descarga correctamente.
  - Generar un reporte largo y comprobar que el sistema lo divide en chunks.
  - Verificar que el contenido se ve correctamente en desktop y móvil.
  - Confirmar que los mapas, gráficos y páginas del reporte se renderizan sin errores.
  - Probar con datos completos e incompletos.
- Resultado esperado:
  - El PDF se genera sin errores, con buena calidad visual y contenido consistente.

### 7. Versionado de PDFs e historial

- Objetivo: validar que el historial de reportes y versiones funcione correctamente.
- Casos de prueba:
  - Generar varias versiones del mismo reporte.
  - Confirmar que se conserva el historial y se actualiza la metadata.
  - Verificar que el sistema conserva hasta 5 versiones y elimina la más antigua al llegar a la sexta.
  - Comprobar que los archivos se eliminan correctamente de Storage y Firestore.
- Resultado esperado:
  - El historial de versiones es estable, ordenado y sin duplicados innecesarios.

### 8. UX fluida y sistema multi-pestaña

- Objetivo: validar la experiencia del usuario en multitarea y navegación.
- Casos de prueba:
  - Abrir tres tasaciones simultáneas y verificar que no se mezclan los datos.
  - Cerrar y abrir pestañas para confirmar que se guarda el progreso.
  - Probar modo claro y oscuro.
  - Verificar navegación en móvil y en pantallas pequeñas.
- Resultado esperado:
  - La experiencia es estable, consistente y sin pérdida de información.

### 9. Panel de administración y roles

- Objetivo: validar que los permisos y la administración funcionen correctamente.
- Casos de prueba:
  - Crear usuarios con distintos roles.
  - Verificar permisos de administrador y usuario estándar.
  - Confirmar que las anotaciones de ayuda pueden crearse, editarse y eliminarse.
  - Validar que el administrador visualiza las tasaciones globales.
- Resultado esperado:
  - Los roles funcionan de forma segura y las acciones están limitadas según permisos.

## 4. Ejemplo de tabla lista para copiar a Notion

| Funcionalidad | Área | Prioridad | Tipo de prueba | Estado | Responsable | Última prueba | Resultado esperado | Observaciones |
|---|---|---|---|---|---|---|---|---|
| Multi-tenant y branding | Arquitectura | Alta | Funcional | Por probar | | | Cada tenant conserva su branding y datos aislados | |
| Formulario de tasación | Tasación | Alta | Funcional | Por probar | | | Los campos se guardan y validan correctamente | |
| Integración PropPick | Integración | Alta | Integración | Por probar | | | Los datos extraídos se mapean correctamente al formulario | |
| Comparables y homogenización | Cálculo | Alta | Funcional | Por probar | | | Los cálculos de superficie y valor son consistentes | |
| Motor de sugerencias de precio | Cálculo | Alta | Funcional | Por probar | | | Los rangos y zonas se calculan correctamente | |
| Generador de PDF | Reportes | Alta | Funcional | Por probar | | | El PDF se genera con calidad y contenido correcto | |
| Historial y versionado de PDFs | Reportes | Media | Integración | Por probar | | | Se conserva el historial y el límite de versiones | |
| Multi-pestaña y UX | UX | Media | UI | Por probar | | | La app mantiene el estado y evita pérdidas | |
| Administración y roles | Seguridad | Alta | Seguridad | Por probar | | | Los permisos funcionan correctamente | |

## 5. Recomendación de flujo de trabajo

Para cada funcionalidad, usar esta estructura:

- Prueba realizada por:
- Fecha:
- Ambiente:
- Pasos:
- Resultado esperado:
- Resultado real:
- Bug encontrado:
- Severidad:
- Estado del bug:

## 6. Sugerencia para el primer tablero

Si querés empezar simple, primero crea estas 4 vistas:

- Por prioridad
- Por estado
- Bugs abiertos
- Funcionalidades sin probar
