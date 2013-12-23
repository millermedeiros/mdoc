
var showdown = require('./lib/showdown');

var _headingLevel;


exports.parseDoc = function(mdown, headingLevel){
    mdown = normalizeLineBreaks(mdown);
    mdown = convertCodeBlocks(mdown);
    _headingLevel = (headingLevel || 2);

    var toc = getTocData(mdown);

    return {
        toc : toc,
        html :  parseContent(mdown, toc),
        title : getTitle(mdown)
    };
};

exports.parseMdown = function(mdown){
    return showdown.parse(mdown);
};


function wrapCode(str, p1, p2){
    return p1? '<pre class="brush:'+p1+'">'+p2+'</pre>' : '<pre>'+p2+'</pre>';
}

function convertCodeBlocks(mdown){
    // showdown have issues with github style code blocks..
    var re = /^```\s*(\w+)\s*$([\s\S]*?)^```$/gm;
    return mdown.replace(re, wrapCode);
}

function normalizeLineBreaks(str, lineEnd) {
    lineEnd = lineEnd || '\n';
    return str
        .replace(/\r\n/g, lineEnd) // DOS
        .replace(/\r/g, lineEnd) // Mac
        .replace(/\n/g, lineEnd); // Unix
}


function getTocData(mdown){

    var matchTitle,
        matchName,
        rH = getHeaderRegExp(),
        rName = /([^\(#:%\?!,]+)(\(?)[^\)]*(\)?):?.*/,
        toc = [];

    while (matchTitle = rH.exec(mdown)) {
        matchName = rName.exec(matchTitle[1]);
        toc.push({
           href : matchName[1],
           title : matchTitle[1].replace(/\\/g, ''),
           name : (matchName.slice(1,4).join('')),
           description : getDescription(mdown, rH.lastIndex)
        });
    }

    return toc;
}

function getHeaderRegExp(level){
    return new RegExp('^'+ getHeaderHashes(level) +'\\s*([^#\\n\\r]+)[# \t]*$', 'gm');
}

function getHeaderHashes(level){
    level = level != null? level : _headingLevel;
    return (new Array(level + 1)).join('#');
}

function getDescription(mdown, fromIndex) {
    var desc = mdown.substr(fromIndex);
    desc = desc.replace(/^\n+/g, '').split(/\n\n/)[0]; //first paragraph

    //check if line starts with a header, hr or code block. fixes #10
    if ((/^(?:(?:[#=]+)|(?:[\-`\=]{3,})|(?: {4,}))/).test(desc)) {
        return null;
    }

    desc = showdown.parse(desc.replace(/\n+/, ' '))
                    .replace(/<\/?p>/g, '') //remove paragraphs
                    .replace(/<\/?a[^>]*>/g, ''); //remove links since it breaks layout
    return desc;
}

function parseContent(mdown, toc){

    // add deep-links

    var i = 0, cur;

    mdown = mdown.replace(getHeaderRegExp(), function(str){
        cur = toc[i++];
        return str +' <a href="#'+ cur.href +'" id="'+ cur.href +'" class="deep-link">#</a>';
    });

    // generate TOC

    var tocIndex = mdown.search( new RegExp('^'+ getHeaderHashes() +'[^#]+', 'm') ), //first header
        pre = mdown.substring(0, tocIndex),
        post = mdown.substring(tocIndex),
        tocContent = getHeaderHashes() +' Table of Contents <a href="#toc" name="toc" class="deep-link">#</a>\n\n';

    toc.forEach(function(val, i){
        tocContent += ' - ['+ val.name +'](#'+ val.href +')\n';
    });

    return showdown.parse( pre + tocContent + post );
}


function getTitle(mdown){
    var match = getHeaderRegExp(_headingLevel - 1).exec(mdown); //H1
    return match? match[1].trim() : '';
}
