import { Forbidden } from '@feathersjs/errors'

import { HookContext } from '../declarations'

const restrictPatchToFields = (allowedFields: string[]) => async (context: HookContext) => {
  const { data, method } = context

  if (method !== 'patch') {
    throw new Error(`restrictPatchToFields hook should not be used with ${method} method`)
  }

  for (const field of Object.keys(data)) {
    if (!allowedFields.includes(field)) {
      throw new Forbidden(`"${field}" field can not be patched`)
    }
  }

  return context
}

export default restrictPatchToFields
