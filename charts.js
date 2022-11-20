let availableCountries = [];
const margin = {
        top: 30,
        right: 30,
        bottom: 30,
        left: 30
    },
    width = window.innerWidth / 6.5 - margin.left - margin.right,
    height = window.innerWidth / 6.5 - margin.top - margin.bottom;


// append the svg object to the body of the page
const svg = d3.select("#data_vis")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// const _URL = "https://raw.githubusercontent.com/slmaaa/COMP4462-Project-Vis/main/excess-mortality-p-scores-projected-baseline-by-age.csv";

// fetch(_URL, {
//     mode: "cors",
//     headers: {
//         'Access-Control-Allow-Origin': '*'
//     }
// }).then((response) => d3.csvParse(response.text)).then((data) => {
//     console.log(data);
// });
isInsufficient = (row) => {
    if (row["p_proj_0_14"].length === 0) return true;
    if (row["p_proj_15_64"].length === 0) return true;
    if (row["p_proj_65_74"].length === 0) return true;
    if (row["p_proj_75_84"].length === 0) return true;
    if (row["p_proj_85p"].length === 0) return true;
    return false;
}
const age_groups = ["0 - 14", "15 - 64", "65 - 74", "75 - 84", "Over 85"]
const p_proj_age_groups = ["p_proj_0_14", "p_proj_15_64", "p_proj_65_74", "p_proj_75_84", "p_proj_85p"]
const processRow = (row) => {
    row['date'] = d3.timeParse("%Y-%m-%d")(row['Day']);
    p_proj_age_groups.forEach((age_group, i) => {
        row[age_groups[i]] = +row[age_group];
        delete row[age_group];
    });
    return row;
}

