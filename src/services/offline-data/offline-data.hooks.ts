import { HookOptions } from '../../declarations'
import { OfflineData } from './offline-data.class'

// prettier-ignore
const hooks: HookOptions<OfflineData> = {
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
