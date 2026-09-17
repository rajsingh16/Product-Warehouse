import crypto from 'node:crypto';

import {
  deleteFile as deleteBlob,
  downloadFile as downloadBlob,
  uploadFile as uploadBlob,
} from '../services/azureBlobService.js';

import { fileRepository } from '../repositories/fileRepository.js';

import {
  HttpError,
  requiredString,
} from '../utils/http.js';

function getFileExtension(fileName) {
  const dot = fileName.lastIndexOf('.');

  if (dot === -1) {
    return '';
  }

  return fileName.slice(dot).toLowerCase();
}

export const filesController = {
  async list(req, res) {
    const projectId = requiredString(
      req.params.projectId,
      'projectId'
    );

    const folderId = requiredString(
      req.params.folderId,
      'folderId'
    );

    const files = await fileRepository.list(
      projectId,
      folderId
    );

    res.json({
      success: true,
      data: files,
    });
  },

  async upload(req, res) {
    const projectId = requiredString(
      req.params.projectId,
      'projectId'
    );

    const folderId = requiredString(
      req.params.folderId,
      'folderId'
    );

    if (!req.file) {
      throw new HttpError(400, 'File is required');
    }

    const file = req.file;

    const fileId = crypto.randomUUID();

    const extension = getFileExtension(file.originalname);

    const blobName =
      `projects/${projectId}/${folderId}/${fileId}${extension}`;

    const uploaded = await uploadBlob(
      file.buffer,
      blobName,
      file.mimetype
    );

    const record = await fileRepository.create({
      id: fileId,
      projectId,
      folderId,
      fileName: file.originalname,
      blobName: uploaded.blobName,
      fileType: extension.replace('.', ''),
      contentType: file.mimetype,
      fileSize: file.size,
      uploadedBy: req.user.user_id,
    });

    res.status(201).json({
      success: true,
      data: record,
    });
  },

  async download(req, res) {
    const id = requiredString(req.params.id, 'id');

    const file = await fileRepository.get(id);

    if (!file) {
      throw new HttpError(404, 'File not found');
    }

    const downloadResponse = await downloadBlob(
      file.blob_name
    );

    if (!downloadResponse.readableStreamBody) {
      throw new HttpError(404, 'File content not found');
    }

    res.setHeader(
      'Content-Type',
      file.content_type || 'application/octet-stream'
    );

    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(file.file_name)}"`
    );

    downloadResponse.readableStreamBody.pipe(res);
  },

  async remove(req, res) {
    const id = requiredString(req.params.id, 'id');

    const file = await fileRepository.get(id);

    if (!file) {
      throw new HttpError(404, 'File not found');
    }

    await deleteBlob(file.blob_name);

    await fileRepository.remove(id);

    res.status(204).send();
  },
};