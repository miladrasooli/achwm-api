import { v4 as uuidv4 } from 'uuid'

import { BadRequest } from '@feathersjs/errors'

import { Application } from '../../declarations'
import { Metadata } from '../redcap/redcapUtils'

export class ParticipantUniqueness {
  app: Application

  constructor(app: Application) {
    this.app = app
  }

  // Checks if participant ID and participant UUID are unique across the community
  async create(data: { project_id: string; participant_id: string; participant_uuid: string }) {
    let { project_id, participant_id, participant_uuid } = data

    // Make sure participant ID isn't empty
    if (!participant_id || participant_id === '') {
      throw new BadRequest('Participant ID must not be empty')
    }

    // Find community ID
    const communityId = (await this.app.service('projects').get(project_id)).community_id

    // Find all projects with this community ID
    const projects = await this.app.service('projects').find({
      query: {
        community_id: communityId,
      },
      paginate: false,
    })

    // Find all participant IDs and UUIDs for these projects
    const participantIds = []
    const participantUuids = []

    for (const project of projects) {
      // Find all participants
      const participants = (await this.app.service('participants').find({ query: { project_id: project.id } })) as any[]

      participantIds.push(...participants.map((p) => p[Metadata.PARTICIPANT_ID]))
      participantUuids.push(...participants.map((p) => p[Metadata.PARTICIPANT_UUID]))
    }

    // Make sure new participant ID is unique
    if (participantIds.includes(participant_id)) {
      throw new BadRequest('This participant ID is already in use in this community')
    }

    // Make sure new participant UUID is unique
    while (participantUuids.includes(participant_uuid)) {
      participant_uuid = uuidv4()
    }

    return { ...data, participant_uuid }
  }

  // Checks if new participant ID is unique across the community
  async patch(participant_uuid: string, data: { participant_id: string; project_id: string }) {
    const { participant_id, project_id } = data

    // Make sure participant ID isn't empty
    if (!participant_id || participant_id === '') {
      throw new BadRequest('Participant ID must not be empty')
    }

    // Find community ID
    const communityId = (await this.app.service('projects').get(project_id)).community_id

    // Find all projects with this community ID
    const projects = await this.app.service('projects').find({
      query: {
        community_id: communityId,
      },
      paginate: false,
    })

    // Find all participant IDs for these projects
    const participantIds = []

    for (const project of projects) {
      // Find all participants
      const participants = (await this.app.service('participants').find({
        query: {
          project_id: project.id,
        },
      })) as any[]

      participantIds.push(
        ...participants.map((p) => {
          if (p[Metadata.PARTICIPANT_UUID] !== participant_uuid) {
            return p[Metadata.PARTICIPANT_ID]
          }
        }),
      )
    }

    // Make sure new participant ID is unique
    if (participantIds.includes(participant_id)) {
      throw new BadRequest('This participant ID is already in use in this community')
    }
  }
}
