import fs from 'fs';
import imageThumbnail from 'image-thumbnail';
import Queue from 'bull';
import { ObjectId } from 'mongodb';
import dbClient from './utils/db';

const fileQueue = new Queue('fileQueue', 'redis://127.0.0.1:6379');
const userQueue = new Queue('userQueue', 'redis://127.0.0.1:6379');

fileQueue.process(async (job) => {
  const { fileId, userId } = job.data;

  if (!fileId) {
    throw new Error('Missing fileId');
  }
  if (!userId) {
    throw new Error('Missing userId');
  }
  const filesCollection = dbClient.db.collection('files');
  const file = await filesCollection.findOne({
    _id: new ObjectId(fileId),
    userId: new ObjectId(userId),
  });

  if (!file) {
    throw new Error('File not found');
  }

  const promises = [500, 250, 100].map((width) => {
    const promise = (async () => {
      const thumbnail = await imageThumbnail(file.localPath, { width });
      await fs.promises.writeFile(`${file.localPath}_${width}`, thumbnail);
    })();
    return promise;
  });
  await Promise.all(promises);
});

userQueue.process(async (job) => {
  const { userId } = job.data;

  if (!userId) {
    throw new Error('Missing userId');
  }

  const usersCollection = dbClient.db.collection('users');
  const user = await usersCollection.findOne({
    _id: new ObjectId(userId),
  });

  if (!user) {
    throw new Error('User not found');
  }
  console.log(`Welcome ${user.email}!`);
});
