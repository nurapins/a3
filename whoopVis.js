class whoopVis {
    constructor(parentElement, data) {
        this.parentElement = parentElement;
        this.data = data;
        this.displayData = [];

        this.initVis();
    }

    initVis() {
        let vis = this;

        const legendColors = [{color: "#28a745", label: "Optimal"},
                                               {color: "#ffc107", label: "Sufficient"},
                                               {color: "#dc3545", label: "Bad :( (Probably sick)"}]
        vis.margin = { top: 40, right: 30, bottom: 50, left: 60 };
        vis.updateDimensions();

        vis.svg = d3.select(vis.parentElement)
            .append("g")
            .attr("transform", `translate(${vis.margin.left}, ${vis.margin.top})`);

        vis.x = d3.scaleTime().range([0, vis.width]);
        vis.y = d3.scaleLinear().range([vis.height, 0]).domain([0, 100]);

        vis.xAxis = d3.axisBottom(vis.x);
        vis.yAxis = d3.axisLeft(vis.y);

        vis.gXAxis = vis.svg.append("g")
            .attr("class", "x-axis axis-label")
            .attr("transform", `translate(0, ${vis.height})`);

        vis.gYAxis = vis.svg.append("g")
            .attr("class", "y-axis axis-label");

        vis.yLabel = vis.svg.append("text")
            .attr("x", -vis.height / 2)
            .attr("y", -40)
            .attr("transform", "rotate(-90)")
            .attr("text-anchor", "middle")
            .text("Recovery Score (%)")
            .style("font-size", "22px")
            .style("fill", "#ffffff");

        vis.line = d3.line()
            .x(d => vis.x(d.date))
            .y(d => vis.y(d.recovery))
            .curve(d3.curveMonotoneX);

        vis.path = vis.svg.append("path")
            .attr("class", "line");

        vis.tooltip = document.getElementById("tooltip");

        vis.legend = vis.svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${vis.width - 160}, ${vis.height - 100})`);

        const legendItems = vis.legend.selectAll(".legend-item")
            .data(legendColors)
            .enter()
            .append("g")
            .attr("class", "legend-item")
            .attr("transform", (d, i) => `translate(0, ${i * 28})`);

        legendItems.append("rect")
            .attr("width", 14)
            .attr("height", 14)
            .attr("fill", d => d.color);

        legendItems.append("text")
            .attr("x", 22)
            .attr("y", 11)
            .style("fill", "white")
            .style("font-size", "16px")
            .style("font-family", "'VT323', monospace")
            .text(d => d.label);


        this.wrangleData();
    }

    updateDimensions() {
        let vis = this;
        vis.width = document.querySelector("#chart-container").clientWidth - vis.margin.left - vis.margin.right;
        vis.height = document.querySelector("#chart-container").clientHeight - vis.margin.top - vis.margin.bottom;

        if (vis.width < 0) vis.width = 600;
        if (vis.height < 0) vis.height = 400;

        d3.select(vis.parentElement)
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom);

        if (vis.x) vis.x.range([0, vis.width]);
        if (vis.y) vis.y.range([vis.height, 0]);

        if (vis.gXAxis) {
            vis.gXAxis.attr("transform", `translate(0, ${vis.height})`);
            
            if (vis.yLabel) {
                vis.yLabel.attr("x", -vis.height / 2);
            }
            
            vis.wrangleData();
        }
    }

    wrangleData() {
        let vis = this;

        let activityFilter = d3.select('input[name="activity"]:checked').property("value");
        let maxSleep = +d3.select("#sleep-slider").property("value");

        // Filter
        vis.displayData = vis.data.filter(d => {
            let matchActivity = true;
            if (activityFilter !== 'all') {
                if (activityFilter === 'cardio') {
                    matchActivity = (d.workout_type === activityFilter);
                } else {
                    matchActivity = (d.workout_type === activityFilter);
                }
            }
            return matchActivity && (d.sleep <= 0.3+maxSleep) && (d.sleep >= maxSleep-0.3);
        });

        vis.displayData.sort((a, b) => a.date - b.date);

        d3.select("#days-count").text(vis.displayData.length);
        
        let avgRecovery = 0;
        if (vis.displayData.length > 0) {
            avgRecovery = d3.mean(vis.displayData, d => d.recovery);
        }
        d3.select("#avg-recovery").text(Math.round(avgRecovery));

        vis.updateVis();
    }

    updateVis() {
        let vis = this;

        vis.x.domain(d3.extent(vis.data, d => d.date));

        vis.gXAxis.call(vis.xAxis);
        vis.gYAxis.call(vis.yAxis);

        vis.path
            .datum(vis.displayData)
            .attr("d", vis.line);

        let dots = vis.svg.selectAll(".dot")
            .data(vis.displayData, d => d.date);

        dots.exit().remove();

        dots.enter().append("rect")
            .attr("width", 8)
            .attr("height", 8)
            .merge(dots)
            .attr("class", d => {
                if (d.recovery > 67) return "dot green";
                if (d.recovery < 37) return "dot red";
                return "dot yellow";
            })
            .attr("x", d => vis.x(d.date) - 4)
            .attr("y", d => vis.y(d.recovery) - 4)
            .on("mouseover", (event, d) => {
                vis.tooltip.classList.remove("hidden");
                
                vis.tooltip.innerHTML = `
                    <strong>${d3.timeFormat("%B %d, %Y")(d.date)}</strong><br>
                    Recovery: ${d.recovery}%<br>
                    Sleep: ${d.sleep}h<br>
                    Activity: ${d.workout_type}<br>
                    HRV: ${d.hrv}
                `;
            })
            .on("mousemove", (event) => {
                vis.tooltip.style.left = `${event.offsetX + 40}px`;
                vis.tooltip.style.top = `${event.offsetY + 20}px`;
            })
            .on("mouseout", () => {
                vis.tooltip.classList.add("hidden");
            });
    }
}
