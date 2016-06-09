var cropperExpress = require('../cropperExpress.js');
var generateUrl = require('../lib/generateUrl.js').generateUrl;
var path = require('path');
var fs = require('fs');

var chai = require('chai');
var spies = require('chai-spies');

var should = chai.should();
var expect = chai.expect;
var assert = chai.assert;

chai.use(spies);

function onSuccess() {}
var onSuccessSpy = chai.spy(onSuccess);

function on404() {}
var on404Spy = chai.spy(on404);

function on500() {}
var on500Spy = chai.spy(on500);

var defaults = {
    sourceDir: path.normalize(__dirname + '/source'),
    targetDir: path.normalize(__dirname + '/target'),
    onSuccess: onSuccessSpy,
    on404: on404Spy,
    on500: on500Spy,
    ImageMagickPath: path.normalize('D:/www/util/ImageMagick/convert.exe')
};

function getMiddleware(options) {
    options = Object.assign({}, defaults, options || {});

    return cropperExpress(options);
}

function getMockRequest(url) {
    return { url : url };
}

var mockResponse = {};

function cleanUp() {
    try {
        fs.unlinkSync(path.normalize(__dirname + '/target/w150/sample.jpg'));
    } catch (e) {}
}

beforeEach(cleanUp);
afterEach(cleanUp);

describe('cropperExpress', function() {
    it('Should throw error if source dir is not defined', function () {
        assert.throws(function () {
            getMiddleware({ sourceDir: null });
        }, Error, 'options.sourceDir is not defined');
    });

    it('Should throw error if source dir does not exists', function () {
        assert.throws(function () {
            getMiddleware({ sourceDir: '/some/fake/path' });
        }, Error, 'sourceDir does not exist');
    });

    it('Should call error 404 handler if source file does not exists', function () {
        var middleware = getMiddleware();
        middleware(getMockRequest('/w150/fakeimage.jpg'));

        on404Spy.should.have.been.called();
    });

    it('Should call error 404 handler if source file is not an image', function () {
        var middleware = getMiddleware();
        middleware(getMockRequest('/w150/textfile.txt'));

        on404Spy.should.have.been.called();
    });

    it('Should call error 500 handler if error occurs during resizing', function (done) {
        var middleware = getMiddleware({ ImageMagickPath: '/some/fake/path' });

        return middleware(getMockRequest('/w150/sample.jpg')).then(function (error) {
            on500Spy.should.have.been.called();
            done();
        });
    });

    it('Should call success handler if all went ok with correct mimeType', function (done) {
        var middleware = getMiddleware();

        return middleware(getMockRequest('/w150/sample.jpg'), mockResponse).then(function (filePath) {
            onSuccessSpy.should.have.been.called.with(filePath, mockResponse, 'image/jpeg');
            done();
        });
    });

    it('Should check antispam hash', function (done) {
        var middleware = getMiddleware({ security: true });
        var url = '/' + generateUrl('sample.jpg', { w: 150 }, '', { security: true });

        return middleware(getMockRequest(url), mockResponse).then(function (filePath) {
            onSuccessSpy.should.have.been.called.with(filePath, mockResponse, 'image/jpeg');
            done();
        });
    });

    it('Should fail if antispam hash is wrong', function () {
        var middleware = getMiddleware({ security: true });
        middleware(getMockRequest('/w150/sample.jpg?fakehash'));

        on404Spy.should.have.been.called();
    });
});