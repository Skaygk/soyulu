import AWS from "aws-sdk";

const { R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ENDPOINT, R2_BUCKET } = process.env;

const s3 = new AWS.S3({
  endpoint: R2_ENDPOINT,
  accessKeyId: R2_ACCESS_KEY_ID,
  secretAccessKey: R2_SECRET_ACCESS_KEY,
});

export default async function handler(req, res) {
  try {
    const files = await s3.listObjectsV2({ Bucket: R2_BUCKET }).promise();
    return res.status(200).json(files.Contents);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
