(function(exportName) {

    'use strict';

    var exports = exports || {};

    /**
     * 比较两个多边形的相似度
     *
     * @param {Array} a 多边形 1 // [[1, 2], [3, 4], [4, 5]]
     * @param {Array} b 多边形 2 // [[1, 2], [3, 4], [4, 7]]
     * @return {number} 返回两个多边形的相似度，范围：0~1，为 1 表示完全相等
     */
    function diffPolygon(a, b) {

    }

    exports.diffPolygon = diffPolygon;

    /**
     * 格式化函数
     *
     * @param {string} template 模板
     * @param {Object} json 数据项
     */
    function format(template, json) {
        return template.replace(/#\{(.*?)\}/g, function(all, key) {
            return json && (key in json) ? json[key] : "";
        });
    }

    /**
     * 创建剪纸对象
     *
     * @param {number} edges 边数 4 - 7
     * @param {number} x 中心 x
     * @param {number} y 中心 y
     * @param {number} radius 半径
     * @return {Object} 返回剪纸对象
     */
    function createPaper(edges, x, y, radius) {
        var instance = {};

        function getFullPath() {
            var m = jmaths.regularPolygon(edges * 2, x, y, radius,
                Math.PI / 2 - Math.PI / edges / 2);
            return format('M #{start} L #{lines} Z', {
                start: m[0],
                lines: m.slice(1).join(' ')
            });
        }
        instance.getFullPath = getFullPath;


        function getModelPath() {
            var m = jmaths.regularPolygon(edges * 2, x, y, radius,
                Math.PI / 2 - Math.PI / edges / 2);
            return format('M #{center} L #{start} #{next} Z', {
                center: [x, y],
                start: m[0],
                next: m[1]
            });
        }
        instance.getModelPath = getModelPath;


        return instance;
    }

    exports.createPaper = createPaper;

    if (typeof define === 'function') {
        if (define.amd || define.cmd) {
            define(function() {
                return exports;
            });
        }
    }
    else if (typeof module !== 'undefined' && module.exports) {
        module.exports = exports;
    }
    else {
        window[exportName] = exports;
    }

})('jcuts');
