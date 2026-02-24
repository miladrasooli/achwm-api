import { HookOptions } from '../../declarations'
import { Unsubscribe } from './unsubscribe.class'

// prettier-ignore
const hooks: HookOptions<Unsubscribe> = {
  around: {
    all: [],
    create: [],
  },

  before: {
    all: [],
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
