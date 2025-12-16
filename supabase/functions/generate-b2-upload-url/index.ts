import AWS from "aws-sdk";

const s3 = new AWS.S3({
  endpoint: "https://s3.us-east-005.backblazeb2.com",
  accessKeyId: process.env.B2_KEY_ID,
  secretAccessKey: process.env.B2_APP_KEY,
  region: "us-east-005",
  signatureVersion: "v4",
});

export async function POST(req) {
  const { sku, fileName, fileType } = await req.json();

  const key = `products/${sku}/${fileName}`;

  const uploadUrl = await s3.getSignedUrlPromise("putObject", {
    Bucket: "warehouse414",
    Key: key,
    ContentType: fileType,
    Expires: 60, // seconds
  });

  return Response.json({
    uploadUrl,
    fileUrl: `https://warehouse414.s3.us-east-005.backblazeb2.com/${key}`,
  });
}
