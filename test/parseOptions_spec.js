var parseOptions = require('../lib/parseOptions.js');
var assert = require('chai').assert;
var expect = require('chai').expect;

console.log(expect);

describe('parseOptions', () => {
    it ('Should parse options', function () {
        var optionsString = 'w150-h150-tput_out-fgs';
        var options = parseOptions(optionsString);

        assert.deepEqual(
            options,
            { w: ["150"], h: ["150"], t: ['put_out'], f: ['gs'] }
        );
    });

    it ('Should parse multiple filters', function () {
        var optionsString = 'w150-h150-tput_out-fgs-ff1-ff2-ff3';
        var options = parseOptions(optionsString);

        assert.deepEqual(
            options,
            { w: ["150"], h: ["150"], t: ['put_out'], f: ['gs', 'f1', 'f2', 'f3'] }
        );
    });

    it ('Should throw error if option that is not allowed is passed', function () {
        assert.throws(function () {
            parseOptions('ab-cd', ['a']);
        }, Error, 'Unexpected param');
    });
});