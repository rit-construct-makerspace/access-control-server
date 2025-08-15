import { PutObjectCommand, S3Client, ListObjectsCommand } from "@aws-sdk/client-s3";


const client = new S3Client({
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
  },
});

/**
 * Uploads an object to the make-static bucket on S3
 * @param path directory to put the image in, ex: user-uploads, equipment-images
 * @param name name of object
 * @param file buffer of object
 */
export async function putObject(path: string, name: string, file: Buffer) {
  const command = new PutObjectCommand({
    Bucket: "make-static", // Bucket to put it in
    Key: `${path}/${name}`, // name of file in S3
    Body: file // file contents
  });

  const response = await client.send(command);
  return response;
}


export async function listObjects(path: string): Promise<string[] | undefined> {
  if (!path.endsWith("/")) {
    path += "/";
  }
  const cmd = new ListObjectsCommand({
    Bucket: "make-static",
    Prefix: path,

  });
  const response = await client.send(cmd);
  const parts = response?.Contents?.map(o => o.Key?.substring(path.length)).filter(n => n && n.length > 0);
  if (!parts) {
    // an error happened
    return undefined;
  }
  if (parts?.some(o => o === undefined)) {
    // if any failed, fail it all (if this is happening, the programmer misunderstood the AWS docs)
    return undefined;
  }
  return parts as string[];
}

