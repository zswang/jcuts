(function(exportName) {

    'use strict';

    var exports = exports || {};

    /**
     * 判断点是否在多边形中
     *
     * @param {Array} p 点坐标
     * @param {Array} polygon 多边形坐标
     * @return {boolean} 返回点是否在多边形中
     */
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
    exports.diffPolygon = diffPolygon;

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
            }
            else {
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
        for (var i = 0; i < imgData1.data.length; i += 4) {
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
            return format('M #{start} L #{lines}' +
                'M #{start} m -5,0 h 10 M #{start} m 0,-5 v 10' +
                'M #{end} m -8,0 h 16 M #{end} m 0,-8 v 16', {
                    start: m[0][0],
                    end: m[m.length - 1][1],
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
                console.log('cut exit 1');
                return;
            }

            // 起点和终点不能在纸里
            var modelPolygon = getModelPolygon();
            if (ptInPolygon(polygon[0], modelPolygon) ||
                ptInPolygon(polygon[polygon.length - 1], modelPolygon)) {
                console.log('cut exit 2');
                return;
            }

            // 自身不要碰撞
            for (var i = 1; i < polygon.length - 2; i++) {
                var lineA = [polygon[i - 1], polygon[i]];
                for (var j = i + 2; j < polygon.length; j++) {
                    var lineB = [polygon[j - 1], polygon[j]];
                    if (jmaths.doubleLineIntersect(
                        lineA[0], lineA[1], lineB[0], lineB[1])) {
                        console.log('cut exit 3');
                        return;
                    }
                }
            }

            function doCut(startModelIndex, endModelIndex) {
                var start = cutModelPath[0][0];

                // var a = [];
                // var b = [cutModelPath[cutModelPath.length - 1]];
                //

                for (var i = 0; i < modelPath.length; i++) {

                    var modelIndex = (startModelIndex + i) % modelPath.length;

                    // var model = modelPath[];

                    // a.push();
                }
            }

            function cutSub(intersect, polygonIndex, modelIndex) {

                cutModelPath = [];

                var start = intersect;
                for (var i = polygonIndex; i < polygon.length; i++) {
                    next = polygon[i];

                    for (var j = 0; j < modelPath.length; j++) {
                        var line = modelPath[j];
                        if (i === polygonIndex && modelIndex === j) {
                            continue;
                        }
                        var p = jmaths.doubleLineIntersect(
                            start, next, line[0], line[1]);
                        if (p) {
                            cutModelPath.push([start, p, 'scar']);

                            doCut(modelIndex, j);
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
                    var line = modelPath[j];
                    var intersect = jmaths.doubleLineIntersect(
                        start, next, line[0], line[1]);
                    if (intersect) { // 出现相交
                        cutSub(intersect, i, j);
                        // console.log(JSON.stringify(polygon));
                        return true;
                    }
                }
                start = next;
            }
        }

        instance.cut = cut;

        instance.getModelPath = getModelPath;

        return instance;
    }
    exports.createPaper = createPaper;

    /**
     * 创建剪纸游戏实例
     *
     * @param {Object} options 配置项
     * @param {Element|string} options.container 容器，选择器或者元素对象
     * @param {=number} options.edges 边数，3~6，默认 6
     * @param {=Function} options.onchange 用户剪切纸张
     * @return {Object} 返回游戏实例
     */
    function createGame(options) {
        console.log('createGame');
        /**
         * 返回当前用户剪辑留下的形状
         *
         * @return {Array} 返回形状路径数据
         */
        instance.getPolygon = function() {
            console.log('getPolygon()');
        };

        /**
         * 返回当前用户剪辑掉落的形状
         *
         * @return {Array} 返回形状路径数据
         */
        instance.getCutPolygon = function() {
            console.log('getCutPolygon()');
        };

        /**
         * 开始游戏
         */
        instance.replay = function() {
            console.log('replay()');
        };

        /**
         * 停止游戏
         */
        instance.stop = function() {
            console.log('stop()');
        };

        /**
         * 释放游戏资源
         */
        instance.free = function() {
            console.log('free()');
        };

        return instance;
    }

    /**
     * 渲染剪纸效果
     *
     * @param {Element|string} container 渲染容器，元素或选择器，得固定高宽
     * @param {number} edges 边数，3~6
     * @param {Array} polygon 多边形
     * @return {Object} 渲染示例
     */
    function renderPager(container, edges, polygon) {
        console.log('renderPager');
        /**
         * 释放游戏资源
         */
        instance.free = function() {
           console.log('free');
        };
    }

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
