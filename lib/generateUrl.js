var objectHash = require('./objectHash.js');

/**
 * Generate preview url from given options:
 *
 * generateUrl('some/path/img.jpg', {'w': 150, 'h': 150 }, 'resize') returns
 * 'resize/w150-h150/some/path/img.jpg'
 *
 * @param path - path to image file to be resized, relative to public root
 * @param options - preview options
 * @param previewsBase - directory where previews will be stored, relative to public root, e.g. 'resize' or 'uploads/resize'
 * @param config
 * @returns {*}
 */
function generateUrl(path, options, previewsBase, config) {
    previewsBase = previewsBase || '';
    options = options || {};
    config = config || {};

    var chunks = [], url;

    for (var i in options) {
        if (!options.hasOwnProperty(i)) continue;

        if (Object.prototype.toString.call(options[i]) !== '[object Array]') {
            options[i] = [String(options[i])];
        }

        options[i].forEach(function (item) {
            chunks.push(i[0] + '' + item);
        });
    }

    url = cleanupSlashes(previewsBase + '/' + chunks.join('-') + '/' + path);

    if (config.security) {
        url += '?' + objectHash(options, 8);
    }

    if (config.full && window) {
        url = window.location.protocol + '//' + window.location.host + '/' + url;
    }

    return url;
}

/**
 * Return partially applied generateUrl, so you don't have to pass all options each time
 * var generator = getGenerator('resize', { full: true });
 * generator('some/path/img.jpg', {'w': 150, 'h': 150 }) returns
 * 'http://{domain}/resize/w150-h150/some/path/img.jpg'
 *
 * @param previewsBase - directory where previews will be stored, relative to public root, e.g. 'resize' or 'uploads/resize'
 * @param config
 * @returns {Function}
 */
function getGenerator(previewsBase, config) {
    previewsBase = cleanupSlashes(previewsBase);

    return function (path, options) {
        return generateUrl.call(null, path, options, previewsBase, config);
    }
}

/**
 * Remove trailing and double slashes
 * @param path
 * @returns {string}
 */
function cleanupSlashes(path) {
    return path.toString().split('/').filter(function (item) {
        return item.length > 0
    }).join('/');
}

module.exports = {
    generateUrl: generateUrl,
    getGenerator: getGenerator
};
