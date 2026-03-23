import vega from 'vega'
import vegaLite, { TopLevelSpec } from 'vega-lite'
import { FONT_SIZE } from '../chart-helpers'
import createExampleBoxPlot from './example-box-plot'

export default async function createBoxPlot(
  boxPlotData: {
    category: string
    min: number
    q1: number
    med: number
    q3: number
    max: number
    color: string
    strokeColor: string
    label: string
  }[],
) {
  const vegaLiteSpec: TopLevelSpec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    data: { values: boxPlotData },
    width: 698,
    height: 350,
    autosize: {
      type: 'fit',
      contains: 'padding',
    },
    transform: [
      {
        calculate: 'datum.med - 0.5',
        as: 'medBottom',
      },
      {
        calculate: 'datum.med + 0.5',
        as: 'medTop',
      },
      {
        calculate: 'datum.max - 0.5',
        as: 'maxBottom',
      },
      {
        calculate: 'datum.max + 0.5',
        as: 'maxTop',
      },
      {
        calculate: 'datum.min - 0.5',
        as: 'minBottom',
      },
      {
        calculate: 'datum.min + 0.5',
        as: 'minTop',
      },
    ],
    layer: [
      {
        // Whiskers
        mark: { type: 'bar' },
        encoding: {
          x: {
            field: 'label',
            type: 'ordinal',
            sort: null,
            axis: {
              labels: true,
              labelFont: 'Montserrat',
              labelFontWeight: 300,
              labelFontSize: FONT_SIZE,
              title: null,
              labelAngle: 0,
            },
          },
          y: { field: 'min', type: 'quantitative' },
          y2: { field: 'max', type: 'quantitative' },
          color: { field: 'strokeColor', type: 'nominal', scale: null, legend: null },
          size: { value: 3 },
        },
      },
      {
        // Main bar
        mark: { type: 'bar', strokeWidth: 3 },
        encoding: {
          x: {
            field: 'category',
            type: 'ordinal',
            axis: {
              labels: false,
              grid: true,
              bandPosition: -0.05,
            },
            sort: null,
          },
          y: { field: 'q1', type: 'quantitative' },
          y2: { field: 'q3', type: 'quantitative' },
          color: { field: 'color', type: 'nominal', scale: null, legend: null },
          stroke: { field: 'strokeColor', type: 'nominal', scale: null, legend: null },
          size: { value: 80 },
        },
      },
      {
        // Median line
        mark: { type: 'bar' },
        encoding: {
          x: {
            field: 'category',
            type: 'ordinal',
            sort: null,
          },
          y: { field: 'medBottom', type: 'quantitative' },
          y2: { field: 'medTop', type: 'quantitative' },
          color: { field: 'strokeColor', type: 'nominal', scale: null, legend: null },
          size: { value: 80 },
        },
      },
      {
        // Max line
        mark: { type: 'bar' },
        encoding: {
          x: {
            field: 'category',
            type: 'ordinal',
            sort: null,
          },
          y: { field: 'maxBottom', type: 'quantitative' },
          y2: { field: 'maxTop', type: 'quantitative' },
          color: { field: 'strokeColor', type: 'nominal', scale: null, legend: null },
          size: { value: 80 },
        },
      },
      {
        // Min line
        mark: { type: 'bar' },
        encoding: {
          x: {
            field: 'category',
            type: 'ordinal',
            sort: null,
          },
          y: { field: 'minBottom', type: 'quantitative' },
          y2: { field: 'minTop', type: 'quantitative' },
          color: { field: 'strokeColor', type: 'nominal', scale: null, legend: null },
          size: { value: 80 },
        },
      },
    ],
    encoding: {
      y: {
        field: 'value',
        type: 'quantitative',
        scale: { domain: [0, 100] },
        axis: {
          domainOpacity: 0.5,
          gridOpacity: 0.3,
          labelFont: 'Montserrat',
          labelFontWeight: 300,
          labelFontSize: FONT_SIZE,
          labelPadding: 6,
          tickOpacity: 0.3,
          title: null,
        },
      },
    },
  }

  // Transform to low level vega spec to add custom details
  const vegaSpec = vegaLite.compile(vegaLiteSpec).spec

  // Render to SVG
  const view = new vega.View(vega.parse(vegaSpec), { renderer: 'none' })
  let svg = await view.toSVG()

  // Get example box plot
  const exampleBoxPlotSvg = await createExampleBoxPlot()

  return `${exampleBoxPlotSvg}${svg}`
}
