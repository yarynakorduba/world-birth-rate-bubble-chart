import * as d3 from "d3";
import * as scale from "d3-scale";
import {  sort } from "d3-array";
import { forceSimulation } from "d3-force";
import { format } from "d3-format";


var diameter = 800; //max height
var width =800;

var f = d3.format("d");

var color = d3.scaleLinear()
    .domain([0, 50])
    .range(["#90CAF9", "#0D47A1"]);

var textscale = d3.scaleSqrt()
    .domain([6, 50]).range([7, 13]);

var scaleRadius = d3.scaleSqrt().domain([6, 50]).range([6, 30]);

 
 var header = d3.select("body")
    .append("header")
    .append("h3")
    .text("Countries birth rate visualization per 1000 population");

 var svg = d3.select("body")
    .append("svg")
    .attr("width", width)
    .attr("height", diameter)
    .append("g")
    .attr("transform", "translate(0,0)")    
    .attr("class", "bubble");

var simulation = forceSimulation()
    .force("x", d3.forceX(width / 2 + 100).strength(0.05))
    .force("y", d3.forceY(diameter / 2-105).strength(0.05))
    .force("collide", d3.forceCollide(
        function(d) {
            return scaleRadius(d.birth);
        }));


d3.csv("/data/data.csv", function(data) {

    let tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("display", "none");


    var circles = svg.selectAll("country")
        .data(data)
        .enter().append("circle")
        .attr("class", "country")
        .attr("r", function(d) {
            return scaleRadius(d.birth)})
        .on("click mouseenter mouseover focus", function(d) {
            console.log(d.country);

        tooltip.transition()
                .duration(2)  
                .style("opacity", .9)
                .style("display", "block");  

        tooltip.html("country " + d.country + "\n" + d.birth)
            .style("left", (d3.event.pageX) + "px")
            .style("top", d3.event.pageY + "px");
        })
        .on("mouseout", function(d) {
            tooltip.transition().style("display", "none");
            d3.select(this).style("stroke-opacity", "0");
        })
        .style("fill", function(d) { 
        return color(d.birth); 
      });

    var text =svg.selectAll("country")
        .data(data)
        .enter()
        .append("text")
        .attr("class", "countryname")
        .text(function(d) {
            return d.code;
        })
        .attr("font-size", function(d) { 
            console.log(f(textscale(d.birth)));
            return f(textscale(d.birth));
        })
        .on("click mouseenter mouseover focus", function(d) {
            tooltip
            .transition()
                .duration(2)  
                .style("opacity", .9)
                .style("display", "block");  
            tooltip.html("country " + d.country + "\n" + d.birth)
            .style("left", (d3.event.pageX) + "px")
            .style("top", d3.event.pageY + "px");
        })
        .on("mouseout", function(d) {
            tooltip.transition().style("display", "none");
        })
        .attr("fill", "white");

    simulation.nodes(data)
        .on("tick", ticked);

    function ticked() {
        circles
        .attr("cx", function(d) {
            return d.x;
        })
        .attr("cy", function(d) {
            return d.y;
        })
        .attr("id", function(d) {return d.country});

        text
        .attr("x", function(d) {
            return d.x-12;
        })
        .attr("y", function(d) {
            return d.y+5;
        });
    }


    function sortingOrder(data) {
        return data.sort(function (a, b) {
            return +a.birth - b.birth;
    });
    };

    var maxmin = d3.select("body")
        .data(data)
        .append("div")
        .attr("class", "maxmin");

    var maxminhead = maxmin.append("h3").text("Bound birth rate values:")

    var max = maxmin.append("div").attr("class", "maxminval")
        .text(function(d) {
            return "maximal value: " + sortingOrder(data)[data.length-1].country +
            " " + sortingOrder(data)[data.length-1].birth + '\n';
            });
    var min = maxmin.append("div").attr("class", "maxminval ")
        .text(function(d) {
            return "\nminimal value: " + sortingOrder(data)[0].country + " " +
            sortingOrder(data)[0].birth;
            });

});

 