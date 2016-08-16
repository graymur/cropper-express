var assert = require('chai').assert;
var factory = require('../lib/generateUrl.js').getGenerator;
var generateUrl = require('../lib/generateUrl.js').generateUrl;
var nodeUrl = require('url');

window = {
    location: {
        protocol: 'http:',
        host: 'graymur.net'
    }
};

var generator = factory('resize', {
    full: true
});

describe('generateUrl', function() {
    it ('Generate simple url', function() {
        var url = generateUrl('/path/img.jpg', {w: 150, h: 150}, 'resize');
        assert.equal(url, 'resize/w150-h150/path/img.jpg');
    });

    it ('Generate url with array', function() {
        var url = generateUrl('/path/img.jpg', {w: 150, h: 150, f: ['f1', 'f2', 'f3']}, 'resize');
        assert.equal(url, 'resize/w150-h150-ff1-ff2-ff3/path/img.jpg');
    });

    it ('Generate full url with factory created function', function() {
        var url = generator('/path/img.jpg', {w: 150, h: 150, f: ['f1', 'f2', 'f3']});
        assert.equal(url, 'http://graymur.net/resize/w150-h150-ff1-ff2-ff3/path/img.jpg');
    });

    it ('Generate anti spam hash', function() {
        var url = generateUrl('/path/img.jpg', {w: 150, h: 150, f: ['f1', 'f2', 'f3']}, 'resize', { security: true });
        assert.equal(nodeUrl.parse(url).query.length, 8);
    });
});
