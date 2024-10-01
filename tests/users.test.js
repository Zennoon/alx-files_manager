import request from 'request';
import { v4 } from 'uuid';
import { describe, it } from "mocha";
import { expect } from 'chai';

const baseUrl = 'http://127.0.0.1:5000';
const email = v4();
const password = 'password';

describe('UsersController', function() {
  it('test the POST /users endpoint with valid email and password', function(done) {
    const options = {
      json: true,
      body: {
        email,
        password,
      },
    };

    request.get(baseUrl.concat('/stats'), (err, res, body) => {
      if (!err) {
        const numUsers = JSON.parse(body).users;
        request.post(baseUrl.concat('/users'), options, (err, res, body) => {
          if (!err) {
            expect(res.statusCode).to.equal(201);
            
            expect(body).to.haveOwnProperty('id');
            expect(body).to.haveOwnProperty('email');
            expect(body.email).to.equal(email);

            request.get(baseUrl.concat('/stats'), (err, res, body) => {
              if (!err) {
                expect(JSON.parse(body).users).to.equal(numUsers + 1);
              }
              done();
            });
          }
        });
      }
    });
  });

  it('test the POST /users endpoint with a missing email', function(done) {
    const options = {
      json: true,
      body: {
        password,
      },
    };
    request.post(baseUrl.concat('/users'), options, (err, res, body) => {
      if (!err) {
        expect(res.statusCode).to.equal(400);
        expect(body).to.haveOwnProperty('error');
        expect(body.error).to.equal('Missing email');
      }
      done();
    });
  });

  it('test the POST /users endpoint with a missing password', function(done) {
    const options = {
      json: true,
      body: {
        email,
      },
    };
    request.post(baseUrl.concat('/users'), options, (err, res, body) => {
      if (!err) {
        expect(res.statusCode).to.equal(400);
        expect(body).to.haveOwnProperty('error');
        expect(body.error).to.equal('Missing password');
      }
      done();
    });
  });

  it('test the POST /users endpoint with an existing email', function(done) {
    const options = {
      json: true,
      body: {
        email,
        password,
      },
    };
    request.post(baseUrl.concat('/users'), options, (err, res, body) => {
      if (!err) {
        expect(res.statusCode).to.equal(400);
        expect(body).to.haveOwnProperty('error');
        expect(body.error).to.equal('Already exist');
      }
      done();
    });
  });

  it('test the GET /users/me endpoint with a valid token', function(done) {
    const options = {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${email}:${password}`).toString('base64')}`,
      },
    };
    request.get(baseUrl.concat('/connect'), options, (err, res, body) => {
      if (!err) {
        const { token } = JSON.parse(body);
        const options = {
          headers: {
            'X-Token': token,
          },
        };

        request.get(baseUrl.concat('/users/me'), options, (err, res, body) => {
          if (!err) {
            expect(res.statusCode).to.equal(200);
            const json = JSON.parse(body);
            expect(json).to.haveOwnProperty('id');
            expect(json).to.haveOwnProperty('email');
            expect(json.email).to.equal(email);
          }
          done();
        });
      }
    });
  });

  it('test the GET /users/me endpoint with no token', function(done) {
    request.get(baseUrl.concat('/users/me'), (err, res, body) => {
      if (!err) {
        expect(res.statusCode).to.equal(401);
        const json = JSON.parse(body);
        expect(json).to.haveOwnProperty('error');
        expect(json.error).to.equal('Unauthorized');
      }
      done();
    });
  });

  it('test the GET /users/me endpoint with an invalid token', function(done) {
    const options = {
      headers: {
        'X-Token': 'an_invalid_token',
      },
    };
    request.get(baseUrl.concat('/users/me'), options, (err, res, body) => {
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
