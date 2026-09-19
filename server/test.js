import 'dotenv/config';

import {
  uploadFile,
  deleteFile
} from './services/azureBlobService.js';

const blobName = 'test/azure-connection-test.txt';

const content = Buffer.from(
  'Azure Blob Storage connection test successful.'
);

try {
  console.log('Uploading test file...');

  const result = await uploadFile(
    content,
    blobName,
    'text/plain'
  );

  console.log('Upload successful!');
  console.log('Blob name:', result.blobName);
  console.log('Blob URL:', result.url);

  console.log('Deleting test file...');

  await deleteFile(blobName);

  console.log('Delete successful!');
  console.log('Azure Blob Storage connection is working.');
} catch (error) {
  console.error('Azure Blob Storage test failed.');
  console.error(error);
}