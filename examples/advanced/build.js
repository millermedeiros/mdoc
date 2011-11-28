//
// This file contains all available settings.
//

var mdoc = require('mdoc');

mdoc.run({

    // === required settings === //

    inputDir : '../basic/content',
    outputDir : 'doc',


    // === basic settings === //

    baseTitle : 'mdoc example advanced settings',
    //indexContentPath : '../basic/index.mdown',


    // === advanced settings === //

    templatePath : 'custom_template',

    //indexContent will take precedence over `indexContentPath`
    indexContent : '<h1>Custom Template</h1><p>Example of a custom template and advanced settings.</p>',

    mapOutName : function(outputName) {
        //change file output name
        return outputName.replace('.html', '_doc.html');
    },

    mapTocName : function(fileName, tocObject){
        //change the name displayed on the sidebar and on the index TOC
        return fileName.replace('_doc.html', '');
    },

    // pattern that matches files that should be parsed
    // this is the default value...
    include : '*.mdown,*.md,*.markdown',

    // pattern that matches files that shouldn't be parsed
    exclude : 'array.*',

    filterFiles : function(fileInfo) {
        // return `false` to remove files and `true` to keep them
        return (/math/).test(fileInfo.input);
    }

});
