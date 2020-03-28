/* eslint-disable */
import React from 'react';
import * as d3 from 'd3';
const { hexbin: d3Hexbin } = require('d3-hexbin');

import { combs } from './combs';

export const BeeHive = () => {
    return (
        <div id='beehive-wrapper'>
            <div id='beehive-container'>
                <div id='beehive' ref={renderTheHive} />
            </div>
        </div>
    );
};

const renderTheHive = async function() {
    combs.forEach(function(d, i) {
        d.i = i % 10;
        d.j = (i / 10) | 0;
    });

    var height = 700,
        imageWidth = 132,
        imageHeight = 152,
        radius = 75,
        depth = 8;

    var currentFocus = [window.innerWidth / 2, height / 2],
        desiredFocus,
        idle = true;

    var style = document.body.style,
        transform =
            ('webkitTransform' in style
                ? '-webkit-'
                : 'MozTransform' in style
                ? '-moz-'
                : 'msTransform' in style
                ? '-ms-'
                : 'OTransform' in style
                ? '-o-'
                : '') + 'transform';

    var hexbin = d3Hexbin().radius(radius);

    if (!('ontouchstart' in document))
        d3.select('#beehive-container').on('mousemove', mousemoved);

    var deep = d3.select('#beehive');
    var canvas = deep.append('canvas').attr('height', height);
    var context = canvas.node().getContext('2d');
    var svg = deep.append('svg').attr('height', height);
    var mesh = svg.append('path').attr('class', 'beehive-mesh');

    var anchor = svg
        .append('g')
        .attr('class', 'beehive-anchor')
        .selectAll('a');

    var graphic = deep.selectAll('svg,canvas');

    const dummyImage = await new Promise(resolve => {
        const image = new Image();
        image.src = `https://encrypted-tbn0.gstatic.com/images?q=tbn%3AANd9GcTg8NNRnzyI9uHbHVyEj-4KCwhMivh_6qnBTfByCrQyMGSsbvAD`;
        image.onload = () => resolve(image);
    });

    const images = await Promise.all(
        combs.map(
            comb =>
                new Promise(resolve => {
                    if (!comb.img && !comb.title) {
                        return resolve(dummyImage);
                    }

                    const image = new Image();

                    image.src =
                        comb.img ||
                        `https://picsum.photos/${imageWidth}/${imageHeight}?${encodeURIComponent(
                            comb.title
                        )}`;
                    image.onload = () => resolve(image);
                    image.onerror = () => resolve(dummyImage);
                })
        )
    );

    d3.select(window)
        .on('resize', resized)
        .each(resized);

    function drawImage(image) {
        context.save();
        context.beginPath();
        context.moveTo(0, -radius);

        for (let i = 1; i < 6; ++i) {
            var angle = (i * Math.PI) / 3,
                x = Math.sin(angle) * radius,
                y = -Math.cos(angle) * radius;
            context.lineTo(x, y);
        }

        context.clip();
        context.drawImage(
            image,
            -imageWidth / 2,
            -imageHeight / 2,
            imageWidth,
            imageHeight
        );
        context.restore();
    }

    async function resized() {
        var deepWidth = (innerWidth * (depth + 1)) / depth,
            deepHeight = (height * (depth + 1)) / depth,
            centers = hexbin.size([deepWidth, deepHeight]).centers();

        desiredFocus = [innerWidth / 2, height / 2];
        moved();

        graphic
            .style('left', Math.round((innerWidth - deepWidth) / 2) + 'px')
            .style('top', Math.round((height - deepHeight) / 2) + 'px')
            .attr('width', deepWidth)
            .attr('height', deepHeight);

        centers.forEach(function(center, i) {
            console.log(i);
            center.j = Math.round(center[1] / (radius * 1.5));
            center.i = Math.round(
                (center[0] - (center.j & 1) * radius * Math.sin(Math.PI / 3)) /
                    (radius * 2 * Math.sin(Math.PI / 3))
            );
            const combIndex = i % combs.length;
            context.save();
            context.translate(Math.round(center[0]), Math.round(center[1]));
            drawImage(
                images[combIndex] || dummyImage,
                (center.comb = combs[combIndex])
            );
            context.restore();
        });

        mesh.attr('d', hexbin.mesh);
        anchor = anchor.data(centers, function(d) {
            return d.i + ',' + d.j;
        });
        anchor.exit().remove();

        var anchorEnter = anchor
            .enter()
            .append('a')
            .attr('target', function(d) {
                return 'channel-frame';
            })
            .attr('xlink:href', function(d) {
                if(d.comb.path !== ''){
                return (
                    d &&
                    d.comb &&
                    d.comb.title &&
                    `${location.origin}/${encodeURI(
                        d.comb.path.replace(' ', '')
                    )}`
                );
                } else {
                    return (
                        d &&
                        d.comb &&
                        d.comb.title &&
                        d.comb.url
                    );  
                }
            })
            .attr('xlink:title', function(d) {
                return d && d.comb && d.comb.title;
            });

        anchorEnter.append('path').attr('d', hexbin.hexagon());

        anchor = anchorEnter.merge(anchor).attr('transform', function(d) {
            return 'translate(' + d + ')';
        });
    }

    function mousemoved() {
        var m = d3.mouse(this);

        desiredFocus = [
            Math.round((m[0] - window.innerWidth / 2) / depth) * depth +
                window.innerWidth / 2,
            Math.round((m[1] - height / 2) / depth) * depth + height / 2
        ];

        moved();
    }

    function moved() {
        if (idle)
            d3.timer(function() {
                if (
                    (idle =
                        Math.abs(desiredFocus[0] - currentFocus[0]) < 0.5 &&
                        Math.abs(desiredFocus[1] - currentFocus[1]) < 0.5)
                )
                    currentFocus = desiredFocus;
                else
                    (currentFocus[0] +=
                        (desiredFocus[0] - currentFocus[0]) * 0.14),
                        (currentFocus[1] +=
                            (desiredFocus[1] - currentFocus[1]) * 0.14);
                deep.style(
                    transform,
                    'translate(' +
                        (innerWidth / 2 - currentFocus[0]) / depth +
                        'px,' +
                        (height / 2 - currentFocus[1]) / depth +
                        'px)'
                );
                return idle;
            });
    }
};
