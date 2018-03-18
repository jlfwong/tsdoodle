import * as d3 from 'd3'

console.log('loaded')

const root = document.getElementById('root')

for (let child of root.children) {
  root.removeChild(child)
}

const svg = d3.select(root).append("svg")

interface Range { min: number, max: number }

function fnToPath(
  f: (x: number) => number,
  xScale: d3.ScaleContinuousNumeric<number, number>,
  yScale: d3.ScaleContinuousNumeric<number, number>,
  range: Range
): string {
  const line = d3.line<number>()

  line
    .x(d => xScale(d))
    .y(d => yScale(f(d)))
    .curve(d3.curveBasis)

  return line(d3.range(range.min, range.max, (range.max - range.min) / 100))
}

// Planck constant
function bulbSpectral() {
  const h = 6.626e-34 // J s
  const k = 1.38e-23 // JK^-1
  const c = 3e8 // m/s

  const temperature = 3000 // K
  const solidAngleOfSphere = 4 * Math.PI // sr
  const surfaceArea = (100/60) * 0.81 * 4e-6 // m^2

  function B(wav: number, T: number) {
    return (2 * h * Math.pow(c, 2)) / Math.pow(wav, 5) * (1 / (Math.exp(h * c / (wav * k * T)) - 1))
  }

  function bulb(wav: number) {
    return solidAngleOfSphere * surfaceArea * 0.8 * B(wav, temperature)
  }

  const min = 380e-9
  const max = 750e-9

  const xScale = d3.scaleLinear().domain([min, max]).range([50, 650])
  const yScale = d3.scaleLinear().domain([0, 6e7]).range([350, 50])
  const fnPath = fnToPath(bulb, xScale, yScale, { min, max })

  svg.append("path")
    .attr("d", fnPath)
    .attr("stroke", "#ff0000")
    .attr("stroke-width", "1.0")
    .attr("fill", "none")

  const xAxis = d3.axisBottom(xScale).tickFormat((x: number) => (x / 1e-9).toFixed()).ticks(10)
  const yAxis = d3.axisLeft(yScale).tickFormat((x: number) => (x / 1e9).toFixed(2)).ticks(5)

  svg.append("g")
    .attr("transform", "translate(0, 350)").call(xAxis);
  svg.append("g")
    .attr("transform", "translate(50, 0)").call(yAxis);
}

declare function require(path: string): any

async function ybarPlot() {
  const rawCsv = await d3.text(require('./vl1924e.csv'))
  const data = d3.csvParseRows(rawCsv).map(r => [parseFloat(r[0]), parseFloat(r[1])])

  const line = d3.line<[number, number]>()

  const xScale = d3.scaleLinear().domain([380, 750]).range([50, 650])
  const yScale = d3.scaleLinear().domain([0, 1]).range([350, 50])

  line
    .x(d => xScale(d[0]))
    .y(d => yScale(d[1]))
    .curve(d3.curveBasis)

  const path = line(data as [number, number][])

  svg.append("path")
    .attr("d", path)
    .attr("stroke", "#ff0000")
    .attr("stroke-width", "1.0")
    .attr("fill", "none")

  const xAxis = d3.axisBottom(xScale).tickFormat((x: number) => x.toFixed()).ticks(10)
  const yAxis = d3.axisLeft(yScale).tickFormat((x: number) => `${(100 * x).toFixed()}%`).ticks(5)

  svg.append("g")
    .attr("transform", "translate(0, 350)").call(xAxis);
  svg.append("g")
    .attr("transform", "translate(50, 0)").call(yAxis);
}

svg.attr('width', 700).attr('height', 400)
bulbSpectral()
// ybarPlot()