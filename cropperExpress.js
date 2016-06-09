var Cropper = require('cropper');
var path = require('path');
var fs = require('fs');
var os = require('os');
var mime = require('mime');
var parseOptions = require('./lib/parseOptions.js');
var objectHash = require('./lib/objectHash.js');
var nodeUrl = require('url');

var allowedParams = ['w', 'h', 't', 'm', 's', 'f'];

var defaults = {
    onSuccess: function (filePath, response, mimeType) {
        response.writeHead(200, { 'Content-Type': mimeType });

        fs.createReadStream(filePath).pipe(response);

        return response;
    },
    on404: function (request, response, next, error) {
        return response.status(404).send('Not found');
    },
    on500: function (request, response, next, error) {
        return response.status(404).send('Not found');
    },
    ImageMagickPath: 'convert',
    quality: 100,
    security: false
};

module.exports = function CropperExpressMiddleware(config) {
    config = Object.assign({}, defaults, config);

    var sourceDir, targetDir;

    if (!config.sourceDir) {
        throw new Error('options.sourceDir is not defined');
    }

    sourceDir = path.normalize(config.sourceDir);

    if (!fs.existsSync(sourceDir)) {
        throw new Error('sourceDir does not exist');
    }

    if (config.targetDir) {
        targetDir = path.normalize(config.targetDir);

        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir);
        }
    } else {
        targetDir = os.tmpdir();
    }

    config.quality = Number(config.quality);

    if (isNaN(config.quality) || config.quality < 1 || config.quality > 100) {
        config.quality = defaults.quality;
    }

    return function (request, response, next) {
        var _, optionsString, options, sourcePath, sourceName, targetFullDir, targetPath, width, height, mimeType, requestUrl;

        requestUrl = nodeUrl.parse(request.url);

        [_, optionsString, sourceName] = requestUrl.pathname.split('/');
        sourcePath = path.normalize(sourceDir + '/' + sourceName);

        targetFullDir = path.normalize(targetDir + '/' + optionsString);
        targetPath = path.normalize(targetFullDir + '/' + sourceName);

        // check if file was previously created
        if (fs.existsSync(targetPath)) {
            return config.onSuccess.call(null, targetPath, response, mime.lookup(targetPath));
        }

        if (config.security) {
            try {
                if (!requestUrl.query) throw new Error('Security hash is empty');
                if (requestUrl.query.length !== 8) throw new Error('Security hash wrong length');

                options = parseOptions(optionsString, allowedParams);

                if (objectHash(options) !== requestUrl.query) throw new Error('Security hash is wrong');
            } catch (e) {
                return config.on404.call(null, response, next, e);
            }
        }

        // check if source file exists
        if (!fs.existsSync(sourcePath)) {
            return config.on404.call(null, response, next);
        }

        try {
            options = parseOptions(optionsString, allowedParams);
        } catch (e) {
            return config.on404.call(null, request, response, next, e);
        }

        mimeType = mime.lookup(sourcePath);

        if (mimeType.indexOf('image') === -1) {
            return config.on404.call(null, request, response, next, new Error('Wrong source mime type'));
        }

        if (!fs.existsSync(targetFullDir)) {
            fs.mkdirSync(targetFullDir);
        }

        width = options.w && options.w[0] ? options.w[0] : 0;
        height = options.h && options.h[0] ? options.h[0] : 0;

        // either width or height has to be defined
        if (!width && !height) {
            return config.on404.call(null, request, response, next);
        }

        var cropper = (new Cropper())
            .setIMPath(config.ImageMagickPath)
            .setSource(sourcePath)
            .setTarget(targetPath)
            .setQuality(config.quality)
        ;

        // apply resize
        switch (options.t && options.t[0])
        {
            case 'square':
                cropper.square(width || height);
                break;

            case 'square_put':
                cropper.putIntoSquare(width);
                break;

            case 'put':
                cropper.putIntoSize(width, height);
                break;

            case 'put_out':
                cropper.cutIntoSize(width, height);
                break;

            default:
                var mode = cropper.RESIZE_PROPORTIONAL, w, h;

                if (!width) {
                    mode = cropper.RESIZE_HEIGHT;
                } else if (!height) {
                    mode = cropper.RESIZE_WIDTH;
                } else {
                    mode = !options.m ? cropper.RESIZE_PROPORTIONAL : options.m
                }

                cropper.resize(width || height, height || width, mode);

                break;
        }

        // apply filters
        (options.f || []).forEach(function (filter) {
            switch (filter) {
                case 'gs':
                    cropper.grayscale();
                    break;
            }
        });

        // execute command end send image
        return cropper.commit()
            .then(filePath => {
                config.onSuccess.call(null, filePath, response, mimeType);
                return filePath;
            }).catch(error => {
                config.on500.call(null, request, response, next, error);
                return error;
            });
    }
};