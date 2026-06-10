'use strict'

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') })

const { execSync } = require('child_process')
const path = require('path')

const trim = (value) => (value == null ? '' : String(value).trim())

const user = trim(process.env.POSTGRES_USER)
const password = trim(process.env.POSTGRES_PASSWORD)
const host = trim(process.env.POSTGRES_HOST)
const database = trim(process.env.POSTGRES_DB)
const port = trim(process.env.POSTGRES_PORT) || '5432'

if (!user || !host || !database) {
  console.error(
    'Missing Postgres env vars. Set POSTGRES_USER, POSTGRES_HOST, and POSTGRES_DB in achwm-api/.env',
  )
  process.exit(1)
}

const command = process.argv[2] || 'db:migrate'
const url = `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`
const root = path.resolve(__dirname, '../..')

execSync(`npx sequelize ${command} --migrations-path ./src/migrations --url "${url}"`, {
  stdio: 'inherit',
  cwd: root,
})
