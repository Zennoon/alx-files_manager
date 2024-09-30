import fs from 'fs';
import { ObjectId } from 'mongodb';
import { v4 } from 'uuid';
import dbClient from '../utils/db';
import authenticateUser from '../utils/utilfuncs';

class FilesController {
  static async postUpload(req, res) {
    const user = await authenticateUser(req, res);

    if (user) {
      const {
        name, type, parentId, isPublic, data,
      } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Missing name' });
      }
      if (!type) {
        return res.status(400).json({ error: 'Missing type' });
      }
      if (!data && type !== 'folder') {
        return res.status(400).json({ error: 'Missing data' });
      }

      const filesCollection = dbClient.db.collection('files');
      if (parentId) {
        const parentFile = await filesCollection.findOne({
          _id: new ObjectId(parentId),
        });

        if (!parentFile) {
          return res.status(400).json({ error: 'Parent not found' });
        }
        if (parentFile.type !== 'folder') {
          return res.status(400).json({ error: 'Parent is not a folder' });
        }
      }
      if (type === 'folder') {
        const result = await filesCollection.insertOne({
          userId: new ObjectId(user._id),
          name,
          type,
          isPublic: isPublic || false,
          parentId: parentId ? new ObjectId(parentId) : 0,
        });
        return res.status(201).json({
          id: result.insertedId.toString(),
          userId: user._id,
          name,
          type,
          isPublic: isPublic || false,
          parentId: parentId || 0,
        });
      }
      const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
      const filePath = (folderPath.endsWith('/') ? folderPath : folderPath.concat('/')).concat(v4());

      fs.mkdir(folderPath, { recursive: true }, (err) => {
        if (!err) {
          const dataBuffer = Buffer.from(data, 'base64');
          fs.writeFile(filePath, dataBuffer, () => {});
        }
      });
      const result = await filesCollection.insertOne({
        userId: new ObjectId(user._id),
        name,
        type,
        isPublic: isPublic || false,
        parentId: parentId ? new ObjectId(parentId) : 0,
        localPath: filePath,
      });
      return res.status(201).json({
        id: result.insertedId.toString(),
        userId: user._id,
        name,
        type,
        isPublic: isPublic || false,
        parentId: parentId || 0,
      });
    }
    return null;
  }

  static async getShow(req, res) {
    const user = await authenticateUser(req, res);
    if (user) {
      const fileId = req.params.id;
      const filesCollection = dbClient.db.collection('files');
      const file = await filesCollection.findOne({
        _id: new ObjectId(fileId),
        userId: new ObjectId(user._id),
      });

      if (file) {
        const {
          _id: id, userId, name, type, isPublic, parentId,
        } = file;
        res.json({
          id, userId, name, type, isPublic, parentId,
        });
      } else {
        res.status(404).json({ error: 'Not found' });
      }
    }
  }

  static async getIndex(req, res) {
    const user = await authenticateUser(req, res);
    if (user) {
      const { parentId, page } = req.query;
      const filesCollection = dbClient.db.collection('files');
      const pipeline = [
        {
          $match: {
            parentId: parentId ? new ObjectId(parentId) : 0,
          },
        },
        {
          $skip: page ? (parseInt(page, 10) * 20) : 0,
        },
        {
          $limit: 20,
        },
      ];
      const cursor = await filesCollection.aggregate(pipeline);
      const files = [];
      for await (const file of cursor) {
        const {
          _id: id, userId, name, type, isPublic, parentId,
        } = file;
        files.push({
          id, userId, name, type, isPublic, parentId,
        });
      }
      res.json(files);
    }
  }
}

export default FilesController;
