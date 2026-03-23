import { JSDOM } from 'jsdom'

export default function createTable(
  tableData: (string | number)[][],
  params: { header?: boolean; footer?: boolean } = {},
) {
  let { header, footer } = params

  const document = new JSDOM('<!DOCTYPE html>').window.document
  const table = document.createElement('table')

  // Header
  let startIndex = 0
  let stopIndex = tableData.length
  if (header) {
    startIndex++

    const headRow = document.createElement('tr')
    for (const entry of tableData[0]) {
      const th = document.createElement('th')
      th.textContent = String(entry)
      headRow.appendChild(th)
    }

    const thead = document.createElement('thead')
    thead.appendChild(headRow)
    table.appendChild(thead)
  }
  if (footer) {
    stopIndex--
  }

  // Body
  if (startIndex !== stopIndex) {
    const tbody = document.createElement('tbody')

    for (const row of tableData.slice(startIndex, stopIndex)) {
      const tr = document.createElement('tr')

      for (const entry of row) {
        const td = document.createElement('td')
        td.textContent = String(entry)
        tr.appendChild(td)
      }

      tbody.appendChild(tr)
    }

    table.appendChild(tbody)
  }

  // Footer
  if (footer) {
    const footRow = document.createElement('tr')

    for (const entry of tableData[stopIndex]) {
      const th = document.createElement('th')
      th.textContent = String(entry)
      footRow.appendChild(th)
    }

    const tfoot = document.createElement('tfoot')
    tfoot.appendChild(footRow)
    table.appendChild(tfoot)
  }

  return table.outerHTML
}
