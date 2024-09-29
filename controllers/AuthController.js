import { ObjectId } from 'mongodb';
import sha1 from 'sha1';
import { v4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class AuthController {
  static async getConnect(req, res) {
    const authHeader = req.headers.authorization;
    const base64Decoded = Buffer.from(authHeader.split(' ')[1], 'base64').toString();
    const [email, password] = base64Decoded.split(':');
    const usersCollection = dbClient.db.collection('users');
    const user = await usersCollection.findOne({
      email,
      password: sha1(password),
    });

    if (user) {
      const token = v4();
      redisClient.set(`auth_${token}`, user._id.toString(), 24 * 3600);
      res.json({
        token,
      });
    } else {
      res.statusCode = 401;
      res.json({
        error: 'Unauthorized',
      });
    }
  }

  static async getDisconnect(req, res) {
    const token = req.headers['x-token'];
    if (token) {
      const userId = await redisClient.get(`auth_${token}`);
      const usersCollection = dbClient.db.collection('users');
      const user = await usersCollection.findOne({
        _id: new ObjectId(userId),
      });
      if (user) {
        await redisClient.del(`auth_${token}`);
        res.statusCode = 204;
        res.end();
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

export default AuthController;
