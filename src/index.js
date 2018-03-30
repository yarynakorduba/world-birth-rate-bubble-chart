import * as d3 from "d3";
import * as scale from "d3-scale";
import {  sort } from "d3-array";
import { forceSimulation } from "d3-force";
import { format } from "d3-format";
import { geoAitoff } from "d3-geo-projection";
import { geoPath } from "d3-geo";
import * as topojson from 'topojson';


var margin = {top: 0, left: 20, right: 20, bottom: 0};
var height = window.innerHeight - margin.top - margin.bottom;
var width = window.innerWidth - margin.left - margin.right;

var f = d3.format("d");

var colorScale = d3.scaleLinear()
    .domain([0, 50])
    .range(["#69a2ff", "#000095"]);
var textscale = d3.scaleSqrt()
    .domain([6, 50]).range([7, 13]);
var scaleRadius = d3.scaleSqrt().domain([6, 50]).range([4, 30]);
var scaleMapRadius = d3.scaleSqrt().domain([6, 50]).range([3, 8]);


var ForceXCombine = d3.forceX(width / 2);
var ForceYCombine = d3.forceY(height / 2+20);


 var container = d3.select("body")
    .append("div")
    .attr("class", "container");




var hidden_header = false;

var divide = container.append("button")
    .attr("id", "divide")
    .attr("class", "container__button");
divide.text("By region");

var country_divide = container.append("button")
    .attr("id", "country_divide")
    .attr("class", "container__button");
country_divide.text("On a map");

var combine = container.append("button")
    .attr("id", "combine")
    .attr("class", "container__button");
combine.text("All");


var headerbtn = container.append("button")
    .attr("class", "container__button")
    .attr("id", "legendButton")
    .text("Hide legend")
    .on("click", function() {
        hidden_header = hidden_header ? false : true;
        header.style("opacity", function() {
            return (hidden_header ? 0 : 1);
        }).style("-webkit-transition", "opacity 1s");
        d3.select(this).text(function() {
            return (hidden_header ? "Show legend" : "Hide legend");
        });
    });

let tooltip = container.append("div")
    .attr("class", "container__tooltip")
    .style("display", "none");


var makeTooltip = function (country, birth, state) {
    tooltip.html("country " + country + "\n" + birth)
        .style("left", (d3.event.pageX) + "px")
        .style("top", d3.event.pageY + "px");
    if (state === "show") {

        tooltip
            .transition()
            .duration(2)
            .style("opacity", .9)
            .style("display", "block");
    }
    else { tooltip.transition().style("display", "none");
    }
};

 var header = container
    .append("header")
    .attr("class", "container__header");
     header.append("h3")
         .text("Countries birth rate visualization per 1000 population");



 var svg = container.append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("class", "container__svg")
    .append("g")
    .attr("class", "container__bubble");

var projection = geoAitoff()
    .scale(220)
    .translate([width / 2, height / 2+50]);

var path = d3.geoPath().projection(projection);

d3.queue()
    .defer(d3.json, "/data/borders.json")
    .defer(d3.csv, "/data/data.csv")
    .await(ready);

function ready(error, topology, data) {
    var rateById = {}; //dictionary
    var codeById = {};
    var latById = {};
    var longById = {};

    data.forEach(function(data) {
        rateById[data.country] = +data.birth;
        codeById[data.country] = data.code;
        latById[data.country] = +data.lat;
        longById[data.country] = +data.long;
    });

     var geojson = topojson.feature(topology, topology.objects.countries1);

        var map = svg.selectAll("path")
            .data(geojson.features)
            .enter().append("path")
            .attr("d", path)
            .attr("class", "container__path")
            .attr("id", function (d) {
                d.properties.name;
            })
            .attr("opacity", "0");
            map.on("click mouseenter mouseover focus", function(d) {
                return makeTooltip(d.properties.name, rateById[d.properties.name], "show");
            })
            .on("mouseout", function (d) {
                return makeTooltip(d.properties.name, rateById[d.properties.name], "hide");
            });

        var pathlabel = svg.selectAll(".path-label")
        .data(geojson.features)
        .enter().append("text")
        .attr("class", "country__pathlabel")
        .attr("transform", function(d) {
            if (longById[d.properties.name]) {
            return "translate(" +
            projection([longById[d.properties.name], latById[d.properties.name]]) + ")"; }})
        .attr("dy", ".15em")
        .text(function(d) { return codeById[d.properties.name]; })
            .attr("font-size", "8")
            .attr("opacity", "0");




        var interiors = topojson.mesh(topology, topology.objects.countries1, function (a, b) {
            return a !== b;
        });

    var forceXCountryDivide = d3.forceX(function (d) {
        return projection([d.long, d.lat])[0];
    });

    var forceYCountryDivide = d3.forceY(function (d) {
        return projection([d.long, d.lat])[1];
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
                return 1 / 3 * height+40;
            case 'America':
                return 2 / 3 * height+60;
            case 'Asia':
                return 1 / 3 * height+10;
            case 'Europe':
                return 2 / 3 * height+10;
            case 'Oceania':
                return 1 / 3 * height+10;
        }
    });



        var circles = svg.selectAll("country")
            .data(data)
            .enter().append("circle")
            .attr("class", "container__country")
            .attr("r", function (d) {
                return scaleRadius(d.birth)
            })
            .on("click mouseenter mouseover focus", function(d) {
                return makeTooltip(d.country, d.birth, "show");})
            .on("mouseout", function (d) {
                return makeTooltip(d.country, d.birth, "hide");
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
            .on("click mouseenter mouseover focus", function(d) {
                return makeTooltip(d.country, d.birth, "show");})
            .on("mouseout", function (d) {
                return makeTooltip(d.country, d.birth, "hide");
            })
            .attr("fill", "white");

        var simulation = forceSimulation()
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



        country_divide.on("click", function () {
            text.attr("opacity" ,"0");
            map.attr("opacity", "1");
            circles.attr("r", function (d) {
            return scaleMapRadius(d.birth);
        });

    simulation
        .force("x", forceXCountryDivide)
        .force("y", forceYCountryDivide)
        .force("collide", d3.forceCollide(
            function (d) {
                return scaleMapRadius(d.birth)-1;
            }))
        .alpha(0.5)
        .restart();

        d3.timeout(stylemap,500);
        d3.timeout(stylecircles,1000);


});
    var stylecircles = function () {

        circles.transition().duration(1000).attr("opacity", "0");
    };

    var stylemap = function() {
        map.transition().duration(1500).style("fill", function (d) {
            return colorScale(rateById[d.properties.name]);
        });
        pathlabel.attr("opacity", "1");
        svg.selectAll(".container__regionname").attr("display", "none");
    };


//Button for common displaying



        divide.on("click", function () {
            text.attr("opacity" ,"1");
            map.attr("opacity", "0");
            pathlabel.attr("opacity", "0");

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

            map.style("fill", "#cccccc");
            svg.selectAll(".container__regionname").attr("display", "inline");
        });

//Button for displaying by regions


        combine.on("click", function () {
            map.attr("opacity", "0");
            text.attr("opacity" ,"1");
            pathlabel.attr("opacity", "0");

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

            map.style("fill", "#cccccc");
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
            console.log(d.region + " " + d.posx*width + " " + d.posy*height);
            return "translate(" + Math.round(d.posx*width) + "," + Math.round(d.posy*height) + ")";
        })
        .text(function(d) {
            return d.region;
        })
        .attr("display", "none");
});

