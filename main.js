// 1: SET GLOBAL VARIABLES
const margin = { top: 50, right: 30, bottom: 60, left: 70 };
const width = 900 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

// Create SVG containers for both charts
const svg1_RENAME = d3
  .select("#lineChart1") // If you change this ID, you must change it in index.html too
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

const svgBar = d3
  .select("#barChart")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

const svgPrecipLine = d3
  .select("#lineChart2")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

// (If applicable) Tooltip element for interactivity
// const tooltip = ...

// 2.a: LOAD...
d3.csv("data/weather.csv").then((data) => {
  // 2.b: ... AND TRANSFORM DATA
  // Parse date and filter relevant columns
  data.forEach((d) => {
    d.date = d3.timeParse("%m/%d/%Y")(d.date);
    d.average_max_temp = +d.average_max_temp;
    d.actual_precip = +d.actual_precipitation;
  });

  // Group data by city
  const cities = Array.from(new Set(data.map((d) => d.city)));
  const cityData = cities.map((city) => ({
    city: city,
    values: data
      .filter((d) => d.city === city)
      .map((d) => ({ date: d.date, temp: d.average_max_temp })),
  }));
  console.log("Transformed cityData:", cityData);

  // 3.a: SET SCALES FOR CHART 1
  const x = d3
    .scaleTime()
    .domain(d3.extent(data, (d) => d.date))
    .range([0, width]);
  const y = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d.average_max_temp) + 10])
    .range([height, 0]);

  // Color scale for cities
  const color = d3
    .scaleOrdinal()
    .domain(cities)
    .range(["#4285F4", "#EA4335", "#FBBC05", "#34A853", "#FF6D01", "#00B9E6"]);

  // 4.a: PLOT DATA FOR CHART 1
  const line = d3
    .line()
    .x((d) => x(d.date))
    .y((d) => y(d.temp));

  svg1_RENAME
    .selectAll(".line")
    .data(cityData)
    .enter()
    .append("path")
    .attr("class", "line")
    .attr("fill", "none")
    .attr("stroke", (d) => color(d.city))
    .attr("stroke-width", 2)
    .attr("d", (d) => line(d.values));

  // 5.a: ADD AXES FOR CHART 1
  svg1_RENAME
    .append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%m/%d/%Y")).ticks(8))
    .selectAll("text")
    .attr("transform", "rotate(35)")
    .style("text-anchor", "start");

  svg1_RENAME.append("g").call(d3.axisLeft(y));

  // 6.a: ADD LABELS FOR CHART 1
  // Y axis label
  svg1_RENAME
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", -50)
    .attr("x", -height / 2)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .text("Max Temp (°F)");

  // 7.a: ADD INTERACTIVITY FOR CHART 1
  // tooltip
  const tooltip = d3
    .select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("background", "#fff")
    .style("border", "1px solid #ccc")
    .style("padding", "8px")
    .style("pointer-events", "none")
    .style("opacity", 0);

  // circles for tooltip interactivity
  cityData.forEach((cityObj) => {
    svg1_RENAME
      .selectAll(`.dot-${cityObj.city.replace(/\s/g, "")}`)
      .data(cityObj.values)
      .enter()
      .append("circle")
      .attr("class", `dot dot-${cityObj.city.replace(/\s/g, "")}`)
      .attr("cx", (d) => x(d.date))
      .attr("cy", (d) => y(d.temp))
      .attr("r", 3)
      .attr("fill", color(cityObj.city))
      .on("mouseover", function (event, d) {
        tooltip.transition().duration(100).style("opacity", 0.9);
        tooltip
          .html(
            `<strong>${cityObj.city}</strong><br>${d3.timeFormat("%b %d, %Y")(
              d.date
            )}<br>Max Temp: ${d.temp}°F`
          )
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseout", function () {
        tooltip.transition().duration(200).style("opacity", 0);
      });
  });

  // legend
  const legend = svg1_RENAME
    .selectAll(".legend")
    .data(cities)
    .enter()
    .append("g")
    .attr("class", "legend")
    .attr("transform", (d, i) => `translate(${width - 110},${i * 25 + 135})`);

  legend
    .append("rect")
    .attr("x", 0)
    .attr("width", 18)
    .attr("height", 6)
    .style("fill", color);

  legend
    .append("text")
    .attr("x", 28)
    .attr("y", 5)
    .attr("dy", ".32em")
    .style("font-size", "18px")
    .style("fill", "black")
    .style("font-weight", "bold")
    .text((d) => d);

  // ==========================================
  //         CHART 2 (if applicable)
  // ==========================================

  const barCleanData = data.filter(d =>
    d.actual_precip != null
    && d.cities != ''
  );

  console.log("Bar Clean Data", barCleanData);

  const barMap = d3.rollup(barCleanData,
    v => d3.sum(v,d => d.actual_precip),
    d => d.city
  );

  console.log("Bar Map", barMap);

  const barFinalArr = Array.from(barMap, 
    ([city, sum]) => ({ city, sum })
  )
  .sort((a,b) => a.sum - b.sum);

  console.log("Bar Final", barFinalArr);

  // 3.b: SET SCALES FOR CHART 2
  const xBarScale = d3.scaleBand() // Use instead of scaleLinear() for bar charts
    .domain(barFinalArr.map(d => d.city)) // Extract unique categories for x-axis
    .range([0, width]) // START low, INCREASE
    .padding(0.1);

  const yBarScale = d3.scaleLinear()
    .domain([0, 50])
    .range([height,0]);
  

  // 4.b: PLOT DATA FOR CHART 2

  svgBar.selectAll("rect")
		.data(barFinalArr)
		.enter()
		.append("rect")
      .attr("x", d => xBarScale(d.city)) // horizontal position
      .attr("y", d => yBarScale(d.sum)) // vert position
      .attr("width", xBarScale.bandwidth())
      .attr("height", d => height - yBarScale(d.sum))
      .attr("fill", "blue");

  // 5.b: ADD AXES FOR CHART

  svgBar.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(xBarScale));

  svgBar.append("g")
    .call(d3.axisLeft(yBarScale));

  // 6.b: ADD LABELS FOR CHART 2

  //svgBar.append("text")
    //  .attr("class", "title")
    //  .attr("x", width / 2)
    //  .attr("y", -margin.top / 2)
    //  .text("Actual Precipitation");

    // 7.b x-axis label
    svgBar.append("text")
      .attr("class", "axis-label")
      .attr("x", width / 2)
      .attr("y", height + (margin.bottom / 2) + 10)
      .text("Cities");

    // 7.c y-axis label
    svgBar.append("text")
      .attr("class", "axis-label")
      .attr("transform", "rotate(-90)")
      .attr("y", -margin.left / 2)
      .attr("x", -height / 2)
      .text("Actual Precipitation Sums");

  // 7.b: ADD INTERACTIVITY FOR CHART 2


  // ==========================================
  //         CHART 3 (if applicable)
  // ==========================================

  const cityPrecipData = cities.map((city) => ({
    city: city,
    values: data
      .filter((d) => d.city === city)
      .map((d) => ({ date: d.date, precip: d.actual_precip })),
  }));
  console.log("Transformed cityPrecipData:", cityPrecipData);

  // 3.b: SET SCALES FOR CHART 3
  const xPrecipDate = d3
    .scaleTime()
    .domain(d3.extent(data, (d) => d.date))
    .range([0, width]);
  const yPrecip = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d.actual_precip) + 2])
    .range([height, 0]);

  // 4.b: PLOT DATA FOR CHART 3
  const precipLine = d3.line()
  .x((d) => xPrecipDate(d.date))
  .y((d) => yPrecip(d.precip))

  svgPrecipLine.selectAll(".line")
  .data(cityPrecipData)
  .enter()
  .append("path")
  .attr("class", "line")
  .attr("fill", "none")
  .attr("stroke", (d) => color(d.city))
  .attr("stroke-width", 2)
  .attr("d", (d) => precipLine(d.values))

  // 5.b: ADD AXES FOR CHART

  svgPrecipLine.append("g")
  .attr("transform", `translate(0, ${height})`)
  .call(d3.axisBottom(xPrecipDate)
    .tickFormat(d3.timeFormat("%m/%d/%Y"))
    .ticks(8)
  )
  .selectAll("text")
  .attr("transform", "rotate(35)")
  .style("text-anchor", "start");

  svgPrecipLine.append("g")
    .call(d3.axisLeft(yPrecip)
  )

  // 6.b: ADD LABELS FOR CHART 3
  svgPrecipLine
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", -50)
    .attr("x", -height / 2)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .text("Rainfall (in)");

  // Adding a Precipitation legend
  const precipLegend = svgPrecipLine.selectAll(".legend")
    .data(cities)
    .enter()
    .append("g")
    .attr("class", "legend")
    .attr("transform", (d, i) => `translate(${i * 125}, ${height - 325})`);

  precipLegend
    .append("rect")
    .attr("x", 40)
    .attr("width", 18)
    .attr("height", 6)
    .style("fill", color);

  precipLegend
    .append("text")
    .attr("x", 70)
    .attr("y", 5)
    .attr("dy", ".32em")
    .style("font-size", "12.5px")
    .style("fill", "black")
    .style("font-weight", "none")
    .text((d) => d);

  // 7.b: ADD INTERACTIVITY FOR CHART 3
});
