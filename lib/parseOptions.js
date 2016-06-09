/**
 * @param optionsString
 * @param allowedParams
 * @returns {Array|*}
 * @throws error
 *
 * Convert options from string into object:
 * "w150-h150-tput_out-fgs"
 * becomes
 * {
 *      w: ['150'],
 *      h: ['150'],
 *      t: ['put_out'],
 *      f: ['gs']
 * }
 */
module.exports = function parseOptions(optionsString, allowedParams) {
    return optionsString.split('-').reduce((carry, item) => {
        var key = item[0];

        // check if key is good
        if (allowedParams && allowedParams.indexOf(key) === -1) {
            throw new Error('Unexpected param');
        }

        if (!carry[key]) {
            carry[key] = [];
        }

        carry[key].push(item.slice(1));
        return carry;
    }, {});
};