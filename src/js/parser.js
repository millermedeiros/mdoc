
var showdown = require('./lib/showdown');


exports.parseDoc = function(mdown){
    mdown = convertCodeBlocks(mdown);

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
        rH2 = /^##\s*([^#\n\r]+)$/gm, //h2
        rName = /(\w+)(\(?)[^\)]*(\)?):?.*/,
        toc = [];

    while (matchTitle = rH2.exec(mdown)) {
        matchName = rName.exec(matchTitle[1]);
        toc.push({
           href : matchName[1],
           title : matchTitle[1],
           name : (matchName.slice(1,4).join('')),
           description : getDescription(mdown, rH2.lastIndex)
        });
    }

    return toc;
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
    var rH2 = /^##[^#\n\r]+/gm;

    // add deep-links

    var i = 0, cur;

    mdown = mdown.replace(rH2, function(str){
        cur = toc[i++];
        return str +' <a href="#'+ cur.href +'" id="'+ cur.href +'" class="deep-link">#</a>';
    });

    // generate TOC

    var tocIndex = mdown.search( rH2 ), //first H2
        pre = mdown.substring(0, tocIndex),
        post = mdown.substring(tocIndex),
        tocContent = '## Table of Contents <a href="#toc" name="toc" class="deep-link">#</a>\n\n';

    toc.forEach(function(val, i){
        tocContent += ' - ['+ val.name +'](#'+ val.href +')\n';
    });

    return showdown.parse( pre + tocContent + post );
}


function getTitle(mdown){
    var match = /#([^#]+)#?/.exec(mdown); //H1
    return match? match[1].trim() : '';
}
