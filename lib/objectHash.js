var hash = require('object-hash');

module.exports = function (obj, length) {
    length = Number(length);
    length = (!isNaN(length) && length) || 8;

    return hash(obj).slice(0, length);
};