import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { S3Client, PutObjectCommand } from "npm:@aws-sdk/client-s3@3.637.0";
import { getSignedUrl } from "npm:@aws-sdk/s3-request-presigner@3.637.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

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

    if (!sku || !filename || !contentType) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: sku, filename, or contentType" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get B2 credentials from environment
    const b2KeyId = Deno.env.get("B2_KEY_ID");
    const b2AppKey = Deno.env.get("B2_APP_KEY");
    const b2BucketName = Deno.env.get("B2_BUCKET_NAME");
    const b2Endpoint = Deno.env.get("B2_ENDPOINT");

    if (!b2KeyId || !b2AppKey || !b2BucketName || !b2Endpoint) {
      console.error("Missing B2 configuration");
      return new Response(
        JSON.stringify({ error: "Server configuration error: B2 credentials not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create S3 client configured for Backblaze B2
    const s3Client = new S3Client({
      endpoint: b2Endpoint,
      region: "us-east-005", // B2 uses this generic region
      credentials: {
        accessKeyId: b2KeyId,
        secretAccessKey: b2AppKey,
      },
    });

    // Sanitize filename to remove problematic characters
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
    const key = `products/${sku}/${sanitizedFilename}`;

    // Create the command for putting an object
    const command = new PutObjectCommand({
      Bucket: b2BucketName,
      Key: key,
      ContentType: contentType,
    });

    // Generate presigned URL valid for 1 hour
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    // Construct the public URL (this is where the file will be accessible after upload)
    const publicUrl = `${b2Endpoint}/${b2BucketName}/${key}`;

    return new Response(
      JSON.stringify({
        uploadUrl,
        publicUrl,
        key,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error generating B2 upload URL:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
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