d3.csv("excess-mortality-p-scores-projected-baseline-by-age.csv").then((data) => {
    const excessMortalityPScoresProjectedBaselineByAgeFiltered = data.filter(row => !isInsufficient(row));
    availableCountries = new Set(excessMortalityPScoresProjectedBaselineByAgeFiltered.map(row => row.Entity));

    const processedData = excessMortalityPScoresProjectedBaselineByAgeFiltered.map(processRow);

    const datum = d3.group(processedData, d => d.Entity);

    let _data = datum.get(datum.keys().next().value);
    let _long_data = _data.flatMap(row =>
        age_groups.map((age_group) => {
            return {
                date: row.date,
                age_group: age_group,
                Entity: row.Entity,
                p: row[age_group]
            }
        })
    )
    let _grouped_data = d3.group(_long_data, d => d.age_group);

    d3.select("#selectButton")
        .selectAll('myOptions')
        .data(datum.keys())
        .enter()
        .append('option')
        .text(function(d) {
            return d;
        }) // text showed in the menu
        .attr("value", function(d) {
            return d;
        }) // corresponding value returned by the button

    const svg = d3.select("#data_vis")
        .selectAll("uniqueChart")
        .data(_grouped_data)
        .join("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`)

    // Add X axis --> it is a date format
    const x = d3.scaleTime()
        .domain(d3.extent(_long_data, d => d.date))
        .range([0, width]);
    svg
        .append("g")
        .attr("class", "x axis")
        .attr("transform", `translate(0, ${height} )`)
        .call(d3.axisBottom(x).ticks(3));
    const y = d3.scaleLinear()
        .domain(d3.extent(_long_data, d => d.p))
        .range([height, 0]);
    svg.append("g")
        .attr("class", "y axis")
        .call(d3.axisLeft(y).ticks(5));
    const color = d3.scaleOrdinal()
        .domain(age_groups)
        .range(d3.schemeDark2);

    svg
        .append("path")
        .attr("class", "area")
        .attr("fill", d => color(d[0]))
        .attr("stroke", "none")
        .attr("d", d => {
            return d3.area()
                .x(d => x(d.date))
                .y0(y(0))
                .y1(d => y(+d.p))
                (d[1])
        })
    svg
        .append("text")
        .attr("text-anchor", "start")
        .attr("y", -5)
        .attr("x", 0)
        .text(d => d[0])
        .style("fill", d => color(d[0]))

    function update1(selectedGroup) {
        _data = datum.get(selectedGroup);
        _long_data = _data.flatMap(row =>
            age_groups.map((age_group) => {
                return {
                    date: row.date,
                    age_group: age_group,
                    p: row[age_group],
                    Entity: row.Entity
                }
            })
        )
        _grouped_data = d3.group(_long_data, d => d.age_group);
        const x = d3.scaleTime()
            .domain(d3.extent(_long_data, d => d.date))
            .range([0, width]);
        svg
            .select(".x.axis").call(d3.axisBottom(x).ticks(3));


        const y = d3.scaleLinear()
            .domain(d3.extent(_long_data, d => d.p))
            .range([height, 0]);
        svg
            .select(".y.axis")
            .transition().duration(1000)
            .call(d3.axisLeft(y).ticks(5));
        svg.data(_grouped_data)
            .transition()
            .duration(1000)
            .select(".area")
            .attr("d", d => {
                return d3.area()
                    .x(d => x(d.date))
                    .y0(y(0))
                    .y1(d => y(+d.p))
                    (d[1])

            })


    }

    var margin_radar = {
            top: 100,
            right: 100,
            bottom: 100,
            left: 250
        },
        width_radar = Math.min(10, window.innerWidth - 10) - margin_radar.left - margin_radar.right,
        height_radar = Math.min(width_radar, window.innerHeight - margin_radar.top - margin_radar.bottom - 20);
    const r = 200
    const dimensions = ["people_fully_vaccinated_per_hundred", "median_age", "human_development_index", "population_density", "aged_65_older", "life_expectancy"]
    d3.csv("owid-covid-data.csv", function(d) {
        const result = {};
        result["location"] = d.location;
        result["date"] = d.date;
        result["people_fully_vaccinated_per_hundred"] = +d.people_fully_vaccinated_per_hundred / 100;
        result["median_age"] = +d.median_age / 100;
        result["human_development_index"] = +d.human_development_index;
        result["population_density"] = +d.population_density / 1000;
        result["aged_65_older"] = +d.aged_65_older / 100;
        result["life_expectancy"] = +d.life_expectancy / 100;

        return result;
    }).then(data => {
        data = data.filter(row => availableCountries.has(row.location));

        const groupByLocation = d3.group(data, d => d.location);
        console.log(groupByLocation);
        const ticks = [0.2, 0.4, 0.6, 0.8, 1]
        var color = d3.scaleOrdinal()
            .range(["#EDC951", "#CC333F", "#00A0B0"]);
        let svg = d3.select("body").append("svg")
            .attr("width", 400)
            .attr("height", 400)
            .attr('viewBox',
                `-${margin.left},
      -${margin.top},
      ${r * 2 + margin.left + margin.right},
      ${r * 2 + margin.bottom + margin.top}`)
            .attr("transform", `translate(${margin_radar.left},${margin.top})`)




        const radialLine = d3.lineRadial()

        const yScale = d3.scaleLinear()
            .range([0, r])
            .domain([0, 1])
        dimensions.forEach((dimension, i) => {
            // We first build an axis at the origin, enclosed inside an "g" element
            // then transform it to the right position and right orientation
            const g = svg.append('g')
                .attr('transform', `translate(${r}, ${r}) rotate(${i * 60})`)

            // Combining a left oriented axis with a right oriented axis
            // to make an axis with tick marks on both side
            // Reminded that, these are "g" elements inside the outer "g" element
            // and will be transformed to the right position with its parent element
            g.append('g')
                .call(d3.axisLeft(yScale).tickFormat('').tickValues(ticks))
            g.append('g')
                .call(d3.axisRight(yScale).tickFormat('').tickValues(ticks))

            // Add a text label for each axis, put it at the edge
            // Again, this "text" element is inside the outer "g" element,
            // and will be transformed to the right position with its parent element
            g.append('text')
                .text(dimension)
                .attr('text-anchor', 'middle')
                .attr('transform', `translate(0, -${r + 10})`)
        })
        console.log(groupByLocation.get("United States")[groupByLocation.get("United States").length - 1])
        svg.select(".radar").remove();
        svg.append('g')
            .selectAll('path')
            .data([groupByLocation.get("United States")[groupByLocation.get("United States").length / 2]])
            .enter()
            .append('path')
            .attr("class", "radar")
            .attr('d', d =>
                radialLine([
                    d.people_fully_vaccinated_per_hundred || 0,
                    d.median_age || 0,
                    d.human_development_index || 0,
                    d.population_density || 0,
                    d.aged_65_older || 0,
                    d.life_expectancy || 0,
                    d.people_fully_vaccinated_per_hundred || 0 // hp again to close the loop
                ].map((v, i) => [Math.PI * 2 * i / 6 /* radian */ , yScale(v) /* distance from the origin */ ]))
            )
            // Move to the center
            .attr('transform', `translate(${r}, ${r})`)
            .attr('stroke', 'SteelBlue')
            .attr('stroke-width', 5)
            .attr('fill', 'rgba(70, 130, 180, 0.3)')
        const update2 = (selected) => {

            d3.select('.radar').remove();
            svg.append('g')
                .selectAll('path')
                .data([groupByLocation.get(selected)[groupByLocation.get(selected).length / 2]])
                .enter()
                .append('path')
                .attr("class", "radar")
                .attr('d', d =>
                    radialLine([
                        d.stringency_index || 0,
                        d.median_age || 0,
                        d.human_development_index || 0,
                        d.population_density || 0,
                        d.aged_65_older || 0,
                        d.life_expectancy || 0,
                        d.stringency_index || 0 // hp again to close the loop
                    ].map((v, i) => [Math.PI * 2 * i / 6 /* radian */ , yScale(v) /* distance from the origin */ ]))
                )
                // Move to the center
                .attr('transform', `translate(${r}, ${r})`)
                .attr('stroke', 'SteelBlue')
                .attr('stroke-width', 5)
                .attr('fill', 'rgba(70, 130, 180, 0.3)')

        }

        d3.select("#selectButton").on("change", function(event, d) {
            // recover the option that has been chosen
            const selectedOption = d3.select(this).property("value")
                // run the updateChart function with this selected option
            update1(selectedOption);
            update2(selectedOption);
        })
    })

});