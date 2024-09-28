import sha1 from 'sha1';
import dbClient from '../utils/db';

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
}

export default UsersController;
