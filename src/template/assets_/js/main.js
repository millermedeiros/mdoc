
// mdoc default template
// author: Miller Medeiros
// license: MIT
// version : 0.1.4 (2011/12/02)

(function ($) {


    var DEFAULT_BRUSH = 'js',
        _curPath = document.location.pathname.split('/'),
        _curFile = _curPath[_curPath.length - 1],
        _rootPath;


    var sidebar = (function () {

        var $_sidebar,
            $_search,
            $_toc,
            $_tocList,
            $_tocItems;


        function init() {
            $_sidebar = $('<div id="sidebar" />').prependTo('#wrapper');
            $_sidebar.load(_rootPath +'sidebar_.html', onTocLoad);
        }

        function onTocLoad(data) {
            $_search = $('#search');
            $_toc = $_sidebar.find('.toc');
            $_tocList = $_toc.find('.toc-list');
            $_tocItems = $_tocList.find('.toc-item');

            //fix links if page is on a nested folder
            $_sidebar.find('a').each(function(){
                var $el = $(this), href = $el.attr('href');
                $el.attr('href', _rootPath + href);
            });

            $_tocList.slideUp(0);
            $_sidebar.on('click', '.toc-mod-title.collapsible', toggleNavOnClick);
            $('#show-desc').on('change', toggleDescription);
            toggleDescription();
            $_search.on('keyup blur', filterOnSearch);

            $_sidebar.find('.toc-mod-title:has(a[href*="'+ _curFile +'"])').click();
            $_sidebar.find('.toc-list:has(a)').prev().addClass('collapsible');
        }

        function toggleNavOnClick(evt) {
            var $el = $(this);
            $el.toggleClass('opened');
            $el.next('.toc-list').stop(true, true).slideToggle(300);
        }

        function toggleDescription() {
            $_toc.find('.desc').toggleClass('hidden');
        }

        function filterOnSearch(evt) {
            var term = $_search.val(),
                rTerm;

            $_tocItems.toggleClass('hidden', !!term);
            $_toc
                .find('.toc-mod-title')
                .toggleClass('hidden', !!term)
                .removeClass('opened');

            if(term){
                rTerm = new RegExp(term, 'i'); //case insensitive
                $_toc.find('.toc-mod-title').addClass('hidden');

                $_tocList.stop(true).slideDown(0);

                $_tocItems
                    .filter(function(){
                        return rTerm.test( $(this).text() );
                    })
                    .removeClass('hidden');

            } else {
                $_tocList.stop(true).slideUp(0);
            }

        }

        return {
            init : init
        };

    }());


    // ---

    var syntax = {

        init : function(){

            var brushesPath = _rootPath +'assets_/js/lib/syntax-highlighter/';

            var brushes = [
                    'applescript            {{path}}shBrushAppleScript.js',
                    'actionscript3 as3      {{path}}shBrushAS3.js',
                    'bash shell             {{path}}shBrushBash.js',
                    'coldfusion cf          {{path}}shBrushColdFusion.js',
                    'cpp c                  {{path}}shBrushCpp.js',
                    'c# c-sharp csharp      {{path}}shBrushCSharp.js',
                    'css                    {{path}}shBrushCss.js',
                    'delphi pascal          {{path}}shBrushDelphi.js',
                    'diff patch pas         {{path}}shBrushDiff.js',
                    'erl erlang             {{path}}shBrushErlang.js',
                    'groovy                 {{path}}shBrushGroovy.js',
                    'java                   {{path}}shBrushJava.js',
                    'jfx javafx             {{path}}shBrushJavaFX.js',
                    'js jscript javascript  {{path}}shBrushJScript.js',
                    'perl pl                {{path}}shBrushPerl.js',
                    'php                    {{path}}shBrushPhp.js',
                    'text plain             {{path}}shBrushPlain.js',
                    'py python              {{path}}shBrushPython.js',
                    'ruby rails ror rb      {{path}}shBrushRuby.js',
                    'sass scss              {{path}}shBrushSass.js',
                    'scala                  {{path}}shBrushScala.js',
                    'sql                    {{path}}shBrushSql.js',
                    'vb vbnet               {{path}}shBrushVb.js',
                    'xml xhtml xslt html    {{path}}shBrushXml.js'
                ];

            brushes = $.map(brushes, function(val){
                return val.replace('{{path}}', brushesPath);
            });

            $('pre:has(code)')
                .addClass('brush:'+ DEFAULT_BRUSH)
                .find('code')
                .replaceWith(function(){
                    return $(this).text();
                });

            SyntaxHighlighter.defaults['auto-links'] = false;
            SyntaxHighlighter.autoloader.apply(SyntaxHighlighter.autoloader, brushes);
            SyntaxHighlighter.all();

        }

    };


    // ----


    function init(){
        _rootPath = $('body').data('rootPath'); //fix relative links on nested paths
        sidebar.init();
        syntax.init();
    }

    $(document).ready(init);

}(jQuery));
