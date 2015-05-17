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
        drawPolygon(canvas1, a, minX, minY);
        drawPolygon(canvas2, b, minX, minY);
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
        //计算与之对称的多边形的端点集
        var newPolygon = [];
        var deltaAngle = 360 / (4 * edges);
        for (var i = 0; i < polygon.length; i++) {
            var m = polygon[i][0];
            var n = polygon[i][1];
            var angle;
            if (n === y) {
                angle = 90;
            }
            else {
                angle = Math.atan(Math.abs(m - x) / Math.abs(n - y)) * 180 / Math.PI;
            }
            if (m > x) {
                angle = deltaAngle - angle;
            }
            else {
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
    exports.getCutPolygons = getCutPolygons;

    /**
     * 在canvas上根据多边形端点数组绘制多边形
     * 要求端点数组有序
     *
     * @param {canvas DOM element} canvas 画布元素
     * @param {Array} vertex 多边形端点数组 // [[1, 2], [3, 4], [4, 7]]
     * @param {number} offsetX x轴偏移量，默认为0
     * @param {number} offsetY y轴偏移量，默认为0
     * @param {string} color 多边形填充色，默认为黑色
     */

    function drawPolygon(canvas, vertex, offsetX, offsetY, color) {
        var offsetX = offsetX || 0;
        var offsetY = offsetY || 0;
        var context = canvas.getContext('2d');
        context.beginPath();
        var beginX;
        var beginY;
        for (var i = 0; i < vertex.length; i++) {
            var point = vertex[i];
            var x = point[0] - offsetX;
            var y = point[1] - offsetY;
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
        context.closePath();
        if (color) {
            context.fillStyle = color;
        }
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

    /**
     * 多边形掉落效果
     *
     * @param {Array} vertex 多边形端点集
     * @param {string} color 多边形填充色
     */
    function polygonDrop(vertex, color) {
        //绘制多边形
        var canvas = document.createElement("canvas");
        var minX = Infinity;
        var minY = Infinity;
        var maxX = 0;
        var maxY = 0;
        for (var i = 0; i < vertex.length; i++) {
            var point = vertex[i];
            minX = (minX > point[0]) ? point[0] : minX;
            minY = (minY > point[1]) ? point[1] : minY;
            maxX = (maxX < point[0]) ? point[0] : maxX;
            maxY = (maxY < point[1]) ? point[1] : maxY;
        }
        var width = maxX - minX + 1;
        var height = maxY - minY + 1;
        canvas.width = width;
        canvas.height = height;
        drawPolygon(canvas, vertex, minX, minY, color);
        //添加掉落效果
        var paperWrap = document.createElement('div');
        paperWrap.className += 'paper-wrap ';
        paperWrap.className += 'fall ';
        var body = document.getElementsByTagName('body')[0];
        var rect = document.body.getBoundingClientRect();
        var top = rect.top + minY;
        var left = rect.left + minX;
        paperWrap.style.width = width + "px";
        paperWrap.style.height = height + "px";
        paperWrap.style.top = top + "px";
        paperWrap.style.left = left + "px";
        var area = width * height;
        if (area < 1600) {
            var innerWrap = document.createElement('div');
            innerWrap.className += 'rotate ';
            innerWrap.appendChild(canvas);
            paperWrap.appendChild(innerWrap);
        } else if (area > 10000) {
            var innerWrap = document.createElement('div');
            innerWrap.className += 'sway3d ';
            innerWrap.appendChild(canvas);
            paperWrap.appendChild(innerWrap);
        } else {
            var innerWrap = document.createElement('div');
            innerWrap.className += 'rotate-slow ';
            innerWrap.appendChild(canvas);
            var outerWrap = document.createElement('div');
            outerWrap.className += 'sway2d ';
            outerWrap.appendChild(innerWrap);
            paperWrap.appendChild(outerWrap);
        }
        body.appendChild(paperWrap);
    }
    exports.polygonDrop = polygonDrop;

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

        /*<debug>*/
        var debugs = {};
        instance.debug = function(name) {
            return debugs[name];
        };
        window.debugs = debugs;
        /*</debug>*/

        /**
         * 剪切纸片
         *
         * @param {Array} polygon 剪刀经过的路径
         * @return {boolean} 剪切是否成功
         */
        function cut(polygon) {
            if (!polygon || polygon.length < 2) {
                return;
            }

            // 起点和终点不能在纸里
            var modelPolygon = getModelPolygon();
            if (ptInPolygon(polygon[0], modelPolygon) ||
                ptInPolygon(polygon[polygon.length - 1], modelPolygon)) {
                return;
            }

            // 自身不要碰撞
            for (var i = 1; i < polygon.length - 2; i++) {
                var lineA = [polygon[i - 1], polygon[i]];
                for (var j = i + 2; j < polygon.length; j++) {
                    var lineB = [polygon[j - 1], polygon[j]];
                    if (jmaths.doubleLineIntersect(
                        lineA[0], lineA[1], lineB[0], lineB[1])) {
                        return;
                    }
                }
            }

            function doCut(startModelIndex, endModelIndex) {
                var a = [];
                var b = [];

                var start = cutModelPath[0][0];
                var end = cutModelPath[cutModelPath.length - 1][1];

                if (startModelIndex !== endModelIndex) {
                    var modelIndex = startModelIndex;
                    var temp = start;
                    for (var i = 0; i < modelPath.length; i++) {
                        next = modelPath[modelIndex][1];
                        if (modelIndex === endModelIndex) {
                            a.push([
                                temp,
                                end,
                                modelPath[modelIndex][2]
                            ]);
                            for (var j = cutModelPath.length - 1; j >= 0; j--) {
                                a.push([
                                    cutModelPath[j][1],
                                    cutModelPath[j][0],
                                    cutModelPath[j][2]
                                ]);
                            }
                            break;
                        }
                        a.push([
                            temp,
                            next,
                            modelPath[modelIndex][2]
                        ]);
                        temp = next;
                        modelIndex = (modelIndex + 1) % modelPath.length;
                    }

                    var modelIndex = startModelIndex;
                    var temp = start;
                    for (var i = 0; i < modelPath.length; i++) {
                        next = modelPath[modelIndex][0];
                        if (modelIndex === endModelIndex) {
                            b.push([
                                temp,
                                end,
                                modelPath[modelIndex][2]
                            ]);
                            for (var j = cutModelPath.length - 1; j >= 0; j--) {
                                b.push([
                                    cutModelPath[j][1],
                                    cutModelPath[j][0],
                                    cutModelPath[j][2]
                                ]);
                            }
                            break;
                        }
                        b.push([
                            temp,
                            next,
                            modelPath[modelIndex][2]
                        ]);
                        temp = next;
                        modelIndex--;
                        if (modelIndex < 0) {
                            modelIndex = modelPath.length - 1;
                        }
                    }
                }
                else { // 在同一条边上
                    if (jmaths.pointToPoint(modelPath[startModelIndex][0], start) <
                        jmaths.pointToPoint(modelPath[startModelIndex][0], end)) {
                        a.push([
                            modelPath[startModelIndex][0],
                            start,
                            modelPath[startModelIndex][2]
                        ]);
                        for (var j = 0; j < cutModelPath.length; j++) {
                            a.push(cutModelPath[j]);
                        }
                        a.push([
                            end,
                            modelPath[startModelIndex][1],
                            modelPath[startModelIndex][2]
                        ]);
                        for (var i = 1; i < modelPath.length; i++) {
                            a.push(modelPath[
                                (startModelIndex + i) % modelPath.length]);
                        }

                        for (var j = 0; j < cutModelPath.length; j++) {
                            b.push(cutModelPath[j]);
                        }
                        b.push([
                            end,
                            start,
                            modelPath[startModelIndex][2]
                        ]);
                    }
                    else { // 逆方向
                        a.push([
                            start,
                            modelPath[startModelIndex][1],
                            modelPath[startModelIndex][2]
                        ]);
                        for (var i = 1; i < modelPath.length; i++) {
                            a.push(modelPath[
                                (startModelIndex + i) % modelPath.length]);
                        }
                        a.push([
                            modelPath[startModelIndex][0],
                            end,
                            modelPath[startModelIndex][2]
                        ]);
                        for (var j = cutModelPath.length - 1; j >= 0; j--) {
                            a.push([
                                cutModelPath[j][1],
                                cutModelPath[j][0],
                                cutModelPath[j][2]
                            ]);
                        }

                        b.push([
                            end,
                            start,
                            modelPath[startModelIndex][2]
                        ]);
                        for (var j = 0; j < cutModelPath.length; j++) {
                            b.push(cutModelPath[j]);
                        }
                    }
                }
                // console.log(JSON.stringify(a, null, '  '));

                var m = [];
                a.forEach(function(line) {
                    m.push([line[0].slice(), line[1].slice()]);
                });
                debugs['a'] = format('M #{start} L #{lines} Z', {
                    start: m[0],
                    lines: m.slice(1).join(' '),
                });

                var m = [];
                b.forEach(function(line) {
                    m.push([line[0].slice(), line[1].slice()]);
                });
                debugs['b'] = format('M #{start} L #{lines}', {
                    start: m[0],
                    end: end,
                    lines: m.slice(1).join(' ')
                });

                var synechiaA = 0;
                a.forEach(function(item) {
                    if (item[2] === 'synechia') {
                        synechiaA += jmaths.pointToPoint(item[0], item[1]);
                    }
                });
                var synechiaB = 0;
                b.forEach(function(item) {
                    if (item[2] === 'synechia') {
                        synechiaB += jmaths.pointToPoint(item[0], item[1]);
                    }
                });
                if (synechiaA >= synechiaB) {
                    modelPath = a;
                    cutModelPath = b;
                }
                else {
                    modelPath = b;
                    cutModelPath = a;
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
