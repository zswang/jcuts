(function() {
    var jmaths, jpaths;
    (function() {
        var define = function(factory) {
            jmaths = factory();
        };
        define.amd = true;
        /*<include file="bower_components/jmaths/jmaths.js" />*/
        var define = function(factory) {
            jpaths = factory();
        };
        define.amd = true;
        /*<include file="bower_components/jpaths/jpaths.js" />*/
    })();
    /*<include file="src/jcuts.js" />*/
})();
