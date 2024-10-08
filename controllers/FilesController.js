import fs from 'fs';
import Queue from 'bull';
import { ObjectId } from 'mongodb';
import mime from 'mime-types';
import { v4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';
import authenticateUser from '../utils/utilfuncs';

const fileQueue = new Queue('fileQueue', 'redis://127.0.0.1:6379');

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
      if (type === 'image') {
        await fileQueue.add({
          userId: user._id,
          fileId: result.insertedId,
        });
      }
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
      const pipeline = [];
      if (parentId) {
        pipeline.push({
          $match: {
            parentId: parentId === '0' ? 0 : new ObjectId(parentId),
          },
        });
      }
      pipeline.push({ $skip: page ? (parseInt(page, 10) * 20) : 0 });
      pipeline.push({ $limit: 20 });
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

  static async putPublish(req, res) {
    const user = await authenticateUser(req, res);
    if (user) {
      const fileId = req.params.id;
      const filesCollection = dbClient.db.collection('files');
      const file = await filesCollection.findOne({
        _id: new ObjectId(fileId),
        userId: user._id,
      });

      if (file) {
        await filesCollection.updateOne({ _id: new ObjectId(fileId) }, {
          $set: { isPublic: true },
        });
        const updatedFile = await filesCollection.findOne({ _id: new ObjectId(fileId) });
        const {
          _id: id, userId, name, type, isPublic, parentId,
        } = updatedFile;
        res.json({
          id, userId, name, type, isPublic, parentId,
        });
      } else {
        res.status(404).json({ error: 'Not found' });
      }
    }
  }

  static async putUnpublish(req, res) {
    const user = await authenticateUser(req, res);
    if (user) {
      const fileId = req.params.id;
      const filesCollection = dbClient.db.collection('files');
      const file = await filesCollection.findOne({
        _id: new ObjectId(fileId),
        userId: user._id,
      });

      if (file) {
        await filesCollection.updateOne({ _id: new ObjectId(fileId) }, {
          $set: { isPublic: false },
        });
        const updatedFile = await filesCollection.findOne({ _id: new ObjectId(fileId) });
        const {
          _id: id, userId, name, type, isPublic, parentId,
        } = updatedFile;
        res.json({
          id, userId, name, type, isPublic, parentId,
        });
      } else {
        res.status(404).json({ error: 'Not found' });
      }
    }
  }

  static async getFile(req, res) {
    const fileId = req.params.id;
    const filesCollection = dbClient.db.collection('files');
    const file = await filesCollection.findOne({ _id: new ObjectId(fileId) });
    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }
    if (!file.isPublic) {
      const token = req.header('X-Token');
      const userId = await redisClient.get(`auth_${token}`);
      const usersCollection = dbClient.db.collection('users');
      const user = userId ? await usersCollection.findOne({ _id: new ObjectId(userId) }) : null;
      if (!user || (file.userId.toString() !== user._id.toString())) {
        return res.status(404).json({ error: 'Not found' });
      }
    }
    if (file.type === 'folder') {
      return res.status(400).json({ error: "A folder doesn't have content" });
    }
    try {
      const { size } = req.query;
      if (file.isPublic) {
        const data = await fs.promises.readFile(`${file.localPath}${size ? '_'.concat(size) : ''}`);
        return res.header('Content-Type', mime.contentType(file.name)).send(data);
      }
      return res.header('Content-Type', mime.contentType(file.name)).sendFile(`${file.localPath}${size ? '_'.concat(size) : ''}`);
    } catch (err) {
      return res.status(404).json({ error: 'Not found' });
    }
  }
}

export default FilesController;
