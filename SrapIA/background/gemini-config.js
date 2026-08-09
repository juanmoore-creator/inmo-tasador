// ============================================================
// PropPick — Gemini Configuration (MODO ESTRICTO)
// Usa JSON Schema para garantizar que el JSON sea válido y completo.
// ============================================================

export const GEMINI_MODEL = 'gemini-2.5-flash';
export const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

/**
 * Mapeo de campos para generar el esquema JSON automáticamente.
 */
export const EXTRACTION_FIELDS = [
  { key: 'direccion', type: 'string', desc: 'Dirección exacta' },
  { key: 'precio', type: 'string', desc: 'Precio con moneda' },
  { key: 'estado', type: 'string', desc: 'Estado: Disponible/Reservado/Vendido' },
  { key: 'tipo_propiedad', type: 'string', desc: 'Casa, Depto, etc.' },
  { key: 'antiguedad', type: 'string', desc: 'Años de antigüedad' },
  { key: 'expensas', type: 'string', desc: 'Valor cuota de expensas' },
  { key: 'superficie_cubierta', type: 'string', desc: 'm² cubiertos' },
  { key: 'superficie_total', type: 'string', desc: 'm² totales' },
  { key: 'ambientes', type: 'number', desc: 'Cantidad de ambientes' },
  { key: 'dormitorios', type: 'number', desc: 'Cantidad de cuartos' },
  { key: 'banos', type: 'number', desc: 'Cantidad de baños' },
  { key: 'toilettes', type: 'number', desc: 'Cantidad de toilettes' },
  { key: 'cocheras', type: 'number', desc: 'Cantidad de cocheras' },
  { key: 'disposicion', type: 'string', desc: 'Frente/Contrafrente/Interno' },
  { key: 'orientacion', type: 'string', desc: 'Norte/Sur/Este/Oeste' },
  { key: 'coordenadas', type: 'string', desc: 'Latitud, Longitud' },
  { key: 'amenities', type: 'string', desc: 'Lista de servicios: piscina, SUM, etc.' },
  { key: 'equipamiento', type: 'string', desc: 'Equipamiento: aire, calefacción, etc.' },
  { key: 'apto_credito', type: 'boolean', desc: '¿Es apto crédito?' },
  { key: 'apto_profesional', type: 'boolean', desc: '¿Es apto profesional?' },
];

/**
 * Genera el Response Schema (Esquema de respuesta) para Gemini.
 */
function getResponseSchema() {
  const properties = {};
  const required = [];

  EXTRACTION_FIELDS.forEach(field => {
    properties[field.key] = {
      type: field.type,
      description: field.desc,
      nullable: true
    };
    required.push(field.key);
  });

  return {
    type: "OBJECT",
    properties: properties,
    required: required
  };
}

export function buildGeminiMultiImagePrompt(imagesBase64) {
  return {
    contents: [{
      parts: [
        { text: "Analiza las capturas del anuncio inmobiliario y extrae los datos técnicos. Si no encuentras un dato, rellena con null." },
        ...imagesBase64.map(data => ({
          inline_data: { mime_type: "image/jpeg", data }
        }))
      ]
    }],
    generationConfig: {
      temperature: 0,
      maxOutputTokens: 2048,
      response_mime_type: "application/json",
      response_schema: getResponseSchema() // ← EL SECRETO: Fuerza a la IA a seguir el esquema
    }
  };
}
