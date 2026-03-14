'use strict'

import dayjs from 'dayjs'

import { Application } from '../src/declarations'
import { CommunityStatusEnum } from '../src/models/communities.model'

export default async function (app: Application) {
  const communitiesToExpire = await app.service('communities').find({
    query: {
      status: {
        $ne: CommunityStatusEnum.EXPIRED,
      },
      license_expiry: {
        $lt: dayjs(),
      },
    },
    paginate: false,
  })

  await Promise.all(
    communitiesToExpire.map((c) => app.service('communities').patch(c.id, { status: CommunityStatusEnum.EXPIRED })),
  )

  console.log(`Script complete, ${communitiesToExpire.length} communities have expired`)
}
