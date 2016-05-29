var Cropper = require('cropper');
var path = require('path');
var fs = require('fs');
var os = require('os');
var parseOptions = require('./lib/parseOptions.js');

var allowedParams = ['w', 'h', 't', 'm', 's', 'f'];

var defaults = {
    onSuccess: function (filePath, response) {
        response.writeHead(200, {
            'Content-Type' : 'image/jpeg'
        });

        fs.createReadStream(filePath).pipe(response);

        return response;
    },
    on404: function (response) {
        return response.status(404).send('Not found');
    },
    on500: function (response) {
        return response.status(404).send('Not found');
    },
    ImageMagickPath: 'convert'
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

    return function (request, response) {
        var _, optionsString, options, sourcePath, sourceName, targetFullDir, targetPath, width, height;
        [_, optionsString, sourceName] = request.url.split('/');

        targetFullDir = path.normalize(targetDir + '/' + optionsString);
        targetPath = path.normalize(targetFullDir + '/' + sourceName);

        // check if file was previously created
        if (fs.existsSync(targetPath)) {
            return config.onSuccess.call(this, targetPath, response);
        }

        sourcePath = path.normalize(sourceDir + '/' + sourceName);

        // check if source file exists
        if (!fs.existsSync(sourcePath)) {
            return config.on404.call(this, response);
        }

        try {
            options = parseOptions(optionsString, allowedParams);
        } catch (e) {
            return config.on404.call(this, response);
        }

        if (!fs.existsSync(targetFullDir)) {
            fs.mkdirSync(targetFullDir);
        }

        width = options.w && options.w[0] ? options.w[0] : 0;
        height = options.h && options.h[0] ? options.h[0] : 0;

        // either width or height has to be defined
        if (!width && !height) {
            return config.on404.call(this, response);
        }

        var cropper = (new Cropper())
                .setIMPath(config.ImageMagickPath)
                .setSource(sourcePath)
                .setTarget(targetPath)
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
        cropper.commit()
            .then(filePath => {
                config.onSuccess.call(this, filePath, response);
            }).catch(error => {
                config.on500.call(this, response);
            });
    }
};