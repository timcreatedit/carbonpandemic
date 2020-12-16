var data2019 = [1.1,2.2,4.46,2.12,1.36,5.002445,4.1242];
var data2020 = [10,20,30,10,5,5,20];

var svg1 = d3.select("#pieChart2019");
var svg2 = d3.select("#pieChart2020");

let g1 = svg1.append("g")
    .attr("transform", "translate(150,120)");
let g2 = svg2.append("g")
    .attr("transform", "translate(150,120)");

var pie = d3.pie();

var arc = d3.arc()
    .innerRadius(0)
    .outerRadius(100);

var arcs1 = g1.selectAll("arc")
    .data(pie(data2019))
    .enter()
    .append("g");
var arcs2 = g2.selectAll("arc")
    .data(pie(data2020))
    .enter()
    .append("g");

arcs1.append("path")
    .attr("fill", (data, i)=>{
        return d3.schemeSet3[i]; //mapping the data to colors
    })
    .attr("d", arc);

arcs2.append("path")
    .attr("fill", (data, i)=>{
        return d3.schemeSet3[i]; //mapping the data to colors
    })
    .attr("d", arc);