import sha1 from 'sha1';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class AuthController {
  static async getConnect(req, res) {
    const auth = req.header('Authorization');
    const [email, password] = Buffer.from(auth.split(' ')[1], 'base64').toString('ascii').split(':');

    if (!(email && password)) {
      res.statusCode = 401;
      res.json({
        error: 'Unauthorized',
      });
    } else {
      const usersCollection = dbClient.db.collection('users');
      const user = await usersCollection.findOne({
        email,
        password: sha1(password),
      });

      if (user) {
        const token = uuidv4();
        await redisClient.set(`auth_${token}`, user._id.toString(), 3600 * 24);
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
  }

  static async getDisconnect(req, res) {
    const token = req.header('X-Token');
    const userId = await redisClient.get(`auth_${token}`);

    if (userId) {
      await redisClient.del(`auth_${token}`);
      res.statusCode = 204;
      res.json({});
    } else {
      res.statusCode = 401;
      res.json({
        error: 'Unauthorized',
      });
    }
  }
}

module.exports = AuthController;
