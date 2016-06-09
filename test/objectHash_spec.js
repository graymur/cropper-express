//var assert = require('chai').assert;
//var objectHash = require('../lib/objectHash.js');
//
//var obj1 = { w: 150, h: 150 };
//var obj2 = { h: 150, w: 150 };
//var obj3 = { h: 250, w: 250 };
//
//describe('objectHash', function() {
//    it ('Generate hash', function() {
//        assert.equal(objectHash(obj1, 8).length, 8);
//    });
//
//    it ('Generate same hashed with object with keys in different order', function() {
//        assert.equal(objectHash(obj1, 8), objectHash(obj2, 8));
//    });
//
//    it ('Generate different hashes for different object', function() {
//        assert.notEqual(objectHash(obj1, 8), objectHash(obj3, 8));
//    });
//});
