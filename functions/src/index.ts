import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as puppeteer from 'puppeteer';

admin.initializeApp();

export const generatePdfReport = functions
  .runWith({
    timeoutSeconds: 120,
    memory: '2GB',
  })
  .https.onCall(async (data, context) => {
    // 1. Validar que el usuario esté autenticado
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'El usuario debe estar autenticado.'
      );
    }

    const { valuationId, printToken } = data;

    if (!valuationId || !printToken) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Se requiere valuationId y printToken.'
      );
    }

    // 2. Levantar el navegador en background (Puppeteer)
    let browser: puppeteer.Browser | null = null;

    try {
      // Configuraciones extra para evitar problemas de sandbox en entornos serverless
      browser = await puppeteer.launch({
        headless: 'new' as any,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
      });

      const page = await browser.newPage();

      // Ajustamos el tamaño del viewport para que sea similar a una pantalla desktop y dispare bien el layout
      await page.setViewport({ width: 1280, height: 1024 });

      // IMPORTANTE: Cambiar 'https://inmo-tasador.web.app' por la URL base dinámica si se desea,
      // pero para producción será la URL del frontend desplegado.
      const baseUrl = 'https://inmo-tasador.web.app'; 
      // Usamos query params para activar el modo de impresión en la app React
      const targetUrl = `${baseUrl}/?print=true&id=${valuationId}&token=${printToken}`;

      console.log(`Navegando a: ${targetUrl}`);

      // networkidle0 significa "esperar a que no haya conexiones de red durante 500ms"
      // es fundamental para que el mapa de Google termine de cargar.
      await page.goto(targetUrl, {
        waitUntil: 'networkidle0',
        timeout: 60000,
      });

      // Asegurarnos de que el contenido no esté en estado de "cargando..."
      // Podemos esperar un selector específico si es necesario:
      // await page.waitForSelector('.print-ready', { timeout: 10000 });

      // 3. Generar el PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
      });

      // 4. Subir el buffer a Firebase Storage
      const bucket = admin.storage().bucket();
      // Obtenemos info básica para armar el nombre
      const tenantId = data.tenantId || 'unknown_tenant';
      const timestamp = Date.now();
      const storagePath = `tenants/${tenantId}/pdfs/${valuationId}/${timestamp}_cloud.pdf`;

      const file = bucket.file(storagePath);
      await file.save(pdfBuffer, {
        metadata: {
          contentType: 'application/pdf',
          metadata: {
            valuationId,
            generatedBy: context.auth.uid,
            isCloudGenerated: 'true'
          },
        },
      });

      // Asegurarnos de obtener una URL firmada (o pública si el bucket lo permite)
      // Firestore usa URLs firmadas de larga duración o la URL pública de download
      const [signedUrl] = await file.getSignedUrl({
        action: 'read',
        expires: '03-01-2500', // URL válida por largo tiempo
      });

      return {
        success: true,
        storageUrl: signedUrl,
        storagePath: storagePath,
      };

    } catch (error) {
      console.error('Error generando PDF:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Ocurrió un error al generar el PDF.',
        error instanceof Error ? error.message : String(error)
      );
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  });
