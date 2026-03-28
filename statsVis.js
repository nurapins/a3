class statsVis {
    constructor(parentElement, data) {
        this.parentElement = parentElement;
        this.data = data;
        
        //normalization
        this.maxMetrics = {
            sleep: d3.max(this.data, d => d.sleep),
            hrv: d3.max(this.data, d => d.hrv),
            steps: d3.max(this.data, d => d.steps)
        };

        this.initVis();
    }


    initVis() {
        let vis = this;
        vis.margin = { top: 60, right: 100, bottom: 80, left: 100 };
        vis.updateDimensions();

        vis.svg = d3.select(vis.parentElement)
            .append("g")
            .attr("transform", `translate(${vis.margin.left}, ${vis.margin.top})`);

        vis.x = d3.scaleBand().range([0, vis.width]).padding(0.4);
        vis.y = d3.scaleLinear().range([vis.height, 0]).domain([0, 100]);

        vis.x.domain(["Avg Sleep", "Avg HRV", "Avg Steps"]);

        vis.xAxis = d3.axisBottom(vis.x);
        vis.gXAxis = vis.svg.append("g")
            .attr("class", "x-axis axis-label")
            .attr("transform", `translate(0, ${vis.height})`);

        vis.title = vis.svg.append("text")
            .attr("x", vis.width / 2)
            .attr("y", 30)
            .attr("text-anchor", "middle")
            .style("font-family", "'Press Start 2P', cursive")
            .style("font-size", "19px")
            .style("fill", "#616161")
            .text("Recovery Type Stats");

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
            vis.xAxis = d3.axisBottom(vis.x);
            vis.gXAxis.call(vis.xAxis);
            if (vis.title) vis.title.attr("x", vis.width / 2);
            this.updateVis();
        }
    }


    wrangleData() {
        let vis = this;

        let category = d3.select('input[name="recovery-cat"]:checked').property("value");
        vis.currentCategory = category;

        let filtered = vis.data.filter(d => {
            if (category === 'green') return d.recovery > 67;
            if (category === 'red') return d.recovery < 37;
            return d.recovery >= 37 && d.recovery <= 67; // yellow
        });

        let avgSleep = d3.mean(filtered, d => d.sleep) || 0;
        let avgHrv = d3.mean(filtered, d => d.hrv) || 0;
        let avgSteps = d3.mean(filtered, d => d.steps) || 0;

        vis.displayData = [
            { name: "Avg Sleep", value: (avgSleep / vis.maxMetrics.sleep) * 100, label: avgSleep.toFixed(1) + "h" },
            { name: "Avg HRV", value: (avgHrv / vis.maxMetrics.hrv) * 100, label: Math.round(avgHrv) },
            { name: "Avg Steps", value: (avgSteps / vis.maxMetrics.steps) * 100, label: Math.round(avgSteps).toLocaleString() }
        ];

        vis.updateVis();
    }

    updateVis() {
        let vis = this;
        const transitionDuration = 777;

        let bars = vis.svg.selectAll(".bar")
            .data(vis.displayData);

        bars.exit().remove();

        bars.enter().append("rect")
            .attr("class", "bar")
            .attr("x", d => vis.x(d.name))
            .attr("y", vis.height)
            .attr("height", 0)
            .attr("width", vis.x.bandwidth())
            .merge(bars)
            .transition()
            .duration(transitionDuration)
            .attr("x", d => vis.x(d.name))
            .attr("width", vis.x.bandwidth())
            .attr("y", d => vis.y(d.value))
            .attr("height", d => vis.height - vis.y(d.value))
            .attr("fill", () => {
                if (vis.currentCategory === 'green') return "#28a745";
                if (vis.currentCategory === 'red') return "#dc3545";
                return "#ffc107";
            })
            .style("filter", "drop-shadow(0 0 5px rgba(255, 255, 255, 0.2))");

        let labels = vis.svg.selectAll(".bar-label")
            .data(vis.displayData);

        labels.exit().remove();

        labels.enter().append("text")
            .attr("class", "bar-label")
            .attr("text-anchor", "middle")
            .attr("y", vis.height) // Start from bottom
            .merge(labels)
            .transition()
            .duration(transitionDuration)
            .attr("x", d => vis.x(d.name) + vis.x.bandwidth() / 2)
            .attr("y", d => vis.y(d.value) - 10)
            .text(d => d.label);
            
        let titleText = vis.currentCategory === 'green' ? 'Optimal' :
                        (vis.currentCategory === 'red' ? 'Bad' : 'Sufficient');
        vis.title.text(`${titleText} Recovery Stats`);
    }
}
