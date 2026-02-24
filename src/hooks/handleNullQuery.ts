import { HookContext } from '../declarations'

const handleNullQuery = () => (context: HookContext) => {
  const query = context.params.query

  for (const key in query) {
    if (query[key] === 'null') {
      query[key] = null
    }
  }

  return context
}

export default handleNullQuery
