
## 1. Arquitectura de Datos y Multi-Tenant (Marca Personalizada)
La aplicación no está acoplada a un único usuario o empresa, sino que implementa un patrón multi-tenant limpio mediante `TenantContext` y `TenantProvider`.
*   **Branding Personalizado:** Cada tenant (inmobiliaria/empresa) puede configurar su nombre comercial, razón social, cargar su propio logotipo (almacenado en Firebase Storage) y definir un color primario para la identidad visual de la app y los reportes.
*   **Ficha Profesional del Corredor:** Permite configurar y guardar la información institucional del tasador responsable:
    *   Nombre del titular y título profesional.
    *   Matrícula y organismo de registro (Colegio de Martilleros).
    *   Datos de contacto (Dirección, Ciudad, Teléfono, Email, Sitio Web).
    *   Estos datos se inyectan directamente en la última página del reporte de tasación para dar cierre oficial.

---

## 2. Formulario de Tasación Inteligente
El componente [`ValuationForm.tsx`](file:///c:/Users/Gabriel/Desktop/01_Proyectos_Activos/Inmo-Tasador/src/components/ValuationForm.tsx) es el núcleo del ingreso de datos. Captura información hiper-detallada de la propiedad objetivo:
*   **Geolocalización Asistida:** Integración con la API de Google Places (`AddressAutocomplete`) para autocompletar direcciones físicas y obtener coordenadas geográficas (`lat`, `lng`) exactas.
*   **Características del Inmueble:** Campos estructurados para capturar:
    *   *Detalles de mercado:* Estado de captación (Activa, Reservada, Vendido, etc.), precio de publicación, precio de cierre real, días en mercado.
    *   *Dimensiones:* Superficie cubierta, semicubierta y descubierta.
    *   *Distribución:* Ambientes, dormitorios, baños, cocheras, bauleras, patios, terrazas.
    *   *Servicios y Equipamiento:* Agua, gas, electricidad, cloacas, calefacción, aire acondicionado, seguridad, ascensores.
    *   *Aptitudes y Orientación:* Apto crédito, apto profesional, financiación, disposición (Frente/Contrafrente/Interno) y orientación.

---

## 3. Integración Inteligente con la Extensión "PropPick" (SrapIA)
Esta es una de las funcionalidades más potentes y avanzadas de tu sistema. En lugar de copiar y pegar a mano los comparables de mercado, creaste una extensión de Chrome (`SrapIA` / `PropPick`):
*   **Extracción con Gemini Vision:** Captura la pantalla del portal inmobiliario (optimizado para ZonaProp) y usa la IA de Google para extraer precios, expensas, superficies, dormitorios y equipamiento.
*   **Sincronización en Tiempo Real:** La extensión envía los datos extraídos al formulario activo mediante eventos `window.postMessage` (`ZONAPROP_DATA`).
*   **Mapeo Automatizado:** El formulario detecta el mensaje, procesa las superficies (resta la cubierta de la total para calcular la descubierta), deduce el tipo de propiedad y añade el registro instantáneamente como un comparable con un aviso visual en pantalla.

---

## 4. Base de Datos de Comparables y Homogenización
Para determinar el precio de un inmueble, el tasador añade y gestiona múltiples propiedades comparables del mercado:
*   **Algoritmo de Homogenización de Superficies:** Calcula la superficie equivalente del comparable ponderando los espacios abiertos mediante un factor ajustable por el usuario (por defecto $0.5$):
    $$\text{Superficie Homogenizada} = \text{Superficie Cubierta} + (\text{Superficie Descubierta} \times \text{Factor Homogenización})$$
*   **Valor Homogenizado por $m^2$:** Divide el precio publicado o de venta sobre la superficie homogenizada, permitiendo comparar manzanas con manzanas de manera científica.

---

## 5. Motor de Precios, Sugerencias y Zonas de Comercialización
La app analiza matemáticamente los comparables cargados y genera una sugerencia de valor plasmada en gráficos y reportes:
*   **Rangos de Sugerencia:** Calcula el valor mínimo (Low), el valor promedio de mercado (Market) y el valor máximo (High) en base a los promedios ponderados de los comparables.
*   **Zonas de Comercialización:** Divide el análisis en tres zonas de precios en función de los desvíos estándar y el valor homogenizado:
    1.  *Zona de Venta:* Rango óptimo y competitivo para una venta rápida.
    2.  *Zona de Prueba:* Rango límite donde el precio podría generar resistencia pero vale la pena testear si hay baja oferta.
    3.  *Zona de No Venta:* Precios fuera del mercado donde la propiedad perderá tracción.
*   **Márgenes de Negociación:** Aplica deducciones automáticas al precio de publicación para estimar el precio de cierre real.

---

## 6. Generador de Reportes PDF con Rendimiento Premium
Generar PDFs en clientes web suele ser un dolor de cabeza por la memoria del navegador. Tu hook personalizado [`usePDFGenerator.ts`](file:///c:/Users/Gabriel/Desktop/01_Proyectos_Activos/Inmo-Tasador/src/hooks/usePDFGenerator.ts) lo resuelve con una ingeniería impecable:
*   **Visualización Interactiva:** El tasador puede editar textos y ajustar datos directamente sobre las páginas del reporte interactivo (`ReportView`) antes de imprimir.
*   **Generación por Chunks (Lotes):** Si el reporte supera las 5 páginas, las clona y procesa en lotes independientes para evitar que navegadores móviles (como iOS Safari) se tilden o excedan el límite de 16M de píxeles en canvas.
*   **Escalado Adaptativo:** Captura el canvas a 1.5x en móviles y a 2x en desktop para ofrecer textos nítidos sin inflar innecesariamente el peso del PDF.
*   **Estructura del Reporte Modular:** Ensambla las páginas dinámicamente con componentes independientes:
    *   `CoverPage`: Portada corporativa con branding personalizado.
    *   `PropertyDetailPage`: Ficha técnica visual de la propiedad objetivo.
    *   `AveragesPage` y `SummaryPage`: Cuadro resumen y comparativa de valores de mercado.
    *   `MapPage`: Mapa geolocalizado dinámico usando **Google Static Maps** con marcadores de colores numerados.
    *   `MarketChartPage` y `PriceSuggestionPage`: Gráficos interactivos de dispersión y la sugerencia final de precios con sus zonas límites.
    *   `ContactPage`: Ficha de cierre y contacto profesional.

---

## 7. Versionado de PDFs e Historial
*   **Historial de Tasaciones:** Conexión en tiempo real con Firestore mediante `onSnapshot` para listar las tasaciones del tenant de forma ordenada y permitir su edición.
*   **Versionado Físico de Informes:** Cada vez que el tasador genera un PDF, este se sube en segundo plano a Firebase Storage y se guarda su metadata en Firestore (plantilla usada, peso, cantidad de páginas, usuario que lo generó).
*   **Límite y Limpieza Automática:** El sistema guarda un historial de hasta **5 versiones** del PDF por tasación. Si se genera una sexta, borra automáticamente la versión más vieja tanto de Storage como de Firestore para no desperdiciar espacio de almacenamiento.

---

## 8. UX Fluida y Sistema Multi-Pestaña
El diseño visual está muy cuidado (combina temas y atiende la interacción de usuario con micro-animaciones):
*   **Sistema Multi-pestaña Real:** Funciona igual que un navegador web dentro de la app. Podés abrir hasta **3 tasaciones al mismo tiempo** sin perder los datos de ninguna.
*   **Guardado Silencioso Automático:** Si abrís una cuarta pestaña o cerrás una activa, el sistema realiza un guardado silencioso (`silentSaveTab`) en la base de datos para garantizar que nunca se pierda el progreso del trabajo.
*   **Modo Oscuro/Claro (ThemeContext):** Integración completa de estilos Tailwind para soporte de modo claro y modo oscuro.
*   **Mobile-First Bottom Navigation:** Barra de navegación inferior adaptada a gestos en pantallas táctiles y pantallas de celulares.

---

## 9. Panel de Administración y Roles (RBAC)
La app cuenta con seguridad y roles bien marcados:
*   **Gestión de Usuarios:** Creación y control de cuentas de usuarios de la organización usando Cloud Functions de Firebase.
*   **Anotaciones / Guías de Ayuda:** Un panel para que los administradores creen, editen o eliminen "anotaciones de ayuda" que guían a los tasadores más nuevos con consejos prácticos directamente en el formulario.
*   **Supervisión Global:** El administrador puede visualizar de manera centralizada todas las tasaciones de la plataforma.

---