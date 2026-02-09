import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { configureUnPDF, getResolvedPDFJS } from 'https://esm.sh/unpdf@0.10.0';
import * as pdfjs from 'https://esm.sh/unpdf@0.10.0/dist/pdfjs.mjs';

await configureUnPDF({
  // deno-lint-ignore require-await
  pdfjs: async () => pdfjs,
});
const resolvedPdfJs = await getResolvedPDFJS();
const { getDocument } = resolvedPdfJs;

export async function convertPdfToText(
  arrayBuffer: ArrayBuffer
): Promise<{
  text: string,
  metadata: any,
  pages: number
}> {
  try {
    const data = new Uint8Array(arrayBuffer);

    // Get the document
    const doc = await getDocument(data).promise;
    let allText = '';
    const metadata = await doc.getMetadata();
    // Iterate through each page of the document
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const textContent = await page.getTextContent();

      // Combine the text items with a space (adjust as needed)
      const pageText = textContent.items
        .map((item) => {
          if ('str' in item) {
            return item.str;
          }
          return '';
        })
        .join(' ');
      allText += pageText + '\n'; // Add a newline after each page's text
    }

    console.log("PDF Text:", allText);
    console.log("PDF Metadata:", metadata);
    console.log("PDF Pages:", doc.numPages);
    return {
      text: allText,
      metadata,
      pages: doc.numPages
    };
  } catch (error) {
    console.error('Error converting PDF to text', error);
    throw error;
  }
}
interface RequestBody {
  pdfBase64: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "*",
      },
    });
  }

  try {
    // Parse request body
    const { pdfBase64 } = await req.json() as RequestBody;

    if (!pdfBase64) {
      throw new Error("Missing pdfBase64 in request body");
    }

    // Convert base64 to buffer
    const pdfBuffer = Uint8Array.from(atob(pdfBase64), c => c.charCodeAt(0));

    // Extract text from PDF using unpdf
    const { text, metadata, pages } = await convertPdfToText(
      pdfBuffer
    )

    // Use TextEncoder/TextDecoder for proper UTF-8 handling
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    // Convert text to base64 safely
    const textBase64 = btoa(
      String.fromCharCode(...encoder.encode(text))
    );

    return new Response(
      JSON.stringify({
        textBase64,
        metadata: metadata,
        pages: pages
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "*",
        },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error processing PDF:", error);

    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        status: 400,
      }
    );
  }
}); 