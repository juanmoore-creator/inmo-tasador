import * as esbuild from 'esbuild';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// 1. Determinar el entorno
const mode = process.argv.includes('--dev') ? 'development' : 'production';
const envFile = mode === 'development' ? '.env.development' : '.env.production';

// 2. Cargar variables de entorno si el archivo existe
let envVars = {};
if (fs.existsSync(envFile)) {
    console.log(`[build-ext] Cargando variables desde ${envFile}`);
    envVars = dotenv.parse(fs.readFileSync(envFile));
} else if (fs.existsSync('.env')) {
    console.log(`[build-ext] ${envFile} no encontrado. Cargando desde .env genérico`);
    envVars = dotenv.parse(fs.readFileSync('.env'));
} else {
    console.warn(`[build-ext] ADVERTENCIA: No se encontró ningún archivo .env`);
}

// 3. Preparar las variables para inyectarlas en esbuild (deben estar envueltas en comillas)
const defineVars = {};
for (const key in envVars) {
    defineVars[`process.env.${key}`] = JSON.stringify(envVars[key]);
}

// 4. Configurar opciones de esbuild
const watchMode = process.argv.includes('--watch');

const buildOptions = {
    entryPoints: ['SrapIA/background/background.js'],
    bundle: true,
    outfile: 'SrapIA/dist/background.bundle.js',
    format: 'esm',
    define: defineVars,
};

// 5. Ejecutar la construcción
if (watchMode) {
    esbuild.context(buildOptions).then(ctx => {
        ctx.watch();
        console.log(`[build-ext] Observando cambios en modo ${mode}...`);
    }).catch(() => process.exit(1));
} else {
    esbuild.build(buildOptions).then(() => {
        console.log(`[build-ext] Build completado exitosamente en modo ${mode}.`);
    }).catch(() => process.exit(1));
}
