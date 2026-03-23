import vega from 'vega'
import vegaLite, { TopLevelSpec } from 'vega-lite'

export default async function createPieChart(pieChartData: { category: string; value: number; color: string }[]) {
  // Define high level vega-lite spec
  const vegaLiteSpec: TopLevelSpec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    data: {
      values: pieChartData,
    },
    width: 698,
    height: 500,
    mark: {
      type: 'arc',
      stroke: 'white',
      strokeWidth: 2,
    },
    autosize: { type: 'fit', contains: 'padding' },
    encoding: {
      theta: { field: 'value', type: 'quantitative' },
      color: {
        field: 'category',
        type: 'nominal',
        scale: {
          domain: pieChartData.map((p) => p.category),
          range: pieChartData.map((p) => p.color),
        },
        legend: null,
      },
      order: { field: '_order', type: 'ordinal' },
    },
  }

  // Transform to low level vega spec to add custom details
  const vegaSpec = vegaLite.compile(vegaLiteSpec).spec

  // Render to SVG
  const view = new vega.View(vega.parse(vegaSpec), { renderer: 'none' })
  let svg = await view.toSVG()

  // Add legend
  const labels = []
  for (const entry of pieChartData) {
    labels.push(
      `<div class="legendItem"><svg viewbox="0 0 30 15" width="30px" style="flex-shrink: 0;"><rect width="30" height="15" fill="${entry.color}"/></svg><p>${entry.category}</p></div>`,
    )
  }
  svg = `<div class="legend">${labels.join('')}</div>${svg}`

  return svg
}
