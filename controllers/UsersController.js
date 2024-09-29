import sha1 from 'sha1';
import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    if (!email) {
      res.statusCode = 400;
      res.json({ error: 'Missing email' });
    } else if (!password) {
      res.statusCode = 400;
      res.json({ error: 'Missing password' });
    } else {
      const usersCollection = dbClient.db.collection('users');
      const existingUser = await usersCollection.findOne({ email });

      if (existingUser) {
        res.statusCode = 400;
        res.json({ error: 'Already exist' });
      } else {
        const hashedPassword = sha1(password);
        const fields = {
          email,
          password: hashedPassword,
        };

        await usersCollection.insertOne(fields);
        res.statusCode = 201;
        res.json({
          id: fields._id,
          email,
        });
      }
    }
  }

  static async getMe(req, res) {
    const token = req.header('X-Token');
    if (token) {
      const userId = await redisClient.get(`auth_${token}`);
      if (userId) {
        const usersCollection = dbClient.db.collection('users');
        const user = await usersCollection.findOne({
          _id: new ObjectId(userId),
        });
        if (user) {
          res.json({
            id: userId,
            email: user.email,
          });
        } else {
          res.statusCode = 401;
          res.json({
            error: 'Unauthorized',
          });
        }
      } else {
        res.statusCode = 401;
        res.json({
          error: 'Unauthorized',
        });
      }
    } else {
      res.statusCode = 401;
      res.json({
        error: 'Unauthorized',
      });
    }
  }
}

export default UsersController;
