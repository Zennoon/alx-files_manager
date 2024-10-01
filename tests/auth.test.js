import request from 'request';
import { v4 } from 'uuid';
import { describe, it, before } from 'mocha';
import { expect } from 'chai';
import { promisify } from 'util';

const baseUrl = 'http://localhost:5000';
const email = v4();
const password = 'password';

describe('AuthController', function() {
  before(async function() {
    const options = {
      headers: {
        'Content-Type': 'application/json',
      },
      json: true,
      body: {
        email,
        password,
      },
    };

    await promisify(request.post).bind(request)(baseUrl.concat('/users'), options);
  });

  it('test the GET /connect endpoint with valid credentials', function(done) {
    const options = {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${email}:${password}`).toString('base64')}`,
      },
    };
    request.get(baseUrl.concat('/connect'), options, (err, res, body) => {
      if (!err) {
        expect(res.statusCode).to.equal(200);
        expect(res.headers['content-type']).to.include('application/json');

        const json = JSON.parse(body);
        expect(json).to.haveOwnProperty('token');
        expect(json.token).to.be.a('string');
        expect(json.token.length).to.equal(36);
      }
      done();
    });
  });

  it('test the GET /connect endpoint with wrong credentials', function(done) {
    const options = {
      headers: {
        'Authorization': `Basic ${Buffer.from('wrong:credentials').toString('base64')}`,
      },
    };
    request.get(baseUrl.concat('/connect'), options, (err, res, body) => {
      if (!err) {
        expect(res.statusCode).to.equal(401);
        expect(res.headers['content-type']).to.include('application/json');

        const json = JSON.parse(body);
        expect(json).to.haveOwnProperty('error');
        expect(json.error).to.equal('Unauthorized');
      }
      done();
    });
  });

  it('test the GET /connect endpoint with missing email', function(done) {
    const options = {
      headers: {
        'Authorization': `Basic ${Buffer.from(password).toString('base64')}`,
      },
    };
    request.get(baseUrl.concat('/connect'), options, (err, res, body) => {
      if (!err) {
        expect(res.statusCode).to.equal(401);
        expect(res.headers['content-type']).to.include('application/json');

        const json = JSON.parse(body);
        expect(json).to.haveOwnProperty('error');
        expect(json.error).to.equal('Unauthorized');
      }
      done();
    });
  });

  it('test the GET /connect endpoint with missing password', function(done) {
    const options = {
      headers: {
        'Authorization': `Basic ${Buffer.from(email).toString('base64')}`,
      },
    };
    request.get(baseUrl.concat('/connect'), options, (err, res, body) => {
      if (!err) {
        expect(res.statusCode).to.equal(401);
        expect(res.headers['content-type']).to.include('application/json');

        const json = JSON.parse(body);
        expect(json).to.haveOwnProperty('error');
        expect(json.error).to.equal('Unauthorized');
      }
      done();
    });
  });

  it('test the GET /disconnect endpoint with valid token', function(done) {
    const options = {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${email}:${password}`).toString('base64')}`,
      },
    };
    request.get(baseUrl.concat('/connect'), options, (err, res, body) => {
      const { token } = JSON.parse(body);
      const options = {
        headers: {
          'X-Token': token,
        },
      };

      request.get(baseUrl.concat('/disconnect'), options, (err, res, body) => {
        if (!err) {
          expect(res.statusCode).to.equal(204);

          expect(body).to.equal('');
          request.get(baseUrl.concat('/disconnect'), options, (err, res, body) => {
            if (!err) {
              expect(res.statusCode).to.equal(401);
            }
            done();
          });
        }
      });
    });
  });

  it('test the GET /disconnect endpoint with no token', function(done) {
    request.get(baseUrl.concat('/disconnect'), (err, res, body) => {
      if (!err) {
        expect(res.statusCode).to.equal(401);
        
        const json = JSON.parse(body);
        expect(json).to.haveOwnProperty('error');
        expect(json.error).to.equal('Unauthorized');
      }
      done();
    });
  });

  it('test the GET /disconnect endpoint with an invalid token', function(done) {
    const options = {
      headers: {
        'X-Token': 'an-invalid-token',
      },
    }
    request.get(baseUrl.concat('/disconnect'), options, (err, res, body) => {
      if (!err) {
        expect(res.statusCode).to.equal(401);
        
        const json = JSON.parse(body);
        expect(json).to.haveOwnProperty('error');
        expect(json.error).to.equal('Unauthorized');
      }
      done();
    });
  });
});
