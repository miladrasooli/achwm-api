import vega from 'vega'
import vegaLite, { TopLevelSpec } from 'vega-lite'
import { COLORS, FONT_SIZE, STROKE_COLORS } from '../chart-helpers'

export default async function createExampleBoxPlot() {
  const boxPlotData = [
    {
      color: COLORS[0],
      strokeColor: STROKE_COLORS[0],
      minBottom: 0,
      minTop: 2,
      q1: 30,
      medBottom: 54,
      medTop: 56,
      q3: 80,
      maxBottom: 98,
      maxTop: 100,
    },
  ]

  const vegaLiteSpec: TopLevelSpec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    data: { values: boxPlotData },
    width: 698,
    height: 150,
    autosize: {
      type: 'fit',
      contains: 'padding',
    },
    view: {
      stroke: 'transparent',
    },
    layer: [
      {
        // Whiskers
        mark: { type: 'bar' },
        encoding: {
          x: {
            value: 45,
            axis: {
              labels: false,
              grid: true,
            },
          },
          y: { field: 'minBottom', type: 'quantitative' },
          y2: { field: 'maxTop', type: 'quantitative' },
          color: { field: 'strokeColor', type: 'nominal', scale: null, legend: null },
          size: { value: 3 },
        },
      },
      {
        // Main bar
        mark: { type: 'bar', strokeWidth: 3 },
        encoding: {
          x: {
            value: 45,
            axis: {
              labels: false,
              grid: true,
            },
          },
          y: { field: 'q1', type: 'quantitative' },
          y2: { field: 'q3', type: 'quantitative' },
          color: { field: 'color', type: 'nominal', scale: null, legend: null },
          stroke: { field: 'strokeColor', type: 'nominal', scale: null, legend: null },
          size: { value: 60 },
        },
      },
      {
        // Median line
        mark: { type: 'bar' },
        encoding: {
          x: {
            value: 45,
            axis: {
              labels: false,
              grid: true,
            },
          },
          y: { field: 'medBottom', type: 'quantitative' },
          y2: { field: 'medTop', type: 'quantitative' },
          color: { field: 'strokeColor', type: 'nominal', scale: null, legend: null },
          size: { value: 60 },
        },
      },
      {
        // Max line
        mark: { type: 'bar' },
        encoding: {
          x: {
            value: 45,
            axis: {
              labels: false,
              grid: true,
            },
          },
          y: { field: 'maxBottom', type: 'quantitative' },
          y2: { field: 'maxTop', type: 'quantitative' },
          color: { field: 'strokeColor', type: 'nominal', scale: null, legend: null },
          size: { value: 60 },
        },
      },
      {
        // Min line
        mark: { type: 'bar' },
        encoding: {
          x: {
            value: 45,
            axis: {
              labels: false,
              grid: true,
            },
          },
          y: { field: 'minBottom', type: 'quantitative' },
          y2: { field: 'minTop', type: 'quantitative' },
          color: { field: 'strokeColor', type: 'nominal', scale: null, legend: null },
          size: { value: 60 },
        },
      },
      {
        mark: { type: 'rule', strokeWidth: 1 },
        encoding: {
          x: { value: 105 },
          y: { field: 'q1', type: 'quantitative' },
          y2: { field: 'q3', type: 'quantitative' },
        },
      },
      {
        mark: { type: 'rule', strokeWidth: 1 },
        encoding: {
          x: { value: 95 },
          x2: { value: 105 },
          y: { field: 'q1', type: 'quantitative' },
        },
      },
      {
        mark: { type: 'rule', strokeWidth: 1 },
        encoding: {
          x: { value: 95 },
          x2: { value: 105 },
          y: { field: 'q3', type: 'quantitative' },
        },
      },
      {
        mark: {
          type: 'text',
          align: 'left',
          baseline: 'middle',
          fontSize: FONT_SIZE,
          font: 'Montserrat',
          fontWeight: 300,
        },
        encoding: {
          x: { value: 120 }, // moves text 5px right of the line
          y: { field: 'medTop', type: 'quantitative' }, // position at top of line
          text: { value: 'Half of all scores\nare in this range' },
        },
      },
    ],
    encoding: {
      x: {
        axis: {
          grid: false,
          domain: false,
          title: null,
          ticks: false,
        },
        scale: {
          paddingInner: 0.1,
          paddingOuter: 0.1,
        },
      },
      y: {
        field: 'value',
        type: 'quantitative',
        scale: { domain: [0, 100] },
        axis: {
          domain: false,
          title: null,
          grid: false,
          values: [1, 55, 99],
          labelFont: 'Montserrat',
          labelFontWeight: 300,
          labelFontSize: FONT_SIZE,
          labelExpr: `
            datum.value === 1 ? "Lowest Score" :
            datum.value === 55 ? "Middle Score" :
            datum.value === 99 ? "Highest Score" :
            datum.value
          `,
          labelPadding: 12,
          tickSize: 12,
          tickWidth: 2,
        },
      },
    },
  }

  // Transform to low level vega spec to add custom details
  const vegaSpec = vegaLite.compile(vegaLiteSpec).spec

  // Render to SVG
  const view = new vega.View(vega.parse(vegaSpec), { renderer: 'none' })
  let svg = await view.toSVG()

  return `<div style="padding-bottom: 16px; margin-left: -48px;">${svg}</div>`
}
