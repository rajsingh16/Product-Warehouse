import crypto from 'node:crypto';

import { folderRepository } from '../repositories/folderRepository.js';
import { projectsRepository } from '../repositories/repository.js';

import {
  HttpError,
  requiredString,
  optionalString,
} from '../utils/http.js';

const DEFAULT_FOLDERS = [
  'Informative Data',
  'Analysis Data',
  'Analytics Data',
  'Reports',
];

export const foldersController = {
  async list(req, res) {
    res.set('Cache-Control', 'no-store');
    const projectId = requiredString(req.params.projectId, 'projectId');
  
    const project = await projectsRepository.get(projectId);
  
    if (!project) {
      throw new HttpError(404, 'Project not found');
    }
  
    let folders = await folderRepository.listByProject(projectId);
  
    // Create the default folders for older projects
    // that do not have any folders yet.
    if (folders.length === 0) {
      folders = await foldersController.ensureDefaultFolders(
        projectId,
        req.user.user_id
      );
    }
  
    // Get the number of files stored in each folder.
    const fileCounts =
      await folderRepository.getFileCountsByProject(projectId);
  
    const fileCountMap = new Map(
      fileCounts.map((row) => [
        row.folder_id,
        Number(row.file_count),
      ])
    );
  
    // Add file_count to every folder returned to the frontend.
    folders = folders.map((folder) => ({
      ...folder,
      file_count: fileCountMap.get(folder.folder_id) ?? 0,
    }));
  
    res.json({
      success: true,
      data: folders,
    });
  },

  async create(req, res) {
    const projectId = requiredString(
      req.params.projectId,
      'projectId'
    );

    const project = await projectsRepository.get(projectId);

    if (!project) {
      throw new HttpError(404, 'Project not found');
    }

    const name = requiredString(
      req.body.name,
      'name'
    );

    const parentFolderId = optionalString(
      req.body.parentFolderId,
      'parentFolderId'
    );

    if (parentFolderId) {
      const parentFolder =
        await folderRepository.get(parentFolderId);

      if (!parentFolder) {
        throw new HttpError(
          404,
          'Parent folder not found'
        );
      }

      if (parentFolder.project_id !== projectId) {
        throw new HttpError(
          400,
          'Parent folder does not belong to this project'
        );
      }
    }

    const folder = await folderRepository.create({
      id: crypto.randomUUID(),
      projectId,
      parentFolderId,
      name,
      createdBy: req.user.user_id,
    });

    res.status(201).json({
      success: true,
      data: folder,
    });
  },

  async remove(req, res) {
    const folderId = requiredString(
      req.params.folderId,
      'folderId'
    );

    const folder = await folderRepository.get(folderId);

    if (!folder) {
      throw new HttpError(404, 'Folder not found');
    }

    if (
      folder.project_id !==
      requiredString(req.params.projectId, 'projectId')
    ) {
      throw new HttpError(
        400,
        'Folder does not belong to this project'
      );
    }

    await folderRepository.remove(folderId);

    res.status(204).send();
  },

  async ensureDefaultFolders(projectId, createdBy) {
    const existing =
      await folderRepository.listByProject(projectId);

    if (existing.length > 0) {
      return existing;
    }

    const folders = [];

    for (const name of DEFAULT_FOLDERS) {
      const folder = await folderRepository.create({
        id: crypto.randomUUID(),
        projectId,
        parentFolderId: null,
        name,
        createdBy,
      });

      folders.push(folder);
    }

    return folders;
  },
};