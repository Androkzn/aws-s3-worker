import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

let s3Client = null;

const createS3Client = (env) => {
	if (!s3ClientInstance) {
		const region = env.AWS_BUCKET_REGION;
		const accessKeyId = env.AWS_ACCESS_KEY;
		const secretAccessKey = env.AWS_SECRET_ACCESS_KEY;
		s3Client = new S3Client({
			region: region,
			credentials: {
				accessKeyId,
				secretAccessKey,
			},
		});
	}
	return s3Client;
};


export function uploadFile(fileBuffer, fileName, mimetype, destination, metadata = {}, env) {
	metadata['Content-Type'] = mimetype;

	const s3Client = createS3Client(env);

	const uploadParams = {
		Bucket: env.AWS_BUCKET_NAME
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

export function deleteFile(fileName, env) {
	const s3Client = createS3Client(env);

	const deleteParams = {
		Bucket: env.AWS_BUCKET_NAME,
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
async function doesObjectExist(key, env) {
	const s3Client = createS3Client(env);

	const params = {
		Bucket: env.AWS_BUCKET_NAME,
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
export async function getObjectUrl(key, env) {
	const s3Client = createS3Client(env);
  
  // Check if the object exists before proceeding
  const objectExists = await doesObjectExist(key);
  if (!objectExists) {
    throw new Error(`Object with key '${key}' does not exist.`);
  }

  const params = {
    Bucket: env.AWS_BUCKET_NAME,
    Key: key,
  };
  const command = new GetObjectCommand(params);
  // Generate a pre-signed URL that expires in 5 minutes
  const url = await getSignedUrl(s3Client, command, { expiresIn: 300 });
  return url;
}

// Function to check if an object exists in the bucket
export async function getObject(key, env) {
	const s3Client = createS3Client(env);

	const params = {
		Bucket: env.AWS_BUCKET_NAME,
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
