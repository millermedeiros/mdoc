
var handlebars = require('handlebars'),
    fs = require('fs'),
    path = require('path'),
    wrench = require('wrench'),
    parser = require('./parser'),
    pathProcessor = require('./pathProcessor');


// ---


var DEFAULT_INCLUDE = '*.mdown,*.md,*.markdown';


// ---


function compileTemplate(name){
    var tmp = path.normalize(__dirname +'/../template/'+ name +'.template');
    return handlebars.compile(fs.readFileSync(tmp, 'utf-8'));
}

handlebars.registerPartial('header', compileTemplate('header'));
handlebars.registerPartial('footer', compileTemplate('footer'));


// ---



var _docTemplate = compileTemplate('doc'),
    _sidebarTemplate = compileTemplate('sidebar'),
    _indexTemplate = compileTemplate('index');



exports.processFiles = function(config){
    console.log('  Converting files...');
    var toc = processDoc(config),
        outputDir = config.outputDir;

    console.log('  Generating Sidebar...');
    fs.writeFileSync(path.join(outputDir, 'sidebar_.html'), _sidebarTemplate({
        modules : toc
    }), 'utf-8');

    console.log('  Generating Index...');
    fs.writeFileSync(path.join(outputDir, 'index.html'), _indexTemplate({
        modules : toc,
        page_title : config.baseTitle,
        content : getIndexContent(config)
    }), 'utf-8');

    console.log('  Copying Assets...');
    wrench.copyDirSyncRecursive(path.normalize(__dirname + '/../template/assets_'), path.join(outputDir, 'assets_/') );

    console.log('  Finished.');
};


function processDoc(config){

    var toc = [];

    getFilesInfos(config).forEach(function(fileInfo){

        //use the folder as filename
        if (config.mapOutName) {
            fileInfo.output = config.mapOutName(fileInfo.output);
        }

        pathProcessor.processFile(fileInfo, function(content){
            var parseResult = parser.parseDoc(content),
                fileName = fileInfo.output.replace(config.outputDir, '').replace(/^\//, ''),
                moduleName = config.mapTocName? config.mapTocName(fileName, parseResult.toc) : fileName.replace('.html', '');

            toc.push({
                'file' : fileName,
                'module' : moduleName,
                'toc' : parseResult.toc
            });

            return _docTemplate({
                content : parseResult.html,
                page_title : parseResult.title +' : '+ config.baseTitle
            });
        });
        console.log('  processed: '+ fileInfo.input +' > '+ fileInfo.output);
    });

    return toc;
}


function getFilesInfos(config){
    var files = pathProcessor.getFilesPaths({
            inputDir : config.inputDir,
            outputDir : config.outputDir,
            outputExt : '.html',
            include : config.include || DEFAULT_INCLUDE,
            exclude : config.exclude
        });

    if (config.filterFiles) {
        files = files.filter(config.filterFiles);
    }

    return files;
}


function generateFile(toc, template, outputFile, title){
    var content = template({
        modules : toc,
        page_title : title || ''
    });
    fs.writeFileSync(outputFile, content, 'utf-8');
}

function getIndexContent(config){
    if (config.indexContentPath && !config.indexContent) {
        config.indexContent = parser.parseMdown( fs.readFileSync(config.indexContentPath, 'utf-8') );
    }
    return config.indexContent || ''
}
