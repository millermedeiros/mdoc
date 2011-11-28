/**
 * mdoc : markdown documentation generator
 * @author Miller Medeiros
 */

var writter = require('./writter');

exports.run = function (opts) {
    writter.processFiles(opts);
};
