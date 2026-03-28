let allData = [];
let recoveryChart;
let statsChart;
let currentView = 'timeline';

d3.csv('data/whoop_synthetic.csv').then(data => {
    
    allData = data.map(d => ({
        date: d3.timeParse("%Y-%m-%d")(d.date),
        recovery: +d.recovery_score,
        sleep: +d.sleep_hours,
        steps: +d.steps,
        hrv: +d.hrv,
        workout_type: d.workout_type,
        trained_today: +d.trained_today
    }));

    recoveryChart = new whoopVis("#recovery-chart", allData);
    statsChart = new statsVis("#stats-chart", allData);

    initUI();

    window.addEventListener("resize", () => {
        if (currentView === 'timeline') {
            recoveryChart.updateDimensions();
        } else {
            statsChart.updateDimensions();
        }
    });
});

function initUI() {
    
    d3.select("#view-switch").on("click", function(event) {
        event.preventDefault();
        toggleView();
    });

    d3.selectAll('input[name="activity"]').on("change", () => {
        recoveryChart.wrangleData();
    });

    d3.select("#sleep-slider").on("input", function() {
        d3.select("#sleep-val").text(this.value);
        recoveryChart.wrangleData();
    });

    d3.selectAll('input[name="recovery-cat"]').on("change", () => {
        statsChart.wrangleData();
    });
}


function toggleView() {
    if (currentView === 'timeline') {
        currentView = 'stats';
        d3.select("#view-switch").text("Switch to Timeline View");
        
        d3.select("#timeline-controls").classed("hidden", true);
        d3.select("#stats-controls").classed("hidden", false);
        
        d3.select("#recovery-chart").classed("hidden", true);
        d3.select("#stats-chart").classed("hidden", false);
        
        statsChart.updateDimensions();
    } else {
        currentView = 'timeline';
        d3.select("#view-switch").text("Switch to Stats View");
        
        d3.select("#timeline-controls").classed("hidden", false);
        d3.select("#stats-controls").classed("hidden", true);
        
        // Toggle Charts
        d3.select("#recovery-chart").classed("hidden", false);
        d3.select("#stats-chart").classed("hidden", true);
        
        recoveryChart.updateDimensions();
    }
}
