import dayjs from 'dayjs'

import { Application } from '../../declarations'
import { NotAuthenticated } from '@feathersjs/errors'
import { OfflineSession } from '../../models/offline-sessions.model'
import { Metadata } from '../redcap/redcapUtils'

type ExtendedOfflineSession = OfflineSession & {
  takenParticipantIds: string[]
  takenParticipantUuids: string[]
}

export class OfflineData {
  app: Application

  constructor(app: Application) {
    this.app = app
  }

  async create(data: { projectId: string; offlineSessionId: string }) {
    const { projectId, offlineSessionId } = data

    // Check that projectId and offlineSessionId correspond to each other
    let offlineSession: ExtendedOfflineSession
    try {
      offlineSession = await this.app.service('offline-sessions').get(offlineSessionId)
      if (projectId !== offlineSession.project_id) {
        throw new NotAuthenticated()
      }
    } catch {
      throw new NotAuthenticated()
    }

    // Check that offline session is not expired
    // Give 2 day buffer to accomodate all possible time zones
    const endOfGracePeriod = dayjs(offlineSession.end_date).endOf('day').add(2, 'days')
    if (dayjs().isAfter(endOfGracePeriod)) {
      throw new NotAuthenticated()
    }

    const surveys = await this.app.service('surveys').find({ query: { project_id: projectId } })

    const participants = await this.app.service('participants').find({
      query: {
        project_id: projectId,
      },
    })

    const datasets = await this.app.service('datasets').find({
      paginate: false,
      query: {
        project_id: projectId,
      },
    })

    const project = await this.app.service('projects').get(projectId)

    const scoringDictionary = await this.app.service('scoring-dictionaries').get(projectId)

    // Get list of participant IDs and UUIDs that are currently in use in this community
    const communityId = project.community_id
    const projects = await this.app.service('projects').find({
      query: {
        community_id: communityId,
      },
      paginate: false,
    })

    const participantIds = []
    const participantUuids = []

    for (const project of projects) {
      const participants = (await this.app.service('participants').find({ query: { project_id: project.id } })) as any[]

      participantIds.push(...participants.map((p) => p[Metadata.PARTICIPANT_ID]))
      participantUuids.push(...participants.map((p) => p[Metadata.PARTICIPANT_UUID]))
    }

    offlineSession.takenParticipantIds = participantIds
    offlineSession.takenParticipantUuids = participantUuids

    return {
      offlineSession,
      surveys,
      participants,
      datasets,
      project,
      scoringDictionary,
    }
  }
}
