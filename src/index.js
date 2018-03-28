import * as d3 from "d3";
import * as scale from "d3-scale";
import {  sort } from "d3-array";
import { forceSimulation } from "d3-force";
import { format } from "d3-format";
import { geoPath } from "d3-geo";
import * as topojson from 'topojson';


var margin = {top: 50, left: 50, right: 50, bottom: 50};
var height = 700 - margin.top - margin.bottom;
var width = 1200 - margin.left -margin.right;

var f = d3.format("d");

var colorScale = d3.scaleLinear()
    .domain([0, 50])
    .range(["#6495ED", "#180f74"]);
var textscale = d3.scaleSqrt()
    .domain([6, 50]).range([7, 13]);
var scaleRadius = d3.scaleSqrt().domain([6, 50]).range([4, 30]);
var scaleMapRadius = d3.scaleSqrt().domain([6, 50]).range([3, 10]);


var ForceXCombine = d3.forceX(width / 2);
var ForceYCombine = d3.forceY(height / 2);


 var container = d3.select("body")
    .append("div")
    .attr("class", "container");


 var header = container
    .append("header")
    .attr("class", "container__header");

     header.append("h3")
         .text("Countries birth rate visualization per 1000 population");


 var svg = container.append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("class", "container__svg")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .append("g")
    .attr("class", "container__bubble");

var projection = d3.geoMercator()
    .scale(100)
    .translate([width / 2, height / 2]);

var path = d3.geoPath().projection(projection);

d3.queue()
    .defer(d3.json, "/data/borders.json")
    .defer(d3.csv, "/data/data.csv")
    .await(ready);

