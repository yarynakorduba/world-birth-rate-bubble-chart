import * as d3 from "d3";
// import * as scale from "d3-scale";
import {  sort } from "d3-array";
import { forceSimulation } from "d3-force";
// import { format } from "d3-format";
import { geoAitoff } from "d3-geo-projection";
// import { geoPath } from "d3-geo";
import * as topojson from 'topojson';


var margin = {top: 0, left: 20, right: 20, bottom: 0};
var height = window.innerHeight - margin.top - margin.bottom;
var width = window.innerWidth - margin.left - margin.right;
var centered;
var hidden_header = false;
var on_a_map = false;
var f = d3.format("d");

//scales
var colorScale = d3.scaleLinear()
    .domain([0, 50])
    .range(["#c2ffcf", "#000095"]);
var textscale = d3.scaleSqrt()
    .domain([6, 50]).range([7, 13]);
var scaleRadius = d3.scaleSqrt().domain([6, 50]).range([4, 30]);
var scaleMapRadius = d3.scaleSqrt().domain([6, 50]).range([3, 8]);

var projection = geoAitoff()
    .scale(220)
    .translate([width / 2, height / 2+50]);
var path = d3.geoPath().projection(projection);

//Force configurations
//Display: All
var ForceXCombine = d3.forceX(width / 2);
var ForceYCombine = d3.forceY(height / 2+20);

//Display: On a map
var forceXCountryDivide = d3.forceX(function (d) {
    return projection([d.long, d.lat])[0];
});
var forceYCountryDivide = d3.forceY(function (d) {
    return projection([d.long, d.lat])[1];
});

//Display: By region
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


var container = d3.select("body")
    .append("div")
    .attr("class", "container");


//Button Configurations
var combine = container.append("button")
    .attr("id", "combine")
    .attr("class", "container__button");
combine.text("All");

var divide = container.append("button")
    .attr("id", "divide")
    .attr("class", "container__button");
divide.text("By region");

var country_divide = container.append("button")
    .attr("id", "country_divide")
    .attr("class", "container__button");
country_divide.text("On a map");

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


let tooltip = container.append("div")
    .attr("class", "container__tooltip")
    .style("display", "none");

var displayTooltip = function (country, birth, state) {
    tooltip.html("country " + country + "\n" + birth)
        .style("left", (d3.event.pageX) + "px")
        .style("top", d3.event.pageY + "px");
    if (state === "show") {

        tooltip
            .transition()
            .duration(1000)
            .style("opacity", .9)
            .style("display", "block");
    }
    else { tooltip.transition().duration(1000).style("display", "none");
    }
};


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
            map.on("click", clicked)
                .on("mouseenter mouseover focus", function(d) {
                return displayTooltip(d.properties.name, rateById[d.properties.name], "show");
            })
            .on("mouseout", function (d) {
                return displayTooltip(d.properties.name, rateById[d.properties.name], "hide");
            });

        var pathlabel = svg.selectAll(".path-label")
        .data(geojson.features)
        .enter().append("text")
        .attr("class", "container__pathlabel")
        .attr("transform", function(d) {
            if (longById[d.properties.name]) {
            return "translate(" +
            projection([longById[d.properties.name], latById[d.properties.name]]) + ")"; }})
        .attr("dy", ".15em")
        .text(function(d) { return codeById[d.properties.name]; })
            .attr("font-size", "8")
            .attr("opacity", "0");//.transition().duration(1500);

        var interiors = topojson.mesh(topology, topology.objects.countries1, function (a, b) {
            return a !== b;
        }); //to merge borders

        function clicked(d) {
            var x, y, k;
            console.log("clicked ", centered);
            if (d && centered !== d) {
                var centroid = path.centroid(d);
                x = centroid[0];
                y = centroid[1];
                centered = d;
                k = 5;

            }else{
                x = width/2;
                y = height/2;
                k = 1;
                centered = null;
            }

            svg.selectAll("path")
                .classed("active", centered && function(d) { return d === centered; });

            svg.transition()
                .duration(750)
                .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")");

        }



        var circles = svg.selectAll("country")
            .data(data)
            .enter().append("circle")
            .attr("class", "container__country")
            .attr("r", function (d) {
                return scaleRadius(d.birth)
            })
            .on("click mouseenter mouseover focus", function(d) {
                return displayTooltip(d.country, d.birth, "show");})
            .on("mouseout", function (d) {
                return displayTooltip(d.country, d.birth, "hide");
            });


        circles.style("fill", function (d) {
            return colorScale(d.birth);
        });

        var text = svg.selectAll("country")
            .data(data)
            .enter()
            .append("text")
            .attr("class", "container__countryname")
            .text(function (d) {
                return d.code;
            })
            .attr("font-size", function (d) {
                return f(textscale(d.birth));
            })
            .on("click mouseenter mouseover focus", function(d) {
                return displayTooltip(d.country, d.birth, "show");})
            .on("mouseout", function (d) {
                return displayTooltip(d.country, d.birth, "hide");
            });

        var simulation = forceSimulation()
            .force("x", ForceXCombine.strength(0.09))
            .force("y", ForceYCombine.strength(0.09))
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


//Button "On a map" functioning
        country_divide.on("click", function () {
            text.attr("opacity" ,"0");
            on_a_map = true;
            map.attr("opacity", "1").attr("display", "inline");
            circles.transition().duration(1000).attr("r", function (d) {
            return scaleMapRadius(d.birth);
        });

    simulation
        .force("x", forceXCountryDivide.strength(0.09))
        .force("y", forceYCountryDivide.strength(0.09))
        .force("collide", d3.forceCollide(
            function (d) {
                return scaleMapRadius(d.birth);
            }))
        .alpha(0.5).restart();

        d3.timeout(stylemap,500);
        d3.timeout(stylecircles,1000);


});
    var stylecircles = function () {
        circles.transition().duration(1500).attr("display", "none");
    };

    var stylemap = function() {
        map.transition().duration(1000).style("fill", function (d) {
            return colorScale(rateById[d.properties.name]);
        });
        pathlabel.attr("opacity", "1").attr("display", "inline");
        svg.selectAll(".container__regionname").attr("display", "none");

    };


//Button "By region" functioning
        divide.on("click", function () {

            text.attr("opacity" ,"1");
            pathlabel.attr("display", "none");
            if (on_a_map === true) {
                on_a_map = false;
                circles.transition().duration(1000)
                    .attr("display", "inline")
                    .attr("r", function (d) {
                        return scaleRadius(d.birth);
                    });
                map.transition().duration(500).attr("opacity", 0)
                    .transition()
                    .attr("display", "none");
            }

            simulation
                .force("x", forceXDivide.strength(0.11))
                .force("y", forceYDivide.strength(0.11))
                .force("collide", d3.forceCollide(
                    function (d) {
                        return scaleRadius(d.birth);
                    }))
                .alpha(0.5)
                .restart();

            map.style("fill", "#cccccc");
            svg.selectAll(".container__regionname").attr("display", "inline");
        });



//Button "All" functioning
        combine.on("click", function () {
            text.attr("opacity" ,"1");
            pathlabel.attr("display", "none");
            if (on_a_map === true) {
                on_a_map = false;
                    circles.transition().duration(1000)
                    .attr("display", "inline")
                    .attr("r", function (d) {
                            return scaleRadius(d.birth);
                        });
                map.transition().duration(1000)
                    .attr("display", "none");

            }
            simulation
                .force("x", ForceXCombine.strength(0.07))
                .force("y", ForceYCombine.strength(0.07))
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

