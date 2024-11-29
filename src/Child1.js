import React, { Component } from 'react';
import * as d3 from 'd3';
import './Child1.css';

class Child1 extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: null,
    };
  }

  componentDidMount() {
    const fileInput = document.getElementById('fileInput');
    fileInput.addEventListener('change', (e) => {
      const reader = new FileReader();
      reader.onload = () => {
        const rawData = reader.result.trim();
        const data = d3.csvParse(rawData, d3.autoType);
        this.setState({ data });
      };
      reader.readAsText(e.target.files[0]);
    });
  }

  componentDidUpdate() {
    if (this.state.data) {
      this.renderStreamGraph();
    }
  }

  renderStreamGraph() {
    const { data } = this.state;
    if (!data || data.length === 0) {
      console.error('No valid data available for rendering');
      return;
    }

    const keys = data.columns.slice(1); 

    const stack = d3.stack().keys(keys).offset(d3.stackOffsetSilhouette);
    const stackedData = stack(data);

    const color = d3.scaleOrdinal()
      .domain(keys)
      .range(["#e41a1c", "#377eb8", "#4daf4a", "#984ea3", "#ff7f00"]);

    const svg = d3.select(this.svgRef);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 100, bottom: 50, left: 50 };
    const width = 960 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    const x = d3.scaleTime()
      .domain(d3.extent(data, d => new Date(d.Date)))
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([d3.min(stackedData, layer => d3.min(layer, d => d[0])),
               d3.max(stackedData, layer => d3.max(layer, d => d[1]))])
      .range([height, 0]);

    const area = d3.area()
      .x(d => x(new Date(d.data.Date)))
      .y0(d => y(d[0]))
      .y1(d => y(d[1]));

    const tooltip = d3.select('.tooltip');

    const graphGroup = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    graphGroup.selectAll('path')
      .data(stackedData)
      .join('path')
      .attr('d', area)
      .attr('fill', ({ key }) => color(key))
      .on('mouseover', (event, d) => {
        tooltip.style('display', 'block')
          .html('')  
          .style('left', `${event.pageX + 10}px`) 
          .style('top', `${event.pageY + 10}px`); 

        const miniChart = this.createMiniBarChart(d, color(d.key));
        tooltip.node().appendChild(miniChart); 
      })
      .on('mousemove', event => {
        tooltip.style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY + 10}px`);
      })
      .on('mouseout', () => {
        tooltip.style('display', 'none');
        tooltip.html(''); 
      });

    graphGroup.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x));

    graphGroup.append('g')
      .call(d3.axisLeft(y));

    this.addLegend(graphGroup, keys, color);
  }

  createMiniBarChart(d, color) {
    const data = d; 
    const width = 300;
    const height = 150;
  
    const margin = { top: 0, right: 20, bottom: 20, left: 40 };
  
    const x = d3.scaleBand()
      .domain(data.map(d => new Date(d.data.Date)))
      .range([0, width - margin.left - margin.right]) 
      .padding(0.1);
  
    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d[1] - d[0])]) 
      .nice()  
      .range([height - margin.top - margin.bottom, 0]); 
  
    const svg = d3.create('svg')
      .attr('width', width)  
      .attr('height', height);
  
    const chartGroup = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
  
    chartGroup.selectAll('rect')
      .data(data)
      .join('rect')
      .attr('x', d => x(new Date(d.data.Date)))  
      .attr('y', d => y(d[1] - d[0]))  
      .attr('width', x.bandwidth())  
      .attr('height', d => y(0) - y(d[1] - d[0]))  
      .attr('fill', color);  
  
    chartGroup.append('g')
      .attr('transform', `translate(0,${height - margin.top - margin.bottom})`)  
      .call(d3.axisBottom(x).ticks(3).tickFormat(d3.timeFormat('%b')))  
  
    chartGroup.append('g')
      .call(d3.axisLeft(y).ticks(3))
      .style('font-size', '8px');
  
    return svg.node(); 
  }

  addLegend(graphGroup, keys, color) {

    const reversedKeys = keys.slice().reverse();
    const legend = graphGroup.append('g')
      .attr('transform', `translate(${960 - 150}, 20)`);
  
      reversedKeys.forEach((reversedKeys, i) => {
      legend.append('rect')
        .attr('x', 20)
        .attr('y', i * 20)
        .attr('width', 15)
        .attr('height', 15)
        .attr('fill', color(reversedKeys));
  
      legend.append('text')
        .attr('x', 40) 
        .attr('y', i * 20 + 12)  
        .text(reversedKeys)
        .style('font-size', '12px')  
        .attr('alignment-baseline', 'middle');
    });
  }

  render() {
    return (
      <div>
        <input type="file" id="fileInput" />
        <svg ref={ref => this.svgRef = ref} width="960" height="500"></svg>
        <div className="tooltip" style={{ position: 'absolute', display: 'none' }}></div>
      </div>
    );
  }
}

export default Child1;