function ready(error, topology, data) {
    var rateById = {};

    // data.forEach(function(d) {
    //     rateById[d.country] = +d.birth;
    // });


        console.log(topology);
        var geojson = topojson.feature(topology, topology.objects.countries1);

        var map = svg.selectAll("path")
            .data(geojson.features)
            .enter().append("path")
            .attr("d", path)
            .attr("class", "container__path")
            .attr("opacity", "0")
            // .style("fill", function(d) {
            //     return colorScale(rateById[d.properties.name]);
            // })
        ;



        var interiors = topojson.mesh(topology, topology.objects.countries1, function (a, b) {
            return a !== b;
        });

    var forceXCountryDivide = d3.forceX(function (d) {
        var x_projected = projection([d.long, d.lat]);
        console.log(d.country + " " + x_projected[0] + ", " + x_projected[1]);
        return x_projected[0];
    });

    var forceYCountryDivide = d3.forceY(function (d) {
        var y_projected = projection([d.long, d.lat]);
        return y_projected[1];
    });

    var forceXDivide = d3.forceX(function (d) {
        switch (d.region) {
            case 'Africa':
                return 1 / 6 * width + 30;
            case 'America':
                return 3 / 7 * width;
            case 'Asia':
                return 4 / 7 * width;
            case 'Europe':
                return 5 / 7 * width;
            case 'Oceania':
                return 6 / 7 * width;
        }
    });

    var forceYDivide = d3.forceY(function (d) {
        switch (d.region) {
            case 'Africa':
                return 1 / 3 * height+10;
            case 'America':
                return 2 / 3 * height+10;
            case 'Asia':
                return 1 / 3 * height+10;
            case 'Europe':
                return 2 / 3 * height+10;
            case 'Oceania':
                return 1 / 3 * height+10;
        }
    });

        let tooltip = container.append("div")
            .attr("class", "container__tooltip")
            .style("display", "none");


        var circles = svg.selectAll("country")
            .data(data)
            .enter().append("circle")
            .attr("class", "container__country")
            .attr("r", function (d) {
                return scaleRadius(d.birth)
            })
            .on("click mouseenter mouseover focus", function (d) {

                tooltip.transition()
                    .duration(2)
                    .style("opacity", .9)
                    .style("display", "block");

                tooltip.html("country " + d.country + "\n" + d.birth)
                    .style("left", (d3.event.pageX) + "px")
                    .style("top", d3.event.pageY + "px");
            })
            .on("mouseout", function (d) {
                tooltip.transition().style("display", "none");
                d3.select(this).style("stroke-opacity", "0");
            });


        circles.style("fill", function (d) {
            return colorScale(d.birth);
        });

        var text = svg.selectAll("country")
            .data(data)
            .enter()
            .append("text")
            .attr("class", "container__countryname") //
            .text(function (d) {
                return d.code;
            })
            .attr("font-size", function (d) {
                return f(textscale(d.birth));
            })
            .on("click mouseenter mouseover focus", function (d) {
                tooltip
                    .transition()
                    .duration(2)
                    .style("opacity", .9)
                    .style("display", "block");
                tooltip.html("country " + d.country + "\n" + d.birth)
                    .style("left", (d3.event.pageX) + "px")
                    .style("top", d3.event.pageY + "px");
            })
            .on("mouseout", function (d) {
                tooltip.transition().style("display", "none");
            })
            .attr("fill", "white");

        var simulation = forceSimulation(height / 2 - 105)
            .force("x", ForceXCombine)
            .force("y", ForceYCombine)
            .force("collide", d3.forceCollide(
                function (d) {
                    return scaleRadius(d.birth);
                })).alpha(0.4);

//The box with information
        var maxmin = header.data(data)
            .append("div")
            .attr("class", "info");

        var maxminhead = maxmin.append("h3").text("Bound birth rate values:")
            .attr("class", "info__caption");

        var max = maxmin.append("div").attr("class", "info__value")
            .text(function (d) {
                return "maximal value: " + sortingOrder(data)[data.length - 1].country +
                    " " + sortingOrder(data)[data.length - 1].birth + '\n';
            });

        var min = maxmin.append("div").attr("class", "info__value")
            .text(function (d) {
                return "minimal value: " + sortingOrder(data)[0].country + " " +
                    sortingOrder(data)[0].birth;
            });

        var datainfo = maxmin.append("div")
            .attr("class", "info__ref")
            .text("Data for visualization was taken from ");

        datainfo.append("a")
            .attr("class", "info__link")
            .attr("href", "http://apps.who.int/gho/data/node.main.CBDR107?lang=en")
            .text("World Health Organization");
//End of the box with information

    var country_divide = header.append("button")
        .attr("id", "country_divide")
        .attr("class", "container__button");
        country_divide.text("On a map");

        country_divide.on("click", function () {
            text.attr("opacity" ,"0");
            map.attr("opacity", "1");
            // map.data(data).style("fill", function (d) {
            //     return colorScale(d.birth);
            // });
            circles.attr("r", function (d) {
            return scaleMapRadius(d.birth);
        }).attr("opacity", "0.9");

    simulation
        .force("x", forceXCountryDivide)
        .force("y", forceYCountryDivide)
        .force("collide", d3.forceCollide(
            function (d) {
                return scaleMapRadius(d.birth)-1;
            }))
        .alpha(0.5)
        .restart();
        svg.selectAll(".container__regionname").attr("display", "none");
});

//Button for common displaying
        var divide = header.append("button")
            .attr("id", "divide")
            .attr("class", "container__button");
        divide.text("By region");


        divide.on("click", function () {
            text.attr("opacity" ,"1");
            map.attr("opacity", "0");
            circles.attr("r", function (d) {
                return scaleRadius(d.birth);
            }).attr("opacity", "1");
            simulation
                .force("x", forceXDivide)
                .force("y", forceYDivide)
                .force("collide", d3.forceCollide(
                    function (d) {
                        return scaleRadius(d.birth);
                    }))
                .alpha(0.5)
                .restart();

            svg.selectAll(".container__regionname").attr("display", "inline");
        });

//Button for displaying by regions
        var combine = header.append("button")
            .attr("id", "combine")
            .attr("class", "container__button");
        combine.text("All");

        combine.on("click", function () {
            map.attr("opacity", "0");
            text.attr("opacity" ,"1");
            circles.attr("r", function (d) {
                return scaleRadius(d.birth);
            }).attr("opacity", "1");

            simulation
                .force("x", ForceXCombine)
                .force("y", ForceYCombine)
                .force("collide", d3.forceCollide(
                    function (d) {
                        return scaleRadius(d.birth);
                    }))
                .alpha(0.4)
                .restart();

            svg.selectAll(".container__regionname").attr("display", "none");
        });


        simulation.nodes(data)
            .on("tick", ticked);

        function ticked() {
            circles
                .attr("cx", function (d) {
                    return d.x;
                })
                .attr("cy", function (d) {
                    return d.y;
                })
                .attr("id", function (d) {
                    return d.country
                });

            text
                .attr("x", function (d) {
                    return d.x - 12;
                })
                .attr("y", function (d) {
                    return d.y + 5;
                });
        }


        function sortingOrder(data) {
            return data.sort(function (a, b) {
                return +a.birth - b.birth;
            });
        };

}

var text_region = d3.csv("/data/regions.csv", function(data) {
    svg.selectAll("country").data(data)
        .enter()
        .append("text")
        .attr("class", "container__regionname")
        .attr("transform", function (d) {
            return "translate(" + d.posx*width + "," + d.posy*height + ")";
        })
        .text(function(d) {
            return d.region;
        })
        .attr("display", "none");
});

