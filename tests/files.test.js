import request from 'request';
import { v4 } from 'uuid';
import { describe, it, before } from 'mocha';
import { expect } from 'chai';
import { promisify } from 'util';

const baseUrl = 'http://127.0.0.1:5000';
const email = v4();
const password = 'password';
let token;
let fileId;

describe('FilesController', function() {
  before(async function() {
    const options = {
      json: true,
      body: {
        email,
        password,
      },
    };
    await promisify(request.post).bind(request)(baseUrl.concat('/users'), options);
    const options2 = {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${email}:${password}`).toString('base64')}`,
      },
    };
    const { body } = await promisify(request.get).bind(request)(baseUrl.concat('/connect'), options2);
    token = JSON.parse(body).token;

    const name = v4();
    const options3 = {
      headers: {
        'X-Token': token,
      },
      json: true,
      body: {
        name,
        type: 'file',
        data: Buffer.from('Hello, Webstack!\n').toString('base64'),
      },
    };
    const body2 = (await promisify(request.post).bind(request)(baseUrl.concat('/files'), options3)).body;
    fileId = body2.id;
  });

  it('test the POST /files endpoint with valid data and file', function(done) {
    const name = v4();
    const options = {
      headers: {
        'X-Token': token,
      },
      json: true,
      body: {
        name,
        type: 'file',
        data: Buffer.from('Hello, Webstack!\n').toString('base64'),
      },
    };
    request.get(baseUrl.concat('/stats'), (err, res, body) => {
      if (!err) {
        const numFiles = JSON.parse(body).files;

        request.post(baseUrl.concat('/files'), options, (err, res, body) => {
          if (!err) {
            expect(res.statusCode).to.equal(201);
            expect(body).to.haveOwnProperty('id');
            expect(body).to.haveOwnProperty('userId');
            expect(body).to.haveOwnProperty('name');
            expect(body.name).to.equal(name);
            expect(body).to.haveOwnProperty('type');
            expect(body.type).to.equal('file');
            expect(body).to.haveOwnProperty('isPublic');
            expect(body.isPublic).to.equal(false);
            expect(body).to.haveOwnProperty('parentId');
            expect(body.parentId).to.equal(0);

            request.get(baseUrl.concat('/stats'), (err, res, body) => {
              if (!err) {
                expect(JSON.parse(body).files).to.equal(numFiles + 1);
              }
              done();
            });
          }
        });
      }
    });
  });

  it('test the POST /files endpoint with valid data and image', function(done) {
    const name = v4();
    const options = {
      headers: {
        'X-Token': token,
      },
      json: true,
      body: {
        name,
        type: 'image',
        data: Buffer.from('Hello, Webstack!\n').toString('base64'),
      },
    };
    request.get(baseUrl.concat('/stats'), (err, res, body) => {
      if (!err) {
        const numFiles = JSON.parse(body).files;

        request.post(baseUrl.concat('/files'), options, (err, res, body) => {
          if (!err) {
            expect(res.statusCode).to.equal(201);
            expect(body).to.haveOwnProperty('id');
            expect(body).to.haveOwnProperty('userId');
            expect(body).to.haveOwnProperty('name');
            expect(body.name).to.equal(name);
            expect(body).to.haveOwnProperty('type');
            expect(body.type).to.equal('image');
            expect(body).to.haveOwnProperty('isPublic');
            expect(body.isPublic).to.equal(false);
            expect(body).to.haveOwnProperty('parentId');
            expect(body.parentId).to.equal(0);

            request.get(baseUrl.concat('/stats'), (err, res, body) => {
              if (!err) {
                expect(JSON.parse(body).files).to.equal(numFiles + 1);
              }
              done();
            });
          }
        });
      }
    });
  });

  it('test the POST /files endpoint with valid data and folder', function(done) {
    const name = v4();
    const options = {
      headers: {
        'X-Token': token,
      },
      json: true,
      body: {
        name,
        type: 'folder',
      },
    };
    request.get(baseUrl.concat('/stats'), (err, res, body) => {
      if (!err) {
        const numFiles = JSON.parse(body).files;

        request.post(baseUrl.concat('/files'), options, (err, res, body) => {
          if (!err) {
            expect(res.statusCode).to.equal(201);
            expect(body).to.haveOwnProperty('id');
            expect(body).to.haveOwnProperty('userId');
            expect(body).to.haveOwnProperty('name');
            expect(body.name).to.equal(name);
            expect(body).to.haveOwnProperty('type');
            expect(body.type).to.equal('folder');
            expect(body).to.haveOwnProperty('isPublic');
            expect(body.isPublic).to.equal(false);
            expect(body).to.haveOwnProperty('parentId');
            expect(body.parentId).to.equal(0);

            request.get(baseUrl.concat('/stats'), (err, res, body) => {
              if (!err) {
                expect(JSON.parse(body).files).to.equal(numFiles + 1);
              }
              done();
            });
          }
        });
      }
    });
  });

  it('test the POST /files endpoint without providing name', function(done) {
    const options = {
      headers: {
        'X-Token': token,
      },
      json: true,
      body: {
        type: 'file',
        data: Buffer.from('Hello, Webstack!\n').toString('base64'),
      },
    };

    request.post(baseUrl.concat('/files'), options, (err, res, body) => {
      if (!err) {
        expect(res.statusCode).to.equal(400);
        expect(body).to.haveOwnProperty('error');
        expect(body.error).to.equal('Missing name');
      }
      done();
    });
  });

  it('test the POST /files endpoint without providing type', function(done) {
    const name = v4();
    const options = {
      headers: {
        'X-Token': token,
      },
      json: true,
      body: {
        name,
        data: Buffer.from('Hello, Webstack!\n').toString('base64'),
      },
    };

    request.post(baseUrl.concat('/files'), options, (err, res, body) => {
      if (!err) {
        expect(res.statusCode).to.equal(400);
        expect(body).to.haveOwnProperty('error');
        expect(body.error).to.equal('Missing type');
      }
      done();
    });
  });

  it('test the POST /files endpoint without providing data', function(done) {
    const name = v4();
    const options = {
      headers: {
        'X-Token': token,
      },
      json: true,
      body: {
        name,
        type: 'file',
      },
    };

    request.post(baseUrl.concat('/files'), options, (err, res, body) => {
      if (!err) {
        expect(res.statusCode).to.equal(400);
        expect(body).to.haveOwnProperty('error');
        expect(body.error).to.equal('Missing data');
      }
      done();
    });
  });

  it('test the POST /files endpoint with invalid parentId', function(done) {
    const name = v4();
    const options = {
      headers: {
        'X-Token': token,
      },
      json: true,
      body: {
        name,
        type: 'file',
        data: Buffer.from('Hello, Webstack!\n').toString('base64'),
        parentId: '000000000000000000000000',
      },
    };

    request.post(baseUrl.concat('/files'), options, (err, res, body) => {
      if (!err) {
        expect(res.statusCode).to.equal(400);
        expect(body).to.haveOwnProperty('error');
        expect(body.error).to.equal('Parent not found');
      }
      done();
    });
  });

  it('test the POST /files endpoint with parentId of a file', function(done) {
    const name = v4();
    const options = {
      headers: {
        'X-Token': token,
      },
      json: true,
      body: {
        name,
        type: 'file',
        data: Buffer.from('Hello, Webstack!\n').toString('base64'),
        parentId: fileId,
      },
    };

    request.post(baseUrl.concat('/files'), options, (err, res, body) => {
      if (!err) {
        expect(res.statusCode).to.equal(400);
        expect(body).to.haveOwnProperty('error');
        expect(body.error).to.equal('Parent is not a folder');
      }
      done();
    });
  });

  it('test the GET /files/:id endpoint with a valid file id', function(done) {
    const options = {
      headers: {
        'X-Token': token,
      },
    };
    request.get(baseUrl.concat(`/files/${fileId}`), options, (err, res, body) => {
      if (!err) {
        const json = JSON.parse(body);
        expect(res.statusCode).to.equal(200);
        expect(json).to.haveOwnProperty('id');
        expect(json.id).to.equal(fileId);
        expect(json).to.haveOwnProperty('userId');
        expect(json).to.haveOwnProperty('name');
        expect(json).to.haveOwnProperty('type');
        expect(json.type).to.equal('file');
        expect(json).to.haveOwnProperty('isPublic');
        expect(json.isPublic).to.equal(false);
        expect(json).to.haveOwnProperty('parentId');
        expect(json.parentId).to.equal(0);
      }
      done();
    });
  });

  it('test the GET /files/:id endpoint with out a token', function(done) {
    request.get(baseUrl.concat(`/files/${fileId}`), (err, res, body) => {
      if (!err) {
        const json = JSON.parse(body);
        expect(res.statusCode).to.equal(401);
        expect(json).to.haveOwnProperty('error');
        expect(json.error).to.equal('Unauthorized');;
      }
      done();
    });
  });

  it('test the GET /files/:id endpoint with an invalid file id', function(done) {
    const options = {
      headers: {
        'X-Token': token,
      },
    };
    request.get(baseUrl.concat(`/files/000000000000000000000000`), options, (err, res, body) => {
      if (!err) {
        const json = JSON.parse(body);
        expect(res.statusCode).to.equal(404);
        expect(json).to.haveOwnProperty('error');
        expect(json.error).to.equal('Not found');
      }
      done();
    });
  });

  it('test the GET /files endpoint with default parameters', function(done) {
    const options = {
      headers: {
        'X-Token': token,
      },
    };
    request.get(baseUrl.concat('/files'), options, (err, res, body) => {
      if (!err) {
        expect(res.statusCode).to.equal(200);
        const json = JSON.parse(body);
        expect(json.length).to.be.lte(20);
        for(const file of json) {
          expect(file).to.haveOwnProperty('id');
          expect(file).to.haveOwnProperty('userId');
          expect(file).to.haveOwnProperty('name');
          expect(file).to.haveOwnProperty('type');
          expect(file).to.haveOwnProperty('isPublic');
          expect(file).to.haveOwnProperty('parentId');
        }
      }
      done();
    });
  });

  it('test the GET /files endpoint with custom parameters', function(done) {
    const options = {
      headers: {
        'X-Token': token,
      },
    };
    request.get(baseUrl.concat('/files?parentId=0&page=1'), options, (err, res, body) => {
      if (!err) {
        expect(res.statusCode).to.equal(200);
        const json = JSON.parse(body);
        expect(json.length).to.be.lte(20);
        for(const file of json) {
          expect(file).to.haveOwnProperty('id');
          expect(file).to.haveOwnProperty('userId');
          expect(file).to.haveOwnProperty('name');
          expect(file).to.haveOwnProperty('type');
          expect(file).to.haveOwnProperty('isPublic');
          expect(file).to.haveOwnProperty('parentId');
          expect(file.parentId).to.equal(0);
        }
      }
      done();
    });
  });

  it('test the GET /files endpoint with no token', function(done) {
    request.get(baseUrl.concat('/files'), (err, res, body) => {
      if (!err) {
        expect(res.statusCode).to.equal(401);
        const json = JSON.parse(body);
        expect(json).to.haveOwnProperty('error');
        expect(json.error).to.equal('Unauthorized');
      }
      done();
    });
  });

  it('test the PUT /files/:id/publish endpoint with valid parameters', function(done) {
    const options = {
      headers: {
        'X-Token': token,
      },
    };

    request.put(baseUrl.concat(`/files/${fileId}/unpublish`), options, (err, res, body) => {
      if (!err) {
        const isPublic = JSON.parse(body).isPublic;

        request.put(baseUrl.concat(`/files/${fileId}/publish`), options, (err, res, body) => {
          if (!err) {
            expect(res.statusCode).to.equal(200);

            const json = JSON.parse(body);
            expect(json).to.haveOwnProperty('isPublic');
            expect(json.isPublic).to.not.equal(isPublic);
          }
          done();
        });
      }
    });
  });

  it('test the PUT /files/:id/publish endpoint with invalid file id', function(done) {
    const options = {
      headers: {
        'X-Token': token,
      },
    };

    request.put(baseUrl.concat(`/files/000000000000000000000000/publish`), options, (err, res, body) => {
      if (!err) {
        expect(res.statusCode).to.equal(404);

        const json = JSON.parse(body);
        expect(json).to.haveOwnProperty('error');
        expect(json.error).to.equal('Not found');
      }
      done();
    });
  });

  it('test the PUT /files/:id/unpublish endpoint with valid parameters', function(done) {
    const options = {
      headers: {
        'X-Token': token,
      },
    };

    request.put(baseUrl.concat(`/files/${fileId}/publish`), options, (err, res, body) => {
      if (!err) {
        const isPublic = JSON.parse(body).isPublic;

        request.put(baseUrl.concat(`/files/${fileId}/unpublish`), options, (err, res, body) => {
          if (!err) {
            expect(res.statusCode).to.equal(200);

            const json = JSON.parse(body);
            expect(json).to.haveOwnProperty('isPublic');
            expect(json.isPublic).to.not.equal(isPublic);
          }
          done();
        });
      }
    });
  });

  it('test the PUT /files/:id/unpublish endpoint with invalid file id', function(done) {
    const options = {
      headers: {
        'X-Token': token,
      },
    };

    request.put(baseUrl.concat(`/files/000000000000000000000000/unpublish`), options, (err, res, body) => {
      if (!err) {
        expect(res.statusCode).to.equal(404);

        const json = JSON.parse(body);
        expect(json).to.haveOwnProperty('error');
        expect(json.error).to.equal('Not found');
      }
      done();
    });
  });

  it('test the GET /files/:id/data endpoint with file owner', function(done) {
    const options = {
      headers: {
        'X-Token': token,
      },
    };
    request.get(baseUrl.concat(`/files/${fileId}/data`), options, (err, res, body) => {
      if (!err) {
        expect(res.statusCode).to.equal(200);

        const data = Buffer.from(body).toString('utf8');
        expect(data).to.equal('Hello, Webstack!\n');
      }
      done();
    });
  });

  it('test the GET /files/:id/data endpoint with no token', function(done) {
    request.get(baseUrl.concat(`/files/${fileId}/data`), (err, res, body) => {
      if (!err) {
        expect(res.statusCode).to.equal(404);

        const json = JSON.parse(body);
        expect(json).to.haveOwnProperty('error');
        expect(json.error).to.equal('Not found');
      }
      done();
    });
  });

  it('test the GET /files/:id/data endpoint with public file and no token', function(done) {
    const options = {
      headers: {
        'X-Token': token,
      },
    };
    request.put(baseUrl.concat(`/files/${fileId}/publish`), options, (err, res, body) => {
      if (!err) {
        request.get(baseUrl.concat(`/files/${fileId}/data`), (err, res, body) => {
          if (!err) {
            expect(res.statusCode).to.equal(200);
    
            const data = Buffer.from(body).toString('utf8');
            expect(data).to.equal('Hello, Webstack!\n');
          }
          done();
        });
      }
    });
  });
});
