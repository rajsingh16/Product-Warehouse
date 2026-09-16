

const {
    BlobServiceClient
  } = require('@azure/storage-blob');
  
  const {
    DefaultAzureCredential
  } = require('@azure/identity');
  
  const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
  const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;
  
  if (!accountName) {
    throw new Error('AZURE_STORAGE_ACCOUNT_NAME is not configured');
  }
  
  if (!containerName) {
    throw new Error('AZURE_STORAGE_CONTAINER_NAME is not configured');
  }
  
  const credential = new DefaultAzureCredential();
  
  const blobServiceClient = new BlobServiceClient(
    `https://${accountName}.blob.core.windows.net`,
    credential
  );
  
  const containerClient =
    blobServiceClient.getContainerClient(containerName);
  
  async function uploadFile(
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
  
  async function deleteFile(blobName) {
    const blockBlobClient =
      containerClient.getBlockBlobClient(blobName);
  
    await blockBlobClient.deleteIfExists();
  }
  
  async function downloadFile(blobName) {
    const blockBlobClient =
      containerClient.getBlockBlobClient(blobName);
  
    return blockBlobClient.download();
  }
  
  module.exports = {
    uploadFile,
    deleteFile,
    downloadFile
  };