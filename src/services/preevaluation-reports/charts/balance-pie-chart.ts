import vega from 'vega'
import vegaLite, { TopLevelSpec } from 'vega-lite'

import { startCase } from 'lodash'

export default async function createBalancePieChart(
  balancePieChartData: {
    category: string
    value: number
    color: string
  }[],
) {
  // Define high level vega-lite spec
  const vegaLiteSpec: TopLevelSpec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    width: 698,
    height: 500,
    autosize: { type: 'fit', contains: 'padding' },
    layer: [
      ...(getBackgroundLayers() as any),
      {
        data: {
          values: balancePieChartData,
        },
        mark: {
          type: 'arc',
          stroke: 'white',
          strokeWidth: 2,
        },
        transform: [
          {
            calculate: '(datum.index + 3) % 4 + 1',
            as: 'thetaStart',
          },
          {
            calculate: '(datum.index + 3) % 4 + 2',
            as: 'thetaEnd',
          },
        ],
        encoding: {
          theta: {
            field: 'thetaStart',
            type: 'quantitative',
            scale: { domain: [0, 4] },
          },
          theta2: {
            field: 'thetaEnd',
            type: 'quantitative',
          },
          radius: {
            field: 'value',
            type: 'quantitative',
            scale: { zero: true, domain: [0, 100] },
          },
          color: {
            field: 'category',
            type: 'nominal',
            scale: {
              domain: balancePieChartData.map((b) => b.category),
              range: balancePieChartData.map((b) => b.color),
            },
            legend: null,
          },
        },
      },
    ],
  }

  // Transform to low level vega spec to add custom details
  const vegaSpec = vegaLite.compile(vegaLiteSpec).spec

  // Render to SVG
  const view = new vega.View(vega.parse(vegaSpec), { renderer: 'none' })
  let svg = await view.toSVG()

  // Add legend
  const labels = []
  for (const entry of balancePieChartData) {
    labels.push(
      `<div class="legendItem"><svg viewbox="0 0 30 15" width="30px"><rect width="30" height="15" fill="${
        entry.color
      }"/></svg><p>${startCase(entry.category.split('_')[0])}</p></div>`,
    )
  }
  svg = `<div class="legend">${labels.join('')}</div>${svg}`

  return svg
}

const getBackgroundLayers = () => {
  return [100, 90, 80, 70, 60, 50, 40, 30, 20, 10].flatMap((num) => [
    {
      data: {
        values: [{ category: num, value: num }],
      },
      mark: {
        type: 'arc',
        stroke: 'lightgrey',
        strokeWidth: 0.5,
      },
      encoding: {
        radius: {
          field: 'value',
          type: 'quantitative',
          scale: { zero: true, domain: [0, 100] },
        },
        color: {
          value: 'white',
        },
      },
    },
    {
      data: { values: [{ category: num, value: num }] },
      mark: {
        type: 'text',
        align: 'center',
        baseline: 'middle',
        font: 'Montserrat',
        stroke: 'white',
        strokeWidth: 10,
      },
      encoding: {
        text: { field: 'category', type: 'nominal' },
        theta: { value: 0 },
        radius: { field: 'value', type: 'quantitative' },
      },
    },
    {
      data: { values: [{ category: num, value: num }] },
      mark: {
        type: 'text',
        align: 'center',
        baseline: 'middle',
        font: 'Montserrat',
      },
      encoding: {
        text: { field: 'category', type: 'nominal' },
        theta: { value: 0 },
        radius: { field: 'value', type: 'quantitative' },
        color: {
          value: 'gray',
        },
      },
    },
  ])
}
