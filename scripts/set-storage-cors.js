import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const corsContent = [
  {
    "origin": ["*"],
    "method": ["GET", "HEAD", "OPTIONS"],
    "responseHeader": ["Content-Type", "Access-Control-Allow-Origin", "Access-Control-Allow-Headers"],
    "maxAgeSeconds": 3600
  }
];

const corsFilePath = path.join(rootDir, 'cors.json');
const bucketName = 'inmo-tasador.firebasestorage.app';

try {
  // 1. Write the cors.json file in the root directory
  fs.writeFileSync(corsFilePath, JSON.stringify(corsContent, null, 2), 'utf-8');
  console.log('\x1b[32m%s\x1b[0m', '✔ Archivo cors.json generado exitosamente en la raíz del proyecto.');
  
  // 2. Output detailed, actionable instructions for the user
  console.log('\n================================================================');
  console.log('\x1b[36m%s\x1b[0m', 'INSTRUCCIONES PARA APLICAR LAS REGLAS CORS EN FIREBASE STORAGE:');
  console.log('================================================================');
  console.log('Para que el generador de PDF de la aplicación pueda cargar las imágenes');
  console.log('del logo y las propiedades sin problemas de CORS, debés aplicar');
  console.log('las reglas generadas en el archivo `cors.json`.');
  console.log('\n\x1b[1mOPCIÓN RECOMENDADA (Google Cloud Shell - Sin instalar nada):\x1b[0m');
  console.log('1. Ingresá a la consola de Google Cloud: https://console.cloud.google.com/');
  console.log('2. Asegurate de estar en el proyecto correcto (inmo-tasador).');
  console.log('3. Abrí el Cloud Shell (icono ">_" arriba a la derecha).');
  console.log('4. Creá o subí el archivo `cors.json`. Podés crearlo ejecutando:');
  console.log('   cat <<EOF > cors.json');
  console.log(JSON.stringify(corsContent, null, 2));
  console.log('EOF');
  console.log('\n5. Vinculá la regla al bucket de Firebase Storage ejecutando:');
  console.log(`   gcloud storage buckets update gs://${bucketName} --cors-file=cors.json`);
  console.log('   (Alternativamente con gsutil: gsutil cors set cors.json gs://${bucketName})');
  
  console.log('\n\x1b[1mOPCIÓN B (Localmente si tenés instalado gcloud CLI):\x1b[0m');
  console.log('Ejecutá el siguiente comando en la terminal de tu máquina:');
  console.log(`   gcloud storage buckets update gs://${bucketName} --cors-file=cors.json`);
  console.log('================================================================\n');

} catch (error) {
  console.error('\x1b[31m%s\x1b[0m', '✖ Error al generar el archivo cors.json:', error.message);
  process.exit(1);
}
