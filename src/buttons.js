import * as d3 from "d3";


var hidden_header = false;

var headerbtn = container.append("button")
    .attr("class", "container__button")
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


export default {headerbtn, divide, country_divide, combine};