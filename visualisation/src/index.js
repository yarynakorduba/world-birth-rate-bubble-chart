import * as d3 from "d3";
import * as scale from "d3-scale";

// d3.tip = tip;

import { forceSimulation } from "d3-force";

 // import { nodes, max, min, pack, hierarchy, select, selectAll, csv, extent, scaleLinear } from "d3";

    var diameter = 800; //max size of the bubbles
    var width =1000;

    // var color = d3.scaleSequential(d3.interpolateRainbow); //color category


var color = d3.scaleLinear()
    .domain([0, 50])
    .range(["#90CAF9", "#0D47A1"]);

var textscale = d3.scaleLinear()
    .domain([6, 50]).range([10, 14]);

var scaleRadius = d3.scaleSqrt().domain([6, 50]).range([6, 40]);


 var svg = d3.select("body")
    .append("svg")
    .attr("width", width)
    .attr("height", diameter)
    .append("g")
    .attr("transform", "translate(0,0)")    
    .attr("class", "bubble");

var simulation = forceSimulation()
    .force("x", d3.forceX(width / 2).strength(0.05))
    .force("y", d3.forceY(diameter / 2).strength(0.05))
    .force("collide", d3.forceCollide(
        function(d) {
            return scaleRadius(d.birth);
        }));


//var data = [4, 8, 15, 16, 23, 42];

d3.csv("/data/data.csv", function(data) {

    let tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);


    var circles = svg.selectAll("country")
        .data(data)
        .enter().append("circle")
        .attr("class", "country")
        .attr("r", function(d) { 
            return scaleRadius(d.birth)})
        // .attr("fill", color)
        .on("click mouseenter mouseover focus", function(d) {
            console.log(d.country);
            // tooltip.transition()
            // .duration(5)  
            //     .style("opacity", 0);
            tooltip.transition()
                .duration(2)  
                .style("opacity", .9);  
            tooltip.html("country " + d.country + "\n" + d.birth)
            .style("left", (d3.event.pageX) + "px")
            .style("top", d3.event.pageY + "px");
        })
        .on("mouseout", function(d) {
            tooltip.transition().style("opacity", 0);
        })
        // .on("click", function(d) {
        //     console.log(d);
        //     alert(d.country);
        // })
        .style("fill", function(d) { 
        return color(d.birth); 
      })
        ;

    var text =svg.selectAll("country")
        .data(data)
        .enter()
        .append("text")
        .attr("class", "countryname")
        .text(function(d) {
            return d.code;
        })
        .on(" click mouseenter mouseover focus", function(d) {
            tooltip.transition()
                .duration(2)  
                .style("opacity", .9);  
            tooltip.html("country " + d.country + "\n" + d.birth)
            .style("left", (d3.event.pageX) + "px")
            .style("top", d3.event.pageY + "px");
        })
        .on("mouseout", function(d) {
            tooltip.transition().style("opacity", 0);
        })
        // .on("click", function(d) {
        //     console.log(d);
        //     alert(d.country);
        // })
        .attr("font-size", 11)
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
            return d.x-7;
        })
        .attr("y", function(d) {
            return d.y+5;
        });
    }





    console.log(data[1]);



});

 