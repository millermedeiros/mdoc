
var handlebars = require('handlebars'),
    fs = require('fs'),
    path = require('path'),
    wrench = require('wrench'),
    Parser = require('./parser'),
    pathProcessor = require('./pathProcessor');


// ---


var DEFAULT_INCLUDE = '*.mdown,*.md,*.markdown',
    DEFAULT_PAGE_TITLE = 'Documentation';


var Writter = function(config) {
    this.config = config;
    this.parser = new Parser(this.config);
}

Writter.prototype.compileTemplate = function(name){
    var tmp = path.normalize(this.baseTemplatePath +'/'+ name +'.hbs');
    return handlebars.compile(fs.readFileSync(tmp, 'utf-8'));
}

Writter.prototype.compileAllTemplates = function(){
    this.baseTemplatePath = this.config.templatePath || __dirname +'/../template';

    var key, helpers = this.config.hbHelpers;
    for (key in helpers){
      if (helpers.hasOwnProperty(key)){
        handlebars.registerHelper(key, helpers[key]);
      }
    }

    handlebars.registerPartial('header', this.compileTemplate('header'));
    handlebars.registerPartial('footer', this.compileTemplate('footer'));

    this.docTemplate = this.compileTemplate('doc');
    this.sidebarTemplate = this.compileTemplate('sidebar');
    this.indexTemplate = this.compileTemplate('index');
}

Writter.prototype.processFiles = function(){
    console.log('  Converting files...');

    this.compileAllTemplates(this.config);

    var toc = this.processDoc(this.config),
        outputDir = this.config.outputDir;

    console.log('  Generating Sidebar...');
    fs.writeFileSync(path.join(outputDir, 'sidebar_.html'), this.sidebarTemplate({
        modules : toc,
        ctx: this.config.ctx || {}
    }), 'utf-8');

    console.log('  Generating Index...');
    fs.writeFileSync(path.join(outputDir, 'index.html'), this.indexTemplate({
        modules : toc,
        page_title : this.config.baseTitle || DEFAULT_PAGE_TITLE,
        content : this.getIndexContent(this.config),
        ctx: this.config.ctx || {}
    }), 'utf-8');

    console.log('  Copying Assets...');
    var assetsPath = this.config.assetsPath || path.normalize(this.baseTemplatePath +'/assets_');
    wrench.copyDirSyncRecursive(assetsPath, path.join(outputDir, 'assets_/'));

    console.log('  Finished.');
};

Writter.prototype.processDoc = function(){
    var toc = [];
    var self = this;

    this.getFilesInfos(this.config).forEach(function(fileInfo){

        if (self.config.mapOutName) {
            fileInfo.output = self.config.mapOutName(fileInfo.output);
        }

        pathProcessor.processFile(fileInfo, function(content){
            var parseResult = self.parser.parseDoc(content, self.config.headingLevel),
                fileName = fileInfo.output.replace(self.config.outputDir, '').replace(/^[\/\\]/, ''),
                moduleName = self.config.mapTocName? self.config.mapTocName(fileName, parseResult.toc, parseResult.title) : fileName.replace('.html', '');

            toc.push({
                'file' : fileName,
                'module' : moduleName,
                'toc' : parseResult.toc
            });

            var relativeRoot = path.relative( fileInfo.output.replace(/[\/\\][^\/\\]+$/, '/'), self.config.outputDir );

            return self.docTemplate({
                root_path : relativeRoot? relativeRoot +'/' : '',
                content : handlebars.compile(parseResult.html)({ctx: self.config.ctx}),
                page_title : parseResult.title +' : '+ (self.config.baseTitle || DEFAULT_PAGE_TITLE),
                ctx: self.config.ctx || {}
            });
        });
        console.log('  processed: '+ fileInfo.input +' > '+ fileInfo.output);
    });

    return toc;
}

Writter.prototype.getFilesInfos = function(){
    var files = pathProcessor.getFilesPaths({
            inputDir : this.config.inputDir,
            outputDir : this.config.outputDir,
            outputExt : '.html',
            include : this.config.include || DEFAULT_INCLUDE,
            exclude : this.config.exclude
        });

    if (this.config.filterFiles) {
        files = files.filter(this.config.filterFiles);
    }

    return files;
}

Writter.prototype.generateFile = function(toc, template, outputFile, title){
    var content = template({
        modules : toc,
        page_title : title || ''
    });
    fs.writeFileSync(outputFile, content, 'utf-8');
}

Writter.prototype.getIndexContent = function(){
    if (this.config.indexContentPath && !this.config.indexContent) {
        this.config.indexContent = handlebars.compile(this.parser.parseMdown( fs.readFileSync(this.config.indexContentPath, 'utf-8') ))({ctx: this.config.ctx});
    }
    return this.config.indexContent || '';
}

module.exports = Writter;