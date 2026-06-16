import axios from 'axios'

import { BadRequest } from '@feathersjs/errors'
import { Id, Params } from '@feathersjs/feathers'
import { SequelizeService } from 'feathers-sequelize'

import type { SequelizeAdapterOptions } from 'feathers-sequelize/src/declarations'

import { Application } from '../../declarations'
import { ProjectStatusEnum } from '../../models/projects.model'
import { getRedcapCredentials, HEADERS, Metadata } from '../redcap/redcapUtils'

export type ArchiveProjectData = {
  id: Id
}

export type DeleteProjectData = {
  id: Id
  deleteRecords?: boolean
}

export class Projects extends SequelizeService {
  app: Application

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(options: SequelizeAdapterOptions, app: Application) {
    super(options)
    this.app = app
  }

  async archive(data: ArchiveProjectData, params?: Params) {
    const { id } = data

    if (!id) {
      throw new BadRequest('id is required')
    }

    const project = await this.get(id, { ...params, provider: undefined })

    if (project.status === ProjectStatusEnum.ARCHIVED) {
      throw new BadRequest('Project is already archived')
    }

    return this.patch(id, { status: ProjectStatusEnum.ARCHIVED }, { ...params, fromArchiveAction: true } as any)
  }

  async deleteProject(data: DeleteProjectData, params?: Params) {
    const { id, deleteRecords } = data

    if (!id) {
      throw new BadRequest('id is required')
    }

    if (deleteRecords !== undefined && typeof deleteRecords !== 'boolean') {
      throw new BadRequest('deleteRecords must be a boolean')
    }

    if (deleteRecords) {
      await this._deleteAllRedcapRecords(id as string)
    }

    const internalParams = {
      ...(params as any),
      provider: undefined,
    }

    const milestones = await this.app.service('milestones').find({
      query: { project_id: id },
      paginate: false,
    })

    await Promise.all(
      milestones.map((milestone) => this.app.service('milestones').remove(milestone.id, internalParams)),
    )

    return super.remove(id, internalParams)
  }

  async _deleteAllRedcapRecords(projectId: string) {
    const { url, token } = await getRedcapCredentials(projectId, this.app)

    const records: { [Metadata.RECORD_ID]: string }[] = (
      await axios.post(
        url,
        {
          token,
          content: 'record',
          action: 'export',
          format: 'json',
          fields: [Metadata.RECORD_ID],
        },
        HEADERS,
      )
    ).data

    const recordIds = records.map((record) => record[Metadata.RECORD_ID]).filter(Boolean)

    if (recordIds.length === 0) {
      return
    }

    await axios.post(
      url,
      {
        token,
        action: 'delete',
        content: 'record',
        records: recordIds,
      },
      HEADERS,
    )
  }
}
