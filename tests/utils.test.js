import request from 'request';
import { v4 } from 'uuid';
import { describe, it } from 'mocha';
import { expect } from 'chai';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const baseUrl = 'http://127.0.0.1:5000';

describe('dbClient', function() {
  it('test the instance properties', function() {
    expect(dbClient.constructor.prototype).to.haveOwnProperty('client');
    expect(dbClient.constructor.prototype).to.haveOwnProperty('db');
  });

  it('test the isAlive method', function() {
    const res = dbClient.isAlive();

    expect(res).to.be.oneOf([true, false]);
  });

  it('test the nbUsers method', function(done) {
    dbClient.nbUsers().then((numUsers) => {
      const options = {
        json: true,
        body: {
          email: v4(),
          password: 'password',
        },
      };
      request.post(baseUrl.concat('/users'), options, (err) => {
        if (!err) {
          dbClient.nbUsers().then((newNumUsers) => {
            expect(newNumUsers).to.equal(numUsers + 1);
            done();
          });
        }
      });
    });
  });

  it('test the nbFiles method', function(done) {
    dbClient.nbFiles().then((numFiles) => {
      expect(numFiles).to.be.a('Number');
    });
  });
});

describe('redisClient', function() {
  it('test the instance properties', function() {
    expect(redisClient.constructor.prototype).to.haveOwnProperty('client');
  });

  it('test the isAlive method', function() {
    const res = redisClient.isAlive();

    expect(res).to.be.oneOf([true, false]);
  });

  it('test the get method', function(done) {
    const val = 100;
    redisClient.set('test_val', val, 60).then(() => {
      redisClient.get('test_val').then((resVal) => {
        expect(resVal).to.equal(val);
        done();
      });
    });
  });

  it('test the set method', function(done) {
    const val = 100;
    redisClient.set('test_val', val, 60).then(() => {
      redisClient.get('test_val').then((resVal) => {
        expect(resVal).to.equal(val);
        done();
      });
    });
  });
});
