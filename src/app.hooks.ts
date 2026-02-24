// Application hooks that run for every service
import { HookOptions } from './declarations'
import globalHooks from './hooks'

// prettier-ignore
const hooks: HookOptions = {
  around: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: [],
  },

  before: {
    all: [
      globalHooks.logger(), 
      globalHooks.attachPriorValues()
    ],
    find: [
      globalHooks.handleNullQuery()
    ],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: [],
  },

  after: {
    all: [
      globalHooks.logger(),
      globalHooks.milestoneLogger()
    ],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: [],
  },

  error: {
    all: [
      globalHooks.logger()
    ],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: [],
  },
}

export default hooks
