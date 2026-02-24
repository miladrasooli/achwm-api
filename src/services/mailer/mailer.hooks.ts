const { disallow } = require('feathers-hooks-common')

import { HookOptions } from '../../declarations'
import { Mailer } from './mailer.class'

// prettier-ignore
const hooks: HookOptions<Mailer> = {
  around: {
    all: [],
    create: [],
  },

  before: {
    all: [
      disallow('external'),
    ],
    create: [],
  },

  after: {
    all: [],
    create: [],
  },

  error: {
    all: [],
    create: [],
  },
}

export default hooks
