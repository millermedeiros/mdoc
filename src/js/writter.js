
var handlebars = require('handlebars'),
    fs = require('fs'),
    path = require('path'),
    wrench = require('wrench'),
    parser = require('./parser'),
    pathProcessor = require('./pathProcessor');


// ---


var DEFAULT_INCLUDE = '*.mdown,*.md,*.markdown',
    DEFAULT_PAGE_TITLE = 'Documentation';


// ---

var _baseTemplatePath,
    _docTemplate,
    _sidebarTemplate,
    _indexTemplate;

function compileTemplate(name){
    var tmp = path.normalize(_baseTemplatePath +'/'+ name +'.hbs');
    return handlebars.compile(fs.readFileSync(tmp, 'utf-8'));
}


function compileAllTemplates(config){
    _baseTemplatePath = config.templatePath || __dirname +'/../template';

    handlebars.registerPartial('header', compileTemplate('header'));
    handlebars.registerPartial('footer', compileTemplate('footer'));

    _docTemplate = compileTemplate('doc');
    _sidebarTemplate = compileTemplate('sidebar');
    _indexTemplate = compileTemplate('index');
}


// ---


exports.processFiles = function(config){
    console.log('  Converting files...');

    compileAllTemplates(config);

    var toc = processDoc(config),
        outputDir = config.outputDir;

    console.log('  Generating Sidebar...');
    fs.writeFileSync(path.join(outputDir, 'sidebar_.html'), _sidebarTemplate({
        modules : toc
    }), 'utf-8');

    console.log('  Generating Index...');
    fs.writeFileSync(path.join(outputDir, 'index.html'), _indexTemplate({
        modules : toc,
        page_title : config.baseTitle || DEFAULT_PAGE_TITLE,
        content : getIndexContent(config)
    }), 'utf-8');

    console.log('  Copying Assets...');
    var assetsPath = config.assetsPath || path.normalize(_baseTemplatePath +'/assets_');
    wrench.copyDirSyncRecursive(assetsPath, path.join(outputDir, 'assets_/'));

    console.log('  Finished.');
};


function processDoc(config){

    var toc = [];

    getFilesInfos(config).forEach(function(fileInfo){

        if (config.mapOutName) {
            fileInfo.output = config.mapOutName(fileInfo.output);
        }

        pathProcessor.processFile(fileInfo, function(content){
            var parseResult = parser.parseDoc(content, config.headingLevel),
                fileName = fileInfo.output.replace(config.outputDir, '').replace(/^\//, ''),
                moduleName = config.mapTocName? config.mapTocName(fileName, parseResult.toc) : fileName.replace('.html', '');

            toc.push({
                'file' : fileName,
                'module' : moduleName,
                'toc' : parseResult.toc
            });

            var relativeRoot = path.relative( fileInfo.output.replace(/\/[^\/]+$/, '/'), config.outputDir );

            return _docTemplate({
                root_path : relativeRoot? relativeRoot +'/' : '',
                content : parseResult.html,
                page_title : parseResult.title +' : '+ (config.baseTitle || DEFAULT_PAGE_TITLE)
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
    return config.indexContent || '';
}
