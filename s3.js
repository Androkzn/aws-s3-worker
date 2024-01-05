import { config } from 'dotenv';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Load environment variables from .env file
config();

const bucketName = "bucket";
const region = "us-west-2";

// Access environment variables
const accessKeyId = process.env.ACCESS_KEY_ID;
const secretAccessKey = process.env.SECRET_ACCESS_KEY;

const s3Client = new S3Client({
  region: region,
  credentials: {
    accessKeyId,
    secretAccessKey
  }
});

export async function uploadFile(fileBuffer, fileName, mimetype, destination, metadata = {}) {
  metadata['Content-Type'] = mimetype;

  const uploadParams = {
    Bucket: bucketName,
    Body: fileBuffer,
    Key: `${destination}/${fileName}`,
    ContentType: mimetype,
    Metadata: metadata,
  };

  try {
    const result = await s3Client.send(new PutObjectCommand(uploadParams));
    return result;
  } catch (error) {
    console.error(`Error uploading file ${fileName}: ${error.message}`);
    throw new Error(`Error uploading file ${fileName}`);
  }
}

export async function deleteFile(fileName) {
  const deleteParams = {
    Bucket: bucketName,
    Key: fileName,
  };

  try {
    const result = await s3Client.send(new DeleteObjectCommand(deleteParams));
    return result;
  } catch (error) {
    console.error(`Error deleting file ${fileName}: ${error.message}`);
    throw new Error(`Error deleting file ${fileName}`);
  }
}

// Function to check if an object exists in the bucket
async function doesObjectExist(key) {
  const params = {
    Bucket: bucketName,
    Key: key,
  };
  
  const command = new GetObjectCommand(params)

  try {
    // If the headObject request is successful, the object exists
    const result = await s3Client.send(command);
    return true;
  } catch (error) {
    // If the headObject request fails, the object does not exist
    console.error(`doesObjectExist error`, error)
    return false;
  }
}

// Function to get a pre-signed URL for reading an object
export async function getObjectUrl(key) {
  // Check if the object exists before proceeding
  const objectExists = await doesObjectExist(key);
  if (!objectExists) {
    throw new Error(`Object with key '${key}' does not exist.`);
  }

  const params = {
    Bucket: bucketName,
    Key: key,
  };
  const command = new GetObjectCommand(params);
  // Generate a pre-signed URL that expires in 5 minutes
  const url = await getSignedUrl(s3Client, command, { expiresIn: 300 });
  return url;
}

// Function to check if an object exists in the bucket
export async function getObject(key) {
  const params = {
    Bucket: bucketName,
    Key: key,
  };
  
  const command = new GetObjectCommand(params)

  try {
    // If the headObject request is successful, the object exists
    const result = await s3Client.send(command);
    return result;
  } catch (error) {
    // If the headObject request fails, the object does not exist
    return null;
  }
}
