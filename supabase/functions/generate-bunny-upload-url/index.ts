import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { sku, filename, contentType } = await req.json();

    if (!sku || !filename || !contentType) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: sku, filename, contentType" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const storageApiKey = Deno.env.get("BUNNY_STORAGE_API_KEY");
    const storageZone = Deno.env.get("BUNNY_STORAGE_ZONE");
    const storageHostname = Deno.env.get("BUNNY_STORAGE_HOSTNAME");
    const cdnHostname = Deno.env.get("BUNNY_CDN_HOSTNAME");

    if (!storageApiKey || !storageZone || !storageHostname || !cdnHostname) {
      return new Response(
        JSON.stringify({ error: "Bunny.net configuration not found" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const sanitizedFilename = filename
      .replace(/[^a-zA-Z0-9._-]/g, "-")
      .replace(/-+/g, "-")
      .toLowerCase();

    const timestamp = Date.now();
    const uniqueFilename = `${timestamp}-${sanitizedFilename}`;
    const filePath = `products/${sku}/${uniqueFilename}`;

    const uploadUrl = `https://${storageHostname}/${storageZone}/${filePath}`;
    const publicUrl = `https://${cdnHostname}/${filePath}`;

    return new Response(
      JSON.stringify({
        uploadUrl,
        publicUrl,
        headers: {
          AccessKey: storageApiKey,
          "Content-Type": contentType,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error generating upload URL:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate upload URL" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});