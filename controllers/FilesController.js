import fs from 'fs';
import { ObjectId } from 'mongodb';
import { v4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class FilesController {
  static async postUpload(req, res) {
    const token = req.header('X-Token');
    const userId = await redisClient.get(`auth_${token}`);
    if (userId) {
      const usersCollection = dbClient.db.collection('users');
      const user = await usersCollection.findOne({
        _id: new ObjectId(userId),
      });

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
            userId: new ObjectId(userId),
            name,
            type,
            isPublic: isPublic || false,
            parentId: parentId ? new ObjectId(parentId) : 0,
          });
          return res.status(201).json({
            id: result.insertedId.toString(),
            userId,
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
          userId: new ObjectId(userId),
          name,
          type,
          isPublic: isPublic || false,
          parentId: parentId ? new ObjectId(parentId) : 0,
          localPath: filePath,
        });
        return res.status(201).json({
          id: result.insertedId.toString(),
          userId,
          name,
          type,
          isPublic: isPublic || false,
          parentId: parentId || 0,
        });
      }
      return res.status(401).json({
        error: 'Unauthorized',
      });
    }
    return res.status(401).json({
      error: 'Unauthorized',
    });
  }
}

export default FilesController;
