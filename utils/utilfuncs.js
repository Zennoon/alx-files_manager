import { ObjectId } from 'mongodb';
import dbClient from './db';
import redisClient from './redis';

async function authenticateUser(req, res) {
  const token = req.header('X-Token');
  const userId = await redisClient.get(`auth_${token}`);
  if (userId) {
    const usersCollection = dbClient.db.collection('users');
    const user = await usersCollection.findOne({
      _id: new ObjectId(userId),
    });

    if (user) {
      return user;
    }
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }
  res.status(401).json({ error: 'Unauthorized' });
  return null;
}

export default authenticateUser;
