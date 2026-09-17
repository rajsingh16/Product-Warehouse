import {
  BlobServiceClient,
  StorageSharedKeyCredential
} from '@azure/storage-blob';

const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;

if (!accountName) {
  throw new Error('AZURE_STORAGE_ACCOUNT_NAME is not configured');
}

if (!accountKey) {
  throw new Error('AZURE_STORAGE_ACCOUNT_KEY is not configured');
}

if (!containerName) {
  throw new Error('AZURE_STORAGE_CONTAINER_NAME is not configured');
}

const credential = new StorageSharedKeyCredential(
  accountName,
  accountKey
);

const blobServiceClient = new BlobServiceClient(
  `https://${accountName}.blob.core.windows.net`,
  credential
);

const containerClient =
  blobServiceClient.getContainerClient(containerName);

export async function uploadFile(
  buffer,
  blobName,
  contentType
) {
  const blockBlobClient =
    containerClient.getBlockBlobClient(blobName);

  await blockBlobClient.uploadData(buffer, {
    blobHTTPHeaders: {
      blobContentType: contentType
    }
  });

  return {
    blobName,
    url: blockBlobClient.url
  };
}

export async function deleteFile(blobName) {
  const blockBlobClient =
    containerClient.getBlockBlobClient(blobName);

  await blockBlobClient.deleteIfExists();
}

export async function downloadFile(blobName) {
  const blockBlobClient =
    containerClient.getBlockBlobClient(blobName);

  return blockBlobClient.download();
}