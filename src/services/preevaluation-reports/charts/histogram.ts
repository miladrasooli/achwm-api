import vega from 'vega'
import vegaLite, { TopLevelSpec } from 'vega-lite'
import { FONT_SIZE } from '../chart-helpers'

export default async function createHistogram(
  histogramData: { [key: string]: string | number }[],
  color: string,
  labelAngle: boolean,
) {
  const [xAxis, yAxis] = Object.keys(histogramData[0])

  const maxValue = Math.max(...(histogramData.map((h) => h[yAxis]) as number[]))

  // Define high level vega-lite spec
  const vegaLiteSpec: TopLevelSpec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    data: {
      values: histogramData,
    },
    width: 698,
    height: 350,
    autosize: {
      type: 'fit',
      contains: 'padding',
    },
    mark: {
      type: 'bar',
      align: 'center',
      color,
    },
    encoding: {
      x: {
        field: `${xAxis}`,
        type: 'nominal',
        sort: null,
        axis: {
          domainOpacity: 0.5,
          gridOpacity: 0.3,
          labelAngle: labelAngle ? -30 : 0,
          grid: true,
          bandPosition: -0.35,
          labelFont: 'Montserrat',
          labelFontWeight: 300,
          labelFontSize: FONT_SIZE,
          labelPadding: labelAngle ? 0 : 6,
          title: null,
          tickOpacity: 0.3,
        },
        scale: {
          paddingInner: 0.4,
          paddingOuter: 0.2,
        },
      },
      y: {
        field: `${yAxis}`,
        type: 'quantitative',
        axis: {
          domainOpacity: 0.5,
          gridOpacity: 0.3,
          labelFont: 'Montserrat',
          labelFontWeight: 300,
          labelFontSize: FONT_SIZE,
          labelPadding: 6,
          titleFont: 'Montserrat',
          titleFontWeight: 300,
          titleFontSize: FONT_SIZE,
          tickOpacity: 0.3,
          format: 'd',
          tickMinStep: 1,
          values: maxValue <= 5 ? Array.from({ length: maxValue + 1 }, (_, i) => i) : undefined,
        },
      },
    },
  }

  // Transform to low level vega spec to add custom details
  const vegaSpec = vegaLite.compile(vegaLiteSpec).spec

  // Render to SVG
  const view = new vega.View(vega.parse(vegaSpec), { renderer: 'none' })
  let svg = await view.toSVG()

  // Add legend
  svg = `
    <div class="legend">
      <div class="legendItem">
        <svg viewbox="0 0 30 15" width="30px">
          <rect width="30" height="15" fill="${color}"/>
        </svg>
        <p>${xAxis}</p>
      </div>
    </div>${svg}
  `

  return svg
}
