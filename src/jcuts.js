(function(exportName) {

    'use strict';

    var exports = exports || {};

    function ptInPolygon(p, polygon) {
        var cross = 0;
        for (var i = 0; i < polygon.length; i++) {
            var p1 = polygon[i];
            var p2 = polygon[(i + 1) % polygon.length];
            if (p1[1] === p2[1]) {
                continue;
            }
            if (p[1] < Math.min(p1[1], p2[1])) {
                continue;
            }
            if (p[1] >= Math.max(p1[1], p2[1])) {
                continue;
            }
            var x = (p[1] - p1[1]) * (p2[0] - p1[0]) / (p2[1] - p1[1]) + p1[0];
            if (x > p[0]) {
                cross++;
            }
        }
        return cross % 2 === 1;
    }

    /**
     * 比较两个多边形的相似度
     *
     * @param {Array} a 多边形 1 // [[1, 2], [3, 4], [4, 5]]
     * @param {Array} b 多边形 2 // [[1, 2], [3, 4], [4, 7]]
     * @return {number} 返回两个多边形的相似度，范围：0~1，为 1 表示完全相等
     */
    function diffPolygon(a, b) {
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
     * 获得完整剪纸的多边形
     *
     * @param {Array} polygon 基础多边线 // [[x, y], [x1, y1], ...]
     * @param {number} edges 边数 // 5
     * @param {number} x 中心点
     * @param {number} y 中心点
     * @return {Array} 选择和映射后的多边形数组 [[[x, y], [x1, y1], ...], [[x, y], [x1, y1], ...] ...]
     */
    function getCutPolygons(edges, x, y, polygon) {
        //计算与之对称的多边形的端点集
        var newPolygon = [];
        var deltaAngle = 360 / (4 * edges);
        for (var i = 0; i < polygon.length; i++) {
            var m = polygon[i][0];
            var n = polygon[i][1];
            var angle;
            if (n === y) {
                angle = 90;
            }else {
                angle = Math.atan(Math.abs(m - x) / Math.abs(n - y)) * 180 / Math.PI;
            }
            if (m > x) {
                angle = deltaAngle - angle;
            }else {
                angle = deltaAngle + angle;
            }
            var arc = 2 * angle * Math.PI / 180;
            newPolygon.push(jmaths.rotatePoint(polygon[i], [x, y], arc));
        }

        //将两个相互对称的端点集旋转相应的角度
        var polygons = [];
        polygons.push(polygon);
        polygons.push(newPolygon);

        for (var i = 1; i < edges; i++) {
            var arc = (i * 360 / edges) * Math.PI / 180;
            var rPolygon = [];
            var rNewPolygon = [];
            for (var j = 0; j < polygon.length; j++) {
                rPolygon.push(jmaths.rotatePoint(polygon[j], [x, y], arc));
                rNewPolygon.push(jmaths.rotatePoint(newPolygon[j], [x, y], arc));
            }
            polygons.push(rPolygon);
            polygons.push(rNewPolygon);
        }
        return polygons;
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
    exports.format = format;

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

        // flag => synechia: 粘黏, boundary: 边界, scar: 痕迹
        // [[x0, y0], [x1, y1], flag]]
        var modelPath = [];

        // init
        var m = jmaths.regularPolygon(edges * 2, x, y, radius, -Math.PI * 0.5 - Math.PI / edges / 2);

        // ======================
        // start           next
        //  +-------------+
        //   X           X
        //    X         X  
        //     X       X
        //      X     X
        //       X   X
        //        X X
        //         X
        //       center
        // =======================

        var start = m[0];
        var next = m[1];
        var center = [x, y];

        modelPath.push([start, center, 'synechia']);
        modelPath.push([center, next, 'synechia']);
        modelPath.push([next, start, 'boundary']);

        /**
         * 获取完整绘制路径
         *
         * @return {string} 返回完整绘制路径
         */
        function getFullPath() {
            var m = jmaths.regularPolygon(edges * 2, x, y, radius, -Math.PI * 0.5 - Math.PI / edges / 2);
            //  M #{center} L #{start}
            return format('M #{start} L #{lines} Z', {
                start: m[0],
                lines: m.slice(1).join(' '),
                center: [x, y]
            });
        }
        instance.getFullPath = getFullPath;

        /**
         * 获取模型绘制路径
         *
         * @return {string} 返回模型绘制路径
         */
        function getModelPath() {
            var m = [];
            modelPath.forEach(function(line) {
                m.push([line[0].slice(), line[1].slice()]);
            });
            return format('M #{start} L #{lines}', {
                start: m[0][0],
                lines: m.join(' ')
            });
        }

        function getModelPolygon() {
            var result = [];
            modelPath.forEach(function(line) {
                result.push(line[0].slice())
            });
            return result;
        }

        /**
         * 获取完整绘制路径
         *
         * @return {string} 返回完整绘制路径
         */
        function getFullPath() {
            var m = jmaths.regularPolygon(edges * 2, x, y, radius, -Math.PI * 0.5 - Math.PI / edges / 2);
            //  M #{center} L #{start}
            return format('M #{start} L #{lines} Z', {
                start: m[0],
                lines: m.slice(1).join(' '),
                center: [x, y]
            });
        }
        instance.getFullPath = getFullPath;

        var cutModelPath = [];
        /**
         * 获取模型绘制路径
         *
         * @return {string} 返回模型绘制路径
         */
        function getCutModelPath() {
            var m = [];
            cutModelPath.forEach(function(line) {
                m.push([line[0].slice(), line[1].slice()]);
            });
            return format('M #{start} L #{lines}', {
                start: m[0][0],
                lines: m.join(' ')
            });
        }
        instance.getCutModelPath = getCutModelPath;

        /**
         * 剪切纸片
         *
         * @param {Array} polygon 剪刀经过的路径
         * @return {boolean} 剪切是否成功
         */
        function cut(polygon) {
            if (!polygon || polygon.length < 2) {
                // console.log('cut exit 1');
                return;
            }

            // 起点和终点不能在纸里
            var modelPolygon = getModelPolygon();
            if (ptInPolygon(polygon[0], modelPolygon) ||
                ptInPolygon(polygon[polygon.length - 1], modelPolygon)) {
                // console.log('cut exit 2');
                return;
            }

            // 自身不要碰撞
            for (var i = 1; i < polygon.length - 2; i++) {
                var lineA = [polygon[i - 1], polygon[i]];
                for (var j = i + 2; j < polygon.length; j++) {
                    var lineB = [polygon[j - 1], polygon[j]];
                    if (jmaths.doubleLineIntersect(
                        lineA[0], lineA[1], lineB[0], lineB[1])) {
                        // console.log('cut exit 3');
                        return;
                    }
                }
            }

            function cutSub(intersect, polygonIndex, modelIndex) {

                cutModelPath = [];

                var start = intersect;
                for (var i = polygonIndex; i < polygon.length; i++) {
                    next = polygon[i];

                    for (var j = 0; j < modelPath.length; j++) {
                        var lineB = modelPath[(modelIndex + j) % modelPath.length];
                        var intersect = jmaths.doubleLineIntersect(
                            start, next, lineB[0], lineB[1]);
                        if (intersect) {
                            cutModelPath.push([start, intersect, 'scar']);

                            console.log(intersect, cutModelPath);
                            return;
                        }
                    }
                    cutModelPath.push([start, next, 'scar']);
                    start = next;
                }
            }

            var start = polygon[0];
            for (var i = 1; i < polygon.length - 1; i++) {
                var next = polygon[i];

                for (var j = 0; j < modelPath.length; j++) {
                    var lineB = modelPath[j];
                    var intersect = jmaths.doubleLineIntersect(
                        start, next, lineB[0], lineB[1]);

                    if (intersect) { // 出现相交
                        cutSub(intersect, i, j);
                        return;
                    }
                }
                start = next;
            }

            return true;
        }

        instance.cut = cut;

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
