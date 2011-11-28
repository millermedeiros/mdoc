
var mdoc = require('mdoc');

mdoc.run({

    // === required settings === //

    inputDir : 'content',
    outputDir : 'doc',

    // === optional settings === //

    baseTitle : 'mdoc example',
    indexContentPath : 'index.mdown'

});
