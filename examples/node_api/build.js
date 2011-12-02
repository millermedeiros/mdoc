
var mdoc = require('mdoc');

mdoc.run({

    // === required settings === //

    inputDir : 'api',
    outputDir : 'doc',

    // === optional settings === //

    indexContentPath : 'index.mdown',
    assetsPath : 'custom_assets',
    baseTitle : 'nodejs API',
    headingLevel : 3 // sets which heading should be treated as a section start (and is used for TOC) defaults to `2`

});
