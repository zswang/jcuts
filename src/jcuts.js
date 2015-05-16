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
    function diffPolygon(width, height, a, b) {
        var canvas1 = document.createElement("canvas");
        var canvas2 = document.createElement("canvas");
        var minX = Infinity;
        var minY = Infinity;
        var maxX = 0;
        var maxY = 0;
        for (var i = 0; i < a.length; i++) {
            var point = a[i];
            minX = (minX > point[0]) ? point[0] : minX;
            minY = (minY > point[1]) ? point[1] : minY;
            maxX = (maxX < point[0]) ? point[0] : maxX;
            maxY = (maxY < point[1]) ? point[1] : maxY;
        }
        for (var i = 0; i < b.length; i++) {
            var point = b[i];
            minX = (minX > point[0]) ? point[0] : minX;
            minY = (minY > point[1]) ? point[1] : minY;
            maxX = (maxX < point[0]) ? point[0] : maxX;
            maxY = (maxY < point[1]) ? point[1] : maxY;
        }
        var width = maxX - minX + 1;
        var height = maxY - minY + 1;
        canvas1.width = width;
        canvas1.height = height;
        canvas2.width = width;
        canvas2.height = height;
        drawPolygon(canvas1, a);
        drawPolygon(canvas2, b);
        var similarity = 1 - calculateDiff(canvas1, canvas2, width, height);
        return similarity;
    }

    /**
     * 在canvas上根据多边形端点数组绘制多边形
     * 要求端点数组有序
     *
     * @param {canvas DOM element} canvas 画布元素 1 
     * @param {Array} vertex 多边形端点数组 2 // [[1, 2], [3, 4], [4, 7]]
     */

    function drawPolygon(canvas, vertex) {
        var context = canvas.getContext('2d'); 
        context.beginPath(); 
        var beginX;
        var beginY;
        for (var i = 0; i < vertex.length; i++) {
            var point = vertex[i];
            var x = point[0];
            var y = point[1];
            if (i === 0) {
                beginX = x;
                beginY = y;
                context.moveTo(x, y);
            } else {
                context.lineTo(x, y);
            }
        }
        context.lineTo(beginX, beginY);
        context.fill();
    }

    /**
     * 比较两个canvas黑色多边形的不同度
     *
     * @param {canvas DOM element} canvas1 要比较的第一个画布元素 1 
     * @param {canvas DOM element} canvas2 要比较的第二个画布元素 2 
     * @param {number} width 要比较的绘制区域的宽 3
     * @param {number} height 要比较的绘制区域的高 4
     * @return {number} 返回两个canvas黑色多边形的不同度，范围：0~1，为 1 表示完全不同
     */
    function calculateDiff(canvas1, canvas2, width, height) {
        var context1 = canvas1.getContext('2d');
        var context2 = canvas2.getContext('2d');
        var imgData1 = context1.getImageData(0, 0, width, height);
        var imgData2 = context2.getImageData(0, 0, width, height);
        var diffPixelNum = 0;
        var baseNum = 0;
        for (var i = 0; i < imgData1.data.length; i+=4) {
            baseNum += imgData1.data[i + 3] / 255;
            baseNum += imgData2.data[i + 3] / 255;
            var pixelDiff = Math.abs(imgData1.data[i + 3] - imgData2.data[i + 3]) / 255;
            diffPixelNum += pixelDiff;
        }
        return diffPixelNum / baseNum;
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
