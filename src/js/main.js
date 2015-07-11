/**
 * mdoc : markdown documentation generator
 * @author Miller Medeiros
 */

var Writter = require('./writter');

exports.run = function (opts) {
	var writter = new Writter(opts);
    writter.processFiles();
};
