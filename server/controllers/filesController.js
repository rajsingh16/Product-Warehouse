import crypto from 'node:crypto';
import { pipeline } from 'node:stream/promises';

import {
  deleteFile as deleteBlob,
  downloadFile as downloadBlob,
  uploadFile as uploadBlob,
} from '../services/azureBlobService.js';

import { fileRepository } from '../repositories/fileRepository.js';

import { HttpError, requiredString } from '../utils/http.js';

function getFileExtension(fileName) {
  const dot = fileName.lastIndexOf('.');
  if (dot === -1) return '';
  return fileName.slice(dot).toLowerCase();
}

const MIME_BY_TYPE = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  pdf: 'application/pdf',
};

// Prefer the stored type; fall back to the extension if it is missing or generic.
function resolveContentType(file) {
  const stored = file.content_type;
  if (stored && stored !== 'application/octet-stream') return stored;
  return MIME_BY_TYPE[String(file.file_type ?? '').toLowerCase()] ?? 'application/octet-stream';
}

// RFC 6266: ASCII fallback plus UTF-8 filename*. The old code put a percent-encoded name in filename="".
function inlineDisposition(fileName) {
  const fallback = fileName.replace(/[^\x20-\x7E]/g, '_').replace(/["\\]/g, '_');
  const encoded = encodeURIComponent(fileName).replace(
    /['()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`
  );
  return `inline; filename="${fallback}"; filename*=UTF-8''${encoded}`;
}

export const filesController = {
  async list(req, res) {
    const projectId = requiredString(req.params.projectId, 'projectId');
    const folderId = requiredString(req.params.folderId, 'folderId');

    const files = await fileRepository.list(projectId, folderId);

    res.json({ success: true, data: files });
  },

  async upload(req, res) {
    const projectId = requiredString(req.params.projectId, 'projectId');
    const folderId = requiredString(req.params.folderId, 'folderId');

    if (!req.file) {
      throw new HttpError(400, 'File is required');
    }

    const file = req.file;
    const fileId = crypto.randomUUID();
    const extension = getFileExtension(file.originalname);
    const blobName = `projects/${projectId}/${folderId}/${fileId}${extension}`;

    const uploaded = await uploadBlob(file.buffer, blobName, file.mimetype);

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

    res.status(201).json({ success: true, data: record });
  },

  async download(req, res) {
    const id = requiredString(req.params.id, 'id');

    const file = await fileRepository.get(id);
    if (!file) {
      throw new HttpError(404, 'File not found');
    }

    let downloadResponse;
    try {
      downloadResponse = await downloadBlob(file.blob_name);
    } catch (err) {
      if (err?.statusCode === 404) throw new HttpError(404, 'File content not found in storage');
      throw err;
    }

    if (!downloadResponse.readableStreamBody) {
      throw new HttpError(404, 'File content not found');
    }

    res.setHeader('Content-Type', resolveContentType(file));
    res.setHeader('Content-Disposition', inlineDisposition(file.file_name));
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'private, max-age=0');
    if (downloadResponse.contentLength) {
      res.setHeader('Content-Length', String(downloadResponse.contentLength));
    }

    try {
      await pipeline(downloadResponse.readableStreamBody, res);
    } catch (err) {
      // Once bytes are flowing we cannot send a JSON error; just log real failures.
      if (!res.headersSent) throw err;
      if (err?.code !== 'ERR_STREAM_PREMATURE_CLOSE') {
        console.error('File stream failed', file.id, err?.message);
      }
    }
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