
var showdown = require('showdown');

var Parser = function(config) {
    this.config = config;
    this.headingLevel = config.headingLevel || 2;
    if (config.parsingFunction) {
        this.parseMdown = config.parsingFunction;
    } else {
        var converter = new showdown.Converter();
        this.parseMdown = converter.makeHtml.bind(converter);
    }
}

Parser.prototype.parseDoc = function(mdown){
    mdown = this.normalizeLineBreaks(mdown);
    mdown = this.convertCodeBlocks(mdown);

    var toc = this.getTocData(mdown);

    return {
        toc : toc,
        html :  this.parseContent(mdown, toc),
        title : this.getTitle(mdown)
    };
};

Parser.prototype.wrapCode = function(str, p1, p2){
    return p1? '<pre class="brush:'+p1+'">'+p2+'</pre>' : '<pre>'+p2+'</pre>';
}

Parser.prototype.convertCodeBlocks = function(mdown){
    // showdown have issues with github style code blocks..
    var re = /^```\s*(\w+)\s*$([\s\S]*?)^```$/gm;
    return mdown.replace(re, this.wrapCode);
}

Parser.prototype.normalizeLineBreaks = function(str, lineEnd) {
    lineEnd = lineEnd || '\n';
    return str
        .replace(/\r\n/g, lineEnd) // DOS
        .replace(/\r/g, lineEnd) // Mac
        .replace(/\n/g, lineEnd); // Unix
}


Parser.prototype.getTocData = function(mdown){

    var matchTitle,
        matchName,
        rH = this.getHeaderRegExp(),
        rName = /([^\(#:%\?!,]+)(\(?)[^\)]*(\)?):?.*/,
        toc = [];

    while (matchTitle = rH.exec(mdown)) {
        matchName = rName.exec(matchTitle[1]);
        toc.push({
           href : matchName[1],
           title : matchTitle[1].replace(/\\/g, ''),
           name : (matchName.slice(1,4).join('')),
           description : this.getDescription(mdown, rH.lastIndex)
        });
    }

    return toc;
}

Parser.prototype.getHeaderRegExp = function(level){
    return new RegExp('^'+ this.getHeaderHashes(level) +'\\s*([^#\\n\\r]+)[# \t]*$', 'gm');
}

Parser.prototype.getHeaderHashes = function(level){
    level = level != null? level : this.headingLevel;
    return (new Array(level + 1)).join('#');
}

Parser.prototype.getDescription = function(mdown, fromIndex) {
    var desc = mdown.substr(fromIndex);
    desc = desc.replace(/^\n+/g, '').split(/\n\n/)[0]; //first paragraph

    //check if line starts with a header, hr or code block. fixes #10
    if ((/^(?:(?:[#=]+)|(?:[\-`\=]{3,})|(?: {4,}))/).test(desc)) {
        return null;
    }

    desc = this.parseMdown(desc.replace(/\n+/, ' '))
                    .replace(/<\/?p>/g, '') //remove paragraphs
                    .replace(/<\/?a[^>]*>/g, ''); //remove links since it breaks layout
    return desc;
}

Parser.prototype.parseContent = function(mdown, toc){

    // add deep-links

    var i = 0, cur;

    mdown = mdown.replace(this.getHeaderRegExp(), function(str){
        cur = toc[i++];
        return str +' <a href="#'+ cur.href +'" id="'+ cur.href +'" class="deep-link">#</a>';
    });

    // generate TOC

    var tocIndex = mdown.search( new RegExp('^'+ this.getHeaderHashes() +'[^#]+', 'm') ), //first header
        pre = mdown.substring(0, tocIndex),
        post = mdown.substring(tocIndex),
        tocContent = this.getHeaderHashes() +' Table of Contents <a href="#toc" name="toc" class="deep-link">#</a>\n\n';

    toc.forEach(function(val, i){
        tocContent += ' - ['+ val.name +'](#'+ val.href +')\n';
    });

    return this.parseMdown( pre + tocContent + post );
}


Parser.prototype.getTitle = function(mdown){
    var match = this.getHeaderRegExp(this.headingLevel - 1).exec(mdown); //H1
    return match? match[1].trim() : '';
}

module.exports = Parser;
