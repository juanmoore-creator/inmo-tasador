import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { getFirestore } from 'firebase-admin/firestore';

if (getApps().length === 0) {
  initializeApp();
}

export const generateCloudPdf = onCall(
  {
    timeoutSeconds: 120,
    memory: '2GiB',
    invoker: 'public' // ESTO HACE QUE SE ARREGLE EL ERROR CORS / PREFLIGHT
  },
  async (request) => {
    // En v2, auth y data vienen dentro del objeto request
    const { data, auth } = request;

    // 1. Validar que el usuario esté autenticado
    if (!auth) {
      throw new HttpsError(
        'unauthenticated',
        'El usuario debe estar autenticado.'
      );
    }

    const { valuationId, printToken } = data;

    if (!valuationId || !printToken) {
      throw new HttpsError(
        'invalid-argument',
        'Se requiere valuationId y printToken.'
      );
    }

    // 2. Levantar el navegador en background (Puppeteer)
    const puppeteer = require('puppeteer-core');
    const chromium = require('@sparticuz/chromium').default;
    
    let browser: any = null;

    try {
      browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
      });

      const page = await browser.newPage();

      // Ajustamos el tamaño del viewport
      await page.setViewport({ width: 1280, height: 1024 });

      // Leer los datos de la tasación con Admin SDK para no requerir login en Frontend
      const db = getFirestore();
      const valuationDoc = await db.collection('valuations').doc(valuationId).get();
      if (!valuationDoc.exists) {
        throw new HttpsError('not-found', 'Tasación no encontrada.');
      }
      const valuationData = { id: valuationDoc.id, ...valuationDoc.data() };

      const tenantIdParam = data.tenantId || 'unknown_tenant';
      let tenantData = null;
      if (tenantIdParam !== 'unknown_tenant') {
        const tenantDoc = await db.collection('tenants').doc(tenantIdParam).get();
        if (tenantDoc.exists) {
          tenantData = { id: tenantDoc.id, ...tenantDoc.data() };
        }
      }

      // Inyectar en el sandbox de Chrome ANTES de cargar la URL
      await page.evaluateOnNewDocument((valData: any, tenData: any) => {
        (window as any).__INJECTED_VALUATION_DATA__ = valData;
        (window as any).__INJECTED_TENANT_DATA__ = tenData;
      }, valuationData, tenantData);

      // IMPORTANTE: URL base (no necesitamos token ahora)
      const baseUrl = 'https://inmo-tasador.web.app'; 
      const targetUrl = `${baseUrl}/?print=true`;

      console.log(`Navegando a: ${targetUrl}`);

      // networkidle2 permite conexiones persistentes (ej. WebSockets de Firebase)
      await page.goto(targetUrl, {
        waitUntil: 'networkidle2',
        timeout: 45000,
      });

      // Esperar explícitamente a que React termine de cargar los datos o tire un error
      await page.waitForFunction(
        'document.querySelector("#print-ready") || document.querySelector("#print-error")',
        { timeout: 30000 }
      );

      // 3. Generar el PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
      });

      // 4. Subir el buffer a Firebase Storage
      const bucket = getStorage().bucket();
      const fileName = `${valuationId}_${Date.now()}.pdf`;
      const storagePath = `pdfs/${tenantIdParam}/${fileName}`;
      const file = bucket.file(storagePath);
      
      await file.save(pdfBuffer, {
        metadata: {
          contentType: 'application/pdf',
          metadata: {
            valuationId,
            generatedBy: auth.uid,
            isCloudGenerated: 'true'
          },
        },
      });

      return {
        success: true,
        storagePath: storagePath,
      };

    } catch (error) {
      console.error('Error generando PDF:', error);
      throw new HttpsError(
        'unknown',
        error instanceof Error ? error.message : String(error)
      );
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
);
