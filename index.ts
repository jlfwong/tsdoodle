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
    .curve(d3.curveCardinal)

  return line(d3.range(range.min, range.max, (range.max - range.min) / 100))
}

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
    .curve(d3.curveCardinal)

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

async function bulbLuminousFlux() {
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

  const rawCsv = await d3.text(require('./vl1924e.csv'))
  let data = d3.csvParseRows(rawCsv).map(r => [parseFloat(r[0]) * 1e-9, parseFloat(r[1])])

  data = data.map(d => [d[0], d[1] * bulb(d[0])])

  const line = d3.line<[number, number]>()

  const min = 380e-9
  const max = 750e-9
  const xScale = d3.scaleLinear().domain([min, max]).range([50, 650])
  const yScale = d3.scaleLinear().domain([0, 6e7]).range([350, 50])

  line
    .x(d => xScale(d[0]))
    .y(d => yScale(d[1]))
    .curve(d3.curveCardinal)

  const path = line(data as [number, number][])

  svg.append("path")
    .attr("d", path)
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

function sRGB2linear(c: number): number {
  if (c <= 0.04045) return c / 12.92
  return Math.pow((c + 0.055) / (1 + 0.055), 2.4)
}

function clamp(min: number, max: number, val: number): number {
  if (val < min) return min
  if (val > max) return max
  return val
}

function linear2sRGB(c: number): number {
  if (c < 0.0031308) return 12.92 * c
  return 1.055 * Math.pow(c, 1/2.4) - 0.055
}

function XYZ2sRGB({ X, Y, Z }: { X: number, Y: number, Z: number }): string {
  let R = clamp(0, 1, linear2sRGB( 3.2406 * X + -1.5372 * Y + -0.4986 * Z)) * 255;
  let G = clamp(0, 1, linear2sRGB(-0.9689 * X +  1.8758 * Y +  0.0415 * Z)) * 255;
  let B = clamp(0, 1, linear2sRGB( 0.0557 * X + -0.2040 * Y +  1.0570 * Z)) * 255;
  return `rgb(${R.toFixed()}, ${G.toFixed()}, ${B.toFixed()})`
}

function XYZ2CIERGB({ X, Y, Z }: { X: number, Y: number, Z: number }): { R: number, G: number, B: number } {
  let R = ( 0.4190 * X + -0.1587 * Y + -0.0828 * Z)
  let G = (-0.0912 * X +  0.2524 * Y +  0.0157 * Z)
  let B = ( 0.0001 * X + -0.0026 * Y +  0.1786 * Z)
  return { R, G, B }
}

async function rainbow() {
  const rawCsv = await d3.text(require('./xyz2006.csv'))
  const data = d3.csvParseRows(rawCsv).map(d => ({
    wavelength: parseFloat(d[0]),
    X: parseFloat(d[1]),
    Y: parseFloat(d[2]),
    Z: parseFloat(d[3]),
  })).map((d): [number, string] => [d.wavelength, XYZ2sRGB(d)])

  const defs = svg.append("defs")

  const gradient = defs
    .append("linearGradient")
      .attr("id", "gradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "0%")
      .attr("spreadMethod", "pad");

  for (let [wavelength, color] of data) {
    const offset = (wavelength - 380) / (750 - 380)
    console.log(wavelength, color, offset)
    if (clamp(0, 1, offset) != offset) continue
    gradient.append("stop")
      .attr("offset", `${offset * 100}%`)
      .attr("stop-color", color)
      .attr("stop-opacity", 1);
  }

  svg.append("rect")
    .attr("width", 700)
    .attr("height", 400)
    .style("fill", "url(#gradient)");
}

async function bulbPlots() {
  function plotBulb(data: [number, number][], left: number, top: number) {
    const bottom = top + 150
    const right = left + 200

    const line = d3.line<[number, number]>()

    const min = 200
    const max = 1500

    const xScale = d3.scaleLinear().domain([min, max]).range([left, right])
    const yScale = d3.scaleLinear().domain([0, 0.02]).range([bottom, top])

    line
      .x(d => xScale(d[0]))
      .y(d => yScale(d[1]))
      .curve(d3.curveLinearClosed)

    data = data.filter(d => d[0] >= min && d[0] <= max)
    data.push([max, 0])

    const path = line(data)

    svg.append("path")
      .attr("d", path)
      .attr("fill", "#ff0000")

    const xAxis = d3.axisBottom(xScale).tickFormat((x: number) => x.toFixed()).ticks(4)

    svg.append("g")
      .attr("transform", `translate(0, ${bottom})`).call(xAxis);
  }

  let incandescant = (await d3.csv(require('./NGDC Tungsten.csv'))).map((d): [number, number] => [parseFloat(d['Wavelength']), parseFloat(d['GE 200 W Clear'])]).filter(d => d[0] >= 300)

  let fluorescent = (await d3.csv(require('./NGDC Fluorescent.csv'))).map((d): [number, number] => [parseFloat(d['Wavelength']), parseFloat(d['5000 K Fluorescent'])]).filter(d => d[0] >= 301)
  fluorescent.unshift([300, 0])
  fluorescent.unshift([301, 0])
  fluorescent.unshift([302, 0])

  let led = (await d3.csv(require('./NGDC LED.csv'))).map((d): [number, number] => [parseFloat(d['Wavelength']), parseFloat(d['OSRAM Tester White'])]).filter(d => d[0] >= 300)
  let ybar = d3.csvParseRows(await d3.text(require('./vl1924e.csv'))).map((r): [number, number] => [parseFloat(r[0]), parseFloat(r[1]) * 0.02])

  const iFlux = incandescant.reduce((sum, d) => sum + d[1], 0)
  const fFlux = fluorescent.reduce((sum, d) => sum + d[1], 0)
  const lFlux = led.reduce((sum, d) => sum + d[1], 0)

  incandescant = incandescant.map((d): [number, number] => [d[0], d[1] / iFlux])
  fluorescent = fluorescent.map((d): [number, number] => [d[0], d[1] / fFlux])
  led = led.map((d): [number, number] => [d[0], d[1] / lFlux])

  function mult(a: [number, number][], b: [number, number][]) {
    const merged: [number, number][] = []
    let ai = 0, bi = 0;

    while (ai < a.length && bi < b.length) {
      const wava = a[ai][0]
      const wavb = b[bi][0]
      if (wava === wavb) {
        merged.push([wava, a[ai][1] * b[bi][1] / 0.02])
        ai++
        bi++
      } else if (wava < wavb) {
        ai++
      } else {
        bi++
      }
    }

    return merged
  }

  plotBulb(incandescant, 10, 50)
  plotBulb(fluorescent, 230, 50)
  plotBulb(led, 450, 50)

  plotBulb(ybar, 10, 50 + 20 + 150)
  plotBulb(ybar, 230, 50 + 20 + 150)
  plotBulb(ybar, 450, 50 + 20 + 150)

  plotBulb(mult(incandescant, ybar), 10, 50 + 2 * 20 + 2 * 150)
  plotBulb(mult(fluorescent, ybar), 230, 50 + 2 * 20 + 2 * 150)
  plotBulb(mult(led, ybar), 450, 50 + 2 * 20 + 2 * 150)

    /*
  svg.append("g")
    .attr("transform", "translate(50, 0)").call(yAxis);
    */
}

function lemon() {
  function norm(x: number, mu: number, sigma: number) {
    return Math.exp(-Math.pow(x - mu, 2)/(2 * sigma * sigma)) / Math.sqrt(2 * Math.PI * sigma * sigma)
  }
  const yellow1 = x => 29 * norm(x, 570, 20) + 250 * norm(x, 800, 230)

  const min = 380
  const max = 750

  const xScale = d3.scaleLinear().domain([min, max]).range([50, 650])
  const yScale = d3.scaleLinear().domain([0, 1]).range([350, 50])

  const fnPath = fnToPath(yellow1, xScale, yScale, { min, max })

  svg.append("path")
    .attr("d", fnPath)
    .attr("stroke", "#ff0000")
    .attr("stroke-width", "1.0")
    .attr("fill", "none")

  const xAxis = d3.axisBottom(xScale).tickFormat((x: number) => (x).toFixed()).ticks(10)
  const yAxis = d3.axisLeft(yScale).tickFormat((x: number) => '').ticks(1)

  svg.append("g")
    .attr("transform", "translate(0, 350)").call(xAxis);
  svg.append("g")
    .attr("transform", "translate(50, 0)").call(yAxis);
}

async function screenColor(r: number, g: number, b: number) {
  let mba = await d3.csv(require('./Macbook Air 2011.csv'))

  function mult(a: [number, number][], b: [number, number][]) {
    const merged: [number, number][] = []
    let ai = 0, bi = 0;

    while (ai < a.length && bi < b.length) {
      const wava = a[ai][0]
      const wavb = b[bi][0]
      if (wava === wavb) {
        merged.push([wava, a[ai][1] * b[bi][1] / 0.02])
        ai++
        bi++
      } else if (wava < wavb) {
        ai++
      } else {
        bi++
      }
    }

    return merged
  }

  const line = d3.line<[number, number]>()

  const xScale = d3.scaleLinear().domain([380, 750]).range([50, 650])
  const yScale = d3.scaleLinear().domain([0, 1.5]).range([350, 50])

  const rgb = mba.map((d): { wav: number, r: number, g: number, b: number } => ({
    wav: parseFloat(d['Wavelength']),
    r: parseFloat(d['red-MacbookAir2011']),
    g: parseFloat(d['green-MacbookAir2011']),
    b: parseFloat(d['blue-MacbookAir2011'])
  })).filter(d => d.wav >= 380 && d.wav <= 750)

  // #FFE841
  const data = rgb.map((d): [number, number] =>
    [
      d.wav,
      150 * (sRGB2linear(r) * d.r +
             sRGB2linear(g) * d.g +
             sRGB2linear(b) * d.b)
    ]
  )

  line
    .x(d => xScale(d[0]))
    .y(d => yScale(d[1]))
    .curve(d3.curveBasis)

  svg.append("path")
    .attr("d", line(data))
    .attr("stroke", "#ff0000")
    .attr("stroke-width", "1.0")
    .attr("fill", "none")

  const xAxis = d3.axisBottom(xScale).tickFormat((x: number) => (x).toFixed()).ticks(10)
  const yAxis = d3.axisLeft(yScale).tickFormat((x: number) => '').ticks(1)

  svg.append("g")
    .attr("transform", "translate(0, 350)").call(xAxis);
  svg.append("g")
    .attr("transform", "translate(50, 0)").call(yAxis);
}

async function screenYellow() {
  screenColor(0xFF / 0xFF, 0xE8 / 0xFF, 0x41 / 0xFF)
}

async function cones() {
  const xScale = d3.scaleLinear().domain([380, 750]).range([50, 650])
  const yScale = d3.scaleLinear().domain([0, 1]).range([350, 50])

  let conesRaw = d3.csvParseRows(await d3.text(require('./cones.csv')))
  const cones = conesRaw.map((d): { wav: number, l: number, m: number, s: number } => ({
    wav: parseFloat(d[0]),
    l: parseFloat(d[1]),
    m: parseFloat(d[2]),
    s: parseFloat(d[3])
  })).filter(d => d.wav >= 380 && d.wav <= 750)

  const line = d3.line<[number, number]>()
  line
    .x(d => xScale(d[0]))
    .y(d => yScale(d[1]))
    .curve(d3.curveBasis)

  svg.append("path")
    .attr("d", line(cones.map((d): [number, number] => [d.wav, d.l])))
    .attr("stroke", "#ff0000")
    .attr("stroke-width", "1.0")
    .attr("fill", "none")

  svg.append("path")
    .attr("d", line(cones.map((d): [number, number] => [d.wav, d.m])))
    .attr("stroke", "#00ff00")
    .attr("stroke-width", "1.0")
    .attr("fill", "none")

  svg.append("path")
    .attr("d", line(cones.map((d): [number, number] => [d.wav, d.s])))
    .attr("stroke", "#0000ff")
    .attr("stroke-width", "1.0")
    .attr("fill", "none")

  const xAxis = d3.axisBottom(xScale).tickFormat((x: number) => (x).toFixed()).ticks(10)
  const yAxis = d3.axisLeft(yScale).tickFormat((x: number) => '').ticks(1)

  svg.append("g")
    .attr("transform", "translate(0, 350)").call(xAxis);
  svg.append("g")
    .attr("transform", "translate(50, 0)").call(yAxis);
}

async function lemonCones() {
  function plotCone(data: [number, number][], left: number, top: number) {
    const bottom = top + 150
    const right = left + 200

    const line = d3.line<[number, number]>()

    const xScale = d3.scaleLinear().domain([380, 750]).range([left, right])
    const yScale = d3.scaleLinear().domain([0, 1]).range([bottom, top])

    line
      .x(d => xScale(d[0]))
      .y(d => yScale(d[1]))
      .curve(d3.curveBasis)

    const path = line(data as [number, number][])

    svg.append("path")
      .attr("d", path)
      .attr("stroke", "#ff0000")
      .attr("fill", "none")

    const xAxis = d3.axisBottom(xScale).tickFormat((x: number) => x.toFixed()).ticks(4)
    const yAxis = d3.axisLeft(yScale).tickFormat((x: number) => '').ticks(1)


    svg.append("g")
      .attr("transform", `translate(${left}, 0)`).call(yAxis);
    svg.append("g")
      .attr("transform", `translate(0, ${bottom})`).call(xAxis);
  }

  function mult(a: [number, number][], b: [number, number][]) {
    const merged: [number, number][] = []
    let ai = 0, bi = 0;

    while (ai < a.length && bi < b.length) {
      const wava = a[ai][0]
      const wavb = b[bi][0]
      if (wava === wavb) {
        merged.push([wava, a[ai][1] * b[bi][1]])
        ai++
        bi++
      } else if (wava < wavb) {
        ai++
      } else {
        bi++
      }
    }

    return merged
  }

  let conesRaw = d3.csvParseRows(await d3.text(require('./cones.csv')))
  const cones = conesRaw.map((d): { wav: number, l: number, m: number, s: number } => ({
    wav: parseFloat(d[0]),
    l: parseFloat(d[1]) || 0.0,
    m: parseFloat(d[2]) || 0.0,
    s: parseFloat(d[3]) || 0.0
  })).filter(d => d.wav >= 380 && d.wav <= 750)

  let mba = await d3.csv(require('./Macbook Air 2011.csv'))
  const rgb = mba.map((d): { wav: number, r: number, g: number, b: number } => ({
    wav: parseFloat(d['Wavelength']),
    r: parseFloat(d['red-MacbookAir2011']) || 0.0,
    g: parseFloat(d['green-MacbookAir2011']) || 0.0,
    b: parseFloat(d['blue-MacbookAir2011']) || 0.0
  })).filter(d => d.wav >= 380 && d.wav <= 750)
  const yellowScreen = rgb.map((d): [number, number] =>
    [
      d.wav,
      150 * (sRGB2linear(0xFF / 0xFF) * d.r +
             sRGB2linear(0xE8 / 0xFF) * d.g +
             sRGB2linear(0x41 / 0xFF) * d.b)
    ]
  )

  function norm(x: number, mu: number, sigma: number) {
    return Math.exp(-Math.pow(x - mu, 2)/(2 * sigma * sigma)) / Math.sqrt(2 * Math.PI * sigma * sigma)
  }
  const yellow1 = x => 29 * norm(x, 570, 20) + 250 * norm(x, 800, 230)

  const yellow = d3.range(380, 750, 1).map((d): [number, number] => [d, yellow1(d)])
  const lCone = cones.map((d): [number, number] => [d.wav, d.l])
  const mCone = cones.map((d): [number, number] => [d.wav, d.m])
  const sCone = cones.map((d): [number, number] => [d.wav, d.s])

  const y = yellowScreen

  plotCone(y, 10, 50)
  plotCone(y, 230, 50)
  plotCone(y, 450, 50)

  plotCone(sCone, 10, 50 + 20 + 150)
  plotCone(mCone, 230, 50 + 20 + 150)
  plotCone(lCone, 450, 50 + 20 + 150)

  const sStim = mult(y, sCone)
  const mStim = mult(y, mCone)
  const lStim = mult(y, lCone)

  function tally(d: [number, number][]): number {
    let x = d.filter(d => d[0] >= 380 && d[0] <= 750)
    return x.reduce((sum, a) => isNaN(a[1]) ? sum : sum + a[1], 0) / x.length
  }

  console.log((tally(sStim)).toFixed(2), (tally(mStim)).toFixed(2), (tally(lStim)).toFixed(2))

  plotCone(sStim, 10, 50 + 2 * 20 + 2 * 150)
  plotCone(mStim, 230, 50 + 2 * 20 + 2 * 150)
  plotCone(lStim, 450, 50 + 2 * 20 + 2 * 150)

    /*
  svg.append("g")
    .attr("transform", "translate(50, 0)").call(yAxis);
    */
}

async function rgbcmfs() {
  /*
   const rawXYZ = await d3.text(require('./xyz2006.csv'))
  const data = d3.csvParseRows(rawXYZ).map(d => ({
    wav: parseFloat(d[0]),
    X: parseFloat(d[1]),
    Y: parseFloat(d[2]),
    Z: parseFloat(d[3]),
  })).map((d) => ({wav: d.wav, ...XYZ2CIERGB(d)}))
  */

  const rawCsv = await d3.text(require('./CIE1931rgb.csv'))
  const data = d3.csvParseRows(rawCsv).map((r): { wav: number, R: number, G: number, B: number } => ({
    wav: parseFloat(r[0]),
    R: parseFloat(r[1]),
    G: parseFloat(r[2]),
    B: parseFloat(r[3]),
  })).filter(d => d.wav >= 380 && d.wav <= 750)

  const line = d3.line<[number, number]>()

  const xScale = d3.scaleLinear().domain([380, 750]).range([50, 650])
  const yScale = d3.scaleLinear().domain([-0.1, 0.4]).range([350, 50])

  line
    .x(d => xScale(d[0]))
    .y(d => yScale(d[1]))
    .curve(d3.curveCardinal)

  svg.append("path")
    .attr("d", line(data.map((d): [number, number] => [d.wav, d.R])))
    .attr("stroke", "#ff0000")
    .attr("stroke-width", "1.0")
    .attr("fill", "none")

  svg.append("path")
    .attr("d", line(data.map((d): [number, number] => [d.wav, d.G])))
    .attr("stroke", "#ff0000")
    .attr("stroke-width", "1.0")
    .attr("fill", "none")

  svg.append("path")
    .attr("d", line(data.map((d): [number, number] => [d.wav, d.B])))
    .attr("stroke", "#ff0000")
    .attr("stroke-width", "1.0")
    .attr("fill", "none")

  const xAxis = d3.axisBottom(xScale).tickFormat((x: number) => x.toFixed()).ticks(10)
  const yAxis = d3.axisLeft(yScale).tickFormat((x: number) => `${(x).toFixed(1)}`).ticks(5)

  svg.append("g")
    .attr("transform", `translate(0, ${yScale(0)})`).call(xAxis);
  svg.append("g")
    .attr("transform", `translate(${xScale(380)}, 0)`).call(yAxis);
}

async function lemonRGBcmfs() {
  function plotCone(data: [number, number][], left: number, top: number) {
    const bottom = top + 150
    const right = left + 200

    const line = d3.line<[number, number]>()

    const xScale = d3.scaleLinear().domain([380, 750]).range([left, right])
    const yScale = d3.scaleLinear().domain([0, 1]).range([bottom, top])

    line
      .x(d => xScale(d[0]))
      .y(d => yScale(d[1]))
      .curve(d3.curveBasis)

    const path = line(data as [number, number][])

    svg.append("path")
      .attr("d", path)
      .attr("stroke", "#ff0000")
      .attr("fill", "none")

    const xAxis = d3.axisBottom(xScale).tickFormat((x: number) => x.toFixed()).ticks(4)
    const yAxis = d3.axisLeft(yScale).tickFormat((x: number) => '').ticks(1)


    svg.append("g")
      .attr("transform", `translate(${left}, 0)`).call(yAxis);
    svg.append("g")
      .attr("transform", `translate(0, ${bottom})`).call(xAxis);
  }

  function mult(a: [number, number][], b: [number, number][]) {
    const merged: [number, number][] = []
    let ai = 0, bi = 0;

    while (ai < a.length && bi < b.length) {
      const wava = a[ai][0]
      const wavb = b[bi][0]
      if (wava === wavb) {
        merged.push([wava, a[ai][1] * b[bi][1]])
        ai++
        bi++
      } else if (wava < wavb) {
        ai++
      } else {
        bi++
      }
    }

    return merged
  }

  const rawCsv = await d3.text(require('./CIE1931rgb.csv'))
  const cmfs = d3.csvParseRows(rawCsv).map((r): { wav: number, R: number, G: number, B: number } => ({
    wav: parseFloat(r[0]),
    R: parseFloat(r[1]),
    G: parseFloat(r[2]),
    B: parseFloat(r[3]),
  })).filter(d => d.wav >= 380 && d.wav <= 750)


  let mba = await d3.csv(require('./Macbook Air 2011.csv'))
  const rgb = mba.map((d): { wav: number, r: number, g: number, b: number } => ({
    wav: parseFloat(d['Wavelength']),
    r: parseFloat(d['red-MacbookAir2011']),
    g: parseFloat(d['green-MacbookAir2011']),
    b: parseFloat(d['blue-MacbookAir2011'])
  })).filter(d => d.wav >= 380 && d.wav <= 750)
  const yellowScreen = rgb.map((d): [number, number] =>
    [
      d.wav,
      150 * (sRGB2linear(0xFF / 0xFF) * d.r +
             sRGB2linear(0xE8 / 0xFF) * d.g +
             sRGB2linear(0x41 / 0xFF) * d.b)
    ]
  )

  function norm(x: number, mu: number, sigma: number) {
    return Math.exp(-Math.pow(x - mu, 2)/(2 * sigma * sigma)) / Math.sqrt(2 * Math.PI * sigma * sigma)
  }
  const yellow1 = x => 29 * norm(x, 570, 20) + 250 * norm(x, 800, 230)

  const yellow = d3.range(380, 750, 1).map((d): [number, number] => [d, yellow1(d)])
  const rbar = cmfs.map((d): [number, number] => [d.wav, d.R])
  const gbar = cmfs.map((d): [number, number] => [d.wav, d.G])
  const bbar = cmfs.map((d): [number, number] => [d.wav, d.B])

  const y = yellow

  plotCone(y, 10, 50)
  plotCone(y, 230, 50)
  plotCone(y, 450, 50)

  plotCone(rbar, 10, 50 + 20 + 150)
  plotCone(gbar, 230, 50 + 20 + 150)
  plotCone(bbar, 450, 50 + 20 + 150)

  const rVal = mult(y, rbar)
  const gVal = mult(y, gbar)
  const bVal = mult(y, bbar)

  function tally(d: [number, number][]): number {
    let x = d.filter(d => d[0] >= 380 && d[0] <= 750)
    return x.reduce((sum, a) => isNaN(a[1]) ? sum : sum + a[1], 0) / x.length
  }

  console.log((tally(rVal) * 100).toFixed(2), (tally(gVal) * 100).toFixed(2), (tally(bVal) * 100).toFixed(2))

  plotCone(rVal, 10, 50 + 2 * 20 + 2 * 150)
  plotCone(gVal, 230, 50 + 2 * 20 + 2 * 150)
  plotCone(bVal, 450, 50 + 2 * 20 + 2 * 150)

    /*
  svg.append("g")
    .attr("transform", "translate(50, 0)").call(yAxis);
    */
}


async function spectralChromaticities() {
  /*
   const rawXYZ = await d3.text(require('./xyz2006.csv'))
  const data = d3.csvParseRows(rawXYZ).map(d => ({
    wav: parseFloat(d[0]),
    X: parseFloat(d[1]),
    Y: parseFloat(d[2]),
    Z: parseFloat(d[3]),
  })).map((d) => ({wav: d.wav, ...XYZ2CIERGB(d)}))
  */

  const rawCsv = await d3.text(require('./CIE1931rgb.csv'))
  const data = d3.csvParseRows(rawCsv).map((r): { wav: number, R: number, G: number, B: number } => ({
    wav: parseFloat(r[0]),
    R: parseFloat(r[1]),
    G: parseFloat(r[2]),
    B: parseFloat(r[3]),
  })).filter(d => d.wav >= 380 && d.wav <= 750)

  const line = d3.line<[number, number]>()

  const xScale = d3.scaleLinear().domain([380, 750]).range([50, 650])
  const yScale = d3.scaleLinear().domain([-2.0, 2.0]).range([350, 50])

  line
    .x(d => xScale(d[0]))
    .y(d => yScale(d[1]))
    .curve(d3.curveCardinal)

  svg.append("path")
    .attr("d", line(data.map((d): [number, number] => [d.wav, d.R / (d.R + d.G + d.B)])))
    .attr("stroke", "#ff0000")
    .attr("stroke-width", "1.0")
    .attr("fill", "none")

  svg.append("path")
    .attr("d", line(data.map((d): [number, number] => [d.wav, d.G / (d.R + d.G + d.B)])))
    .attr("stroke", "#ff0000")
    .attr("stroke-width", "1.0")
    .attr("fill", "none")

  const xAxis = d3.axisBottom(xScale).tickFormat((x: number) => x.toFixed()).ticks(10)
  const yAxis = d3.axisLeft(yScale).tickFormat((x: number) => `${(x).toFixed(1)}`).ticks(5)

  svg.append("g")
    .attr("transform", `translate(0, ${yScale(0)})`).call(xAxis);
  svg.append("g")
    .attr("transform", `translate(${xScale(380)}, 0)`).call(yAxis);
}


async function spectralLocus() {
  /*
   const rawXYZ = await d3.text(require('./xyz2006.csv'))
  const data = d3.csvParseRows(rawXYZ).map(d => ({
    wav: parseFloat(d[0]),
    X: parseFloat(d[1]),
    Y: parseFloat(d[2]),
    Z: parseFloat(d[3]),
  })).map((d) => ({wav: d.wav, ...XYZ2CIERGB(d)}))
  */

  const rawCsv = await d3.text(require('./CIE1931rgb.csv'))
  const data = d3.csvParseRows(rawCsv).map((r): { wav: number, R: number, G: number, B: number } => ({
    wav: parseFloat(r[0]),
    R: parseFloat(r[1]),
    G: parseFloat(r[2]),
    B: parseFloat(r[3]),
  })).filter(d => d.wav >= 380 && d.wav <= 750)

  const line = d3.line<[number, number]>()

  const xScale = d3.scaleLinear().domain([-1.5, 2.0]).range([50, 650])
  const yScale = d3.scaleLinear().domain([0, 2.5]).range([350, 50])

  line
    .x(d => xScale(d[0]))
    .y(d => yScale(d[1]))
    .curve(d3.curveCardinal)

  svg.append("path")
    .attr("d", line(data.map((d): [number, number] => [d.R / (d.R + d.G + d.B), d.G / (d.R + d.G + d.B)])))
    .attr("stroke", "#000000")
    .attr("stroke-width", "1.0")
    .attr("fill", "none")

  const xAxis = d3.axisBottom(xScale).tickFormat((x: number) => x.toFixed(1)).ticks(10)
  const yAxis = d3.axisLeft(yScale).tickFormat((x: number) => `${(x).toFixed(1)}`).ticks(5)

  svg.append("g")
    .attr("transform", `translate(0, ${yScale(0)})`).call(xAxis);
  svg.append("g")
    .attr("transform", `translate(${xScale(0)}, 0)`).call(yAxis);

  const whitelist = new Set([
    700, 605, 590, 580, 570, 560, 550, 545, 540, 535, 530, 525, 520, 515, 505, 500, 495, 490, 485, 480, 470, 400
  ])

  const g = svg.selectAll('.marker')
    .data(data.map((d): [number, number, number] => [d.wav, d.R / (d.R + d.G + d.B), d.G / (d.R + d.G + d.B)]).filter(d => whitelist.has(d[0])))
    .enter()
    .append("g")

  g.append("circle")
    .attr("cx", d => xScale(d[1]))
    .attr("cy", d => yScale(d[2]))
    .attr("fill", d => `rgba(${(clamp(0, 1, d[1]) * 255).toFixed()}, ${(clamp(0, 1, d[2]) * 255).toFixed()}, ${(clamp(0, 1, 1 - d[1] - d[2]) * 255).toFixed()}, 1.0)`)
    .attr("stroke", "none")
    .attr("r", 4.0)

  g.append("text")
    .attr("x", d => xScale(d[1]))
    .attr("y", d => yScale(d[2]))
    .attr("stroke", "black")
    .attr("stroke-width", 3)
    .attr("dx", 6)
    .attr("dy", 5)
    .text(d => d[0])

  g.append("text")
    .attr("x", d => xScale(d[1]))
    .attr("y", d => yScale(d[2]))
    .attr("fill", d => `rgba(${(clamp(0, 1, d[1]) * 255).toFixed()}, ${(clamp(0, 1, d[2]) * 255).toFixed()}, ${(clamp(0, 1, 1 - d[1] - d[2]) * 255).toFixed()}, 1.0)`)
    .attr("dx", 6)
    .attr("dy", 5)
    .text(d => d[0])
}

async function xySpectralLocus() {
  const rawXYZ = await d3.text(require('./xyz2006.csv'))
  const data = d3.csvParseRows(rawXYZ).map(d => ({
    wav: parseFloat(d[0]),
    X: parseFloat(d[1]),
    Y: parseFloat(d[2]),
    Z: parseFloat(d[3]),
  }))

  const line = d3.line<[number, number]>()

  const xScale = d3.scaleLinear().domain([0, 1]).range([50, 650])
  const yScale = d3.scaleLinear().domain([0, 1]).range([650, 50])

  line
    .x(d => xScale(d[0]))
    .y(d => yScale(d[1]))
    .curve(d3.curveCardinal)

  svg.append("path")
    .attr("d", line(data.map((d): [number, number] => [d.X / (d.X + d.Y + d.Z), d.Y / (d.X + d.Y + d.Z)])))
    .attr("stroke", "#000000")
    .attr("stroke-width", "1.0")
    .attr("fill", "none")

  const xAxis = d3.axisBottom(xScale).tickFormat((x: number) => x.toFixed(1)).ticks(10)
  const yAxis = d3.axisLeft(yScale).tickFormat((x: number) => `${(x).toFixed(1)}`).ticks(5)

  svg.append("g")
    .attr("transform", `translate(0, ${yScale(0)})`).call(xAxis);
  svg.append("g")
    .attr("transform", `translate(${xScale(0)}, 0)`).call(yAxis);

  const whitelist = new Set([
    700, 605, 590, 580, 570, 560, 550, 545, 540, 535, 530, 525, 520, 515, 505, 500, 495, 490, 485, 480, 470, 400
  ])

  const tri = d3.line<[number, number]>()

  tri
    .x(d => xScale(d[0]))
    .y(d => yScale(d[1]))
    .curve(d3.curveLinearClosed)

  /*
  // Color LCD
  svg.append("path")
    .attr("d", tri([
      [0.659, 0.334],
      [0.320, 0.614],
      [0.151, 0.053]
    ]))
    */

  /*
  // Official sRGB
  svg.append("path")
    .attr("d", tri([
      [0.640, 0.330],
      [0.300, 0.600],
      [0.150, 0.060]
    ]))
  */

 // MacBook Pro sRGB
  svg.append("path")
    .attr("d", tri([
      [0.649, 0.330],
      [0.321, 0.598],
      [0.156, 0.066]
    ]))


  const g = svg.selectAll('.marker')
    .data(data.map((d): [number, number, number] => [d.wav, d.X / (d.X + d.Y + d.Z), d.Y / (d.X + d.Y + d.Z)]).filter(d => whitelist.has(d[0])))
    .enter()
    .append("g")

  g.append("circle")
    .attr("cx", d => xScale(d[1]))
    .attr("cy", d => yScale(d[2]))
    .attr("stroke", "none")
    .attr("r", 4.0)

  g.append("text")
    .attr("x", d => xScale(d[1]))
    .attr("y", d => yScale(d[2]))
    .attr("dx", 6)
    .attr("dy", 5)
    .text(d => d[0])
}

function sRGBcurve() {
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

  const min = 0
  const max = 1

  const xScale = d3.scaleLinear().domain([min, max]).range([50, 350])
  const yScale = d3.scaleLinear().domain([0, 1]).range([350, 50])
  const fnPath = fnToPath(sRGB2linear, xScale, yScale, { min, max })

  svg.append("path")
    .attr("d", fnPath)
    .attr("stroke", "#ff0000")
    .attr("stroke-width", "1.0")
    .attr("fill", "none")

  const xAxis = d3.axisBottom(xScale).tickFormat((x: number) => x.toFixed(1)).ticks(10)
  const yAxis = d3.axisLeft(yScale).tickFormat((x: number) => x.toFixed(1)).ticks(10)

  svg.append("g")
    .attr("transform", "translate(0, 350)").call(xAxis);
  svg.append("g")
    .attr("transform", "translate(50, 0)").call(yAxis);
}

async function purpleCones() {
  function plotCone(data: [number, number][], left: number, top: number) {
    const bottom = top + 150
    const right = left + 200

    const line = d3.line<[number, number]>()

    const xScale = d3.scaleLinear().domain([380, 750]).range([left, right])
    const yScale = d3.scaleLinear().domain([0, 1]).range([bottom, top])

    line
      .x(d => xScale(d[0]))
      .y(d => yScale(d[1]))
      .curve(d3.curveBasis)

    const path = line(data as [number, number][])

    svg.append("path")
      .attr("d", path)
      .attr("stroke", "#ff0000")
      .attr("fill", "none")

    const xAxis = d3.axisBottom(xScale).tickFormat((x: number) => x.toFixed()).ticks(4)
    const yAxis = d3.axisLeft(yScale).tickFormat((x: number) => '').ticks(1)


    svg.append("g")
      .attr("transform", `translate(${left}, 0)`).call(yAxis);
    svg.append("g")
      .attr("transform", `translate(0, ${bottom})`).call(xAxis);
  }

  function mult(a: [number, number][], b: [number, number][]) {
    const merged: [number, number][] = []
    let ai = 0, bi = 0;

    while (ai < a.length && bi < b.length) {
      const wava = a[ai][0]
      const wavb = b[bi][0]
      if (wava === wavb) {
        merged.push([wava, a[ai][1] * b[bi][1]])
        ai++
        bi++
      } else if (wava < wavb) {
        ai++
      } else {
        bi++
      }
    }

    return merged
  }

  let conesRaw = d3.csvParseRows(await d3.text(require('./cones.csv')))
  const cones = conesRaw.map((d): { wav: number, l: number, m: number, s: number } => ({
    wav: parseFloat(d[0]),
    l: parseFloat(d[1]) || 0.0,
    m: parseFloat(d[2]) || 0.0,
    s: parseFloat(d[3]) || 0.0
  })).filter(d => d.wav >= 380 && d.wav <= 750)

  let mba = await d3.csv(require('./Macbook Air 2011.csv'))
  const rgb = mba.map((d): { wav: number, r: number, g: number, b: number } => ({
    wav: parseFloat(d['Wavelength']),
    r: parseFloat(d['red-MacbookAir2011']),
    g: parseFloat(d['green-MacbookAir2011']),
    b: parseFloat(d['blue-MacbookAir2011'])
  })).filter(d => d.wav >= 380 && d.wav <= 750)
  const purpleScreen = rgb.map((d): [number, number] =>
    [
      d.wav,
      150 * (sRGB2linear(0x9B / 0xFF) * d.r +
             sRGB2linear(0x51 / 0xFF) * d.g +
             sRGB2linear(0xE0 / 0xFF) * d.b)
    ]
  )

  const lCone = cones.map((d): [number, number] => [d.wav, d.l])
  const mCone = cones.map((d): [number, number] => [d.wav, d.m])
  const sCone = cones.map((d): [number, number] => [d.wav, d.s])

  const y = purpleScreen

  plotCone(y, 10, 50)
  plotCone(y, 230, 50)
  plotCone(y, 450, 50)

  plotCone(sCone, 10, 50 + 20 + 150)
  plotCone(mCone, 230, 50 + 20 + 150)
  plotCone(lCone, 450, 50 + 20 + 150)

  const sStim = mult(y, sCone)
  const mStim = mult(y, mCone)
  const lStim = mult(y, lCone)

  function tally(d: [number, number][]): number {
    let x = d.filter(d => d[0] >= 380 && d[0] <= 750)
    return x.reduce((sum, a) => isNaN(a[1]) ? sum : sum + a[1], 0) / x.length
  }

  console.log((tally(sStim)).toFixed(2), (tally(mStim)).toFixed(2), (tally(lStim)).toFixed(2))

  plotCone(sStim, 10, 50 + 2 * 20 + 2 * 150)
  plotCone(mStim, 230, 50 + 2 * 20 + 2 * 150)
  plotCone(lStim, 450, 50 + 2 * 20 + 2 * 150)

    /*
  svg.append("g")
    .attr("transform", "translate(50, 0)").call(yAxis);
    */
}

svg.attr('width', 700).attr('height', 700)
bulbPlots()

// screenColor(0x00/0xFF, 0x00/0xFF, 0xE0/0xFF)
// screenColor(0x9B/0xFF, 0x51/0xFF, 0xE0/0xFF)