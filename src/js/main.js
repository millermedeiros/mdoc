/**
 * mdoc : markdown documentation generator
 * @author Miller Medeiros
 * @version 0.1.0 (2011/11/27)
 */

var writter = require('./writter');

exports.run = function (opts) {
    writter.processFiles(opts);
};
