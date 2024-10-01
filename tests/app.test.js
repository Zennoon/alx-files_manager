import request from 'request';
import { describe, it } from 'mocha';
import { expect } from 'chai';

const baseUrl = 'http://localhost:5000';

describe('appController', function() {
  it('test for the GET /status endpoint', function(done) {
    request.get(baseUrl.concat('/status'), function(err, res) {
      if (!err) {
        expect(res.statusCode).to.equal(200);
        expect(res.headers['content-type']).to.include('application/json');

        const json = JSON.parse(res.body);
        expect(json).to.haveOwnProperty('redis');
        expect(json.redis).to.equal(true || false);
        expect(json).to.haveOwnProperty('db');
        expect(json.db).to.equal(true || false);
      }
      done();
    });
  });

  it('test for the GET /stats endpoint', function(done) {
    request.get(baseUrl.concat('/stats'), function(err, res) {
      if (!err) {
        expect(res.statusCode).to.equal(200);
        expect(res.headers['content-type']).to.include('application/json');

        const json = JSON.parse(res.body);
        expect(json).to.haveOwnProperty('users');
        expect(json.users).to.be.a('Number');
        expect(json).to.haveOwnProperty('files');
        expect(json.files).to.be.a('Number');
      }
      done();
    });
  });
});
