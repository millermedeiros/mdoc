
var showdown = require('./lib/showdown');

var _headingLevel;


exports.parseDoc = function(mdown, headingLevel){
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


function convertCodeBlocks(mdown){
    // showdown have issues with github style code blocks..
    // it would be great if JS RegExp didn't sucked that much
    // could solve the same task with the RegExp: /^`{3}(\w*)([\w\W]*)^`{3}/gm

    var startIndex = mdown.indexOf('```'),
        endIndex,
        codeBlock,
        wrapCode = function(str, p1, p2){
            return p1? '<pre class="brush:'+ p1 +'">\n'+ p2 +'</pre>' : '<pre>\n'+ p2 +'</pre>';
        };

    while(startIndex !== -1){
        endIndex = mdown.indexOf('```', startIndex + 1);
        codeBlock = mdown
                        .substring(startIndex, endIndex)
                        .replace(/`{3}([\-\w]*)\n([\w\W]+)/g, wrapCode);

        mdown = mdown.substring(0, startIndex) + codeBlock + mdown.substring(endIndex + 3);
        startIndex = mdown.indexOf('```');
    }

    return mdown;
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
           title : matchTitle[1],
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
    return (new Array((_headingLevel || level) + 1)).join('#');
}

function getDescription(mdown, fromIndex) {
    var desc = mdown.substr(fromIndex)
                .replace(/\r\n/g,'\n') // DOS to Unix
                .replace(/\r/g,'\n') // Mac to Unix
                .replace(/^\n+/g, '')
                .split(/\n\n/)[0] //first paragraph
                .replace(/\n+/, ' ');

    desc = showdown.parse(desc)
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
