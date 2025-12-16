import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const BUNNY_API_KEY = "81e3951c-c600-41b8-b1d7-360dd0431371b2befb98-07b1-4dad-9d6c-1302131f4e1e";
const BUNNY_STORAGE_ZONE = "warehouse414";
const BUNNY_CDN_URL = "https://warehouseimages.b-cdn.net";
const BUNNY_STORAGE_URL = "https://storage.bunnycdn.com";

interface UploadRequest {
  sku: string;
  filename: string;
  contentType: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { sku, filename, contentType }: UploadRequest = await req.json();

    if (!sku || !filename) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: sku, filename" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const filePath = `products/${sku}/${filename}`;
    const uploadUrl = `${BUNNY_STORAGE_URL}/${BUNNY_STORAGE_ZONE}/${filePath}`;
    const publicUrl = `${BUNNY_CDN_URL}/${filePath}`;

    return new Response(
      JSON.stringify({
        uploadUrl,
        publicUrl,
        headers: {
          "AccessKey": BUNNY_API_KEY,
          "Content-Type": contentType || "application/octet-stream",
        },
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error generating upload URL:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate upload URL" }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});