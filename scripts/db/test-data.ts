import { Application } from '@feathersjs/express'
import { Model } from 'sequelize'
import { Promise } from 'bluebird'
import dayjs from 'dayjs'

import { AdminCommunity } from '../../src/models/admins-communities.model'
import { Community, CommunityStatusEnum } from '../../src/models/communities.model'
import { Dataset } from '../../src/models/datasets.model'
import { Project, ProjectPurposeEnum, ProjectStatusEnum } from '../../src/models/projects.model'
import { RoleEnum, UserProject } from '../../src/models/users-projects.model'
import { User } from '../../src/models/users.model'

import { generateUUID } from '../../src/utils'

enum PronounsEnum {
  HE_HIM = 'He / Him / His',
  SHE_HER = 'She / Her / Hers',
  THEY_THEM = 'They / Them / Theirs',
  OTHER = 'Other',
  PREFER_NOT_TO_SAY = 'Prefer Not To Say',
}

const user_id_1 = generateUUID()
const user_id_2 = generateUUID()
const user_id_3 = generateUUID()
const user_id_4 = generateUUID()
const user_id_5 = generateUUID()
const user_id_6 = generateUUID()
const user_id_7 = generateUUID()
const user_id_8 = generateUUID()
const user_id_9 = generateUUID()

const project_id_1 = generateUUID()
const project_id_2 = generateUUID()
const project_id_3 = generateUUID()
const community_id_1 = generateUUID()
const community_id_2 = generateUUID()
const community_id_3 = generateUUID()
const community_id_4 = generateUUID()

const redcap_server_id = generateUUID()
const redcap_template_id_1 = generateUUID()
const redcap_template_id_2 = generateUUID()

const redcapServers = [
  {
    id: redcap_server_id,
    name: 'CHEO',
    server_url: 'https://redcap.wiikwemkoong.ca/api/',
    supertoken: '013E0150933CFA0223E56D564F4DDE3DC93FA3B7458B799E624B783F0BE42695',
    is_default: true,
  },
]

const redcapTemplates = [
  {
    id: redcap_template_id_1,
    redcap_server_id,
    name: 'Default',
    token: '19E3B5DED3B5895B226EA62285A938FA',
  },
  {
    id: redcap_template_id_2,
    redcap_server_id,
    name: 'Short Test Template',
    token: 'CE52D3130DB8AEA99C8EA50ACA2528BB',
  },
]

const communities: Partial<Community>[] = [
  {
    id: community_id_1,
    name: 'Community 1',
    area: 'Ontario',
    license_expiry: dayjs().add(6, 'months').toDate(),
    status: CommunityStatusEnum.ACTIVE,
    share_name: true,
    platform_license_document_link: 'https://uhndata.io',
    data_stewardship_document_link: 'https://uhndata.io',
    redcap_server_id,
  },
  {
    id: community_id_2,
    name: 'Community 2',
    area: 'Ontario',
    license_expiry: dayjs().add(6, 'months').toDate(),
    status: CommunityStatusEnum.ACTIVE,
    share_name: false,
    platform_license_document_link: 'https://uhndata.io',
    data_stewardship_document_link: 'https://uhndata.io',
    redcap_server_id,
  },
  {
    id: community_id_3,
    name: 'Community 3',
    area: 'Ontario',
    status: CommunityStatusEnum.PENDING,
    platform_license_document_link: 'https://uhndata.io',
    data_stewardship_document_link: 'https://uhndata.io',
  },
  {
    id: community_id_4,
    name: 'Community 4',
    area: 'Ontario',
    license_expiry: dayjs().add(6, 'months').toDate(),
    status: CommunityStatusEnum.ACTIVE,
    share_name: true,
    platform_license_document_link: 'https://uhndata.io',
    data_stewardship_document_link: 'https://uhndata.io',
    redcap_server_id,
  },
]

const users: Partial<User>[] = [
  {
    // Superadmin
    first_name: 'Super',
    last_name: 'Admin',
    email: 'superadmin@test.com',
    password: 'Achwm123!',
    country: 'Canada',
    city: '',
    area: '',
    organization_name: '',
    organization_type: '',
    organization_title: '',
    is_superadmin: true,
  },
  {
    // Admin for Community 1
    id: user_id_1,
    first_name: 'Alicia',
    last_name: 'Anderson',
    email: '1@test.com',
    password: 'Achwm123!',
    country: 'Canada',
    city: 'Toronto',
    area: 'Ontario',
    organization_name: 'UHN',
    organization_type: 'Hospital',
    organization_title: 'Doctor',
  },
  {
    // Coordinator for Community 1
    id: user_id_2,
    first_name: 'Bobby',
    last_name: 'Brown',
    email: '2@test.com',
    password: 'Achwm123!',
    country: 'Canada',
    city: 'Hamilton',
    area: 'Ontario',
    phone_number: '123-456-7890',
    how_did_you_hear_about_us: 'Friend of a friend',
    organization_name: 'UHN',
    organization_type: 'Hospital',
    organization_title: 'Nurse',
  },
  {
    // Facilitator for Community 1
    id: user_id_3,
    first_name: 'Carol',
    last_name: 'Cobb',
    email: '3@test.com',
    password: 'Achwm123!',
    country: 'Canada',
    city: 'Toronto',
    area: 'Ontario',
    organization_name: 'UHN',
    organization_type: 'Hospital',
    organization_title: 'Doctor',
  },
  {
    // Admin for Community 2
    id: user_id_4,
    first_name: 'Danny',
    last_name: 'Dunder',
    email: '4@test.com',
    password: 'Achwm123!',
    country: 'Canada',
    city: 'Hamilton',
    area: 'Ontario',
    organization_name: 'UHN',
    organization_type: 'Hospital',
    organization_title: 'Nurse',
  },
  {
    // Coordinator for Community 2
    id: user_id_5,
    first_name: 'Erika',
    last_name: 'Earnest',
    email: '5@test.com',
    password: 'Achwm123!',
    country: 'Canada',
    city: 'Hamilton',
    area: 'Ontario',
    organization_name: 'UHN',
    organization_type: 'Hospital',
    organization_title: 'Nurse',
  },
  {
    // Facilitator for Community 2
    id: user_id_6,
    first_name: 'Frank',
    last_name: 'Fan',
    email: '6@test.com',
    password: 'Achwm123!',
    country: 'Canada',
    city: 'Hamilton',
    area: 'Ontario',
    organization_name: 'UHN',
    organization_type: 'Hospital',
    organization_title: 'Nurse',
  },
  {
    // Unaffiliated with a community
    id: user_id_7,
    first_name: 'Gerta',
    last_name: 'Gershwin',
    email: '7@test.com',
    password: 'Achwm123!',
    country: 'Canada',
    city: 'Stratford',
    area: 'Ontario',
    organization_name: 'UHN',
    organization_type: 'Hospital',
    organization_title: 'Nurse',
  },
  // Unaffiliated with a community, but after meeting with ACHWM team
  {
    id: user_id_8,
    first_name: 'Henry',
    last_name: 'Higgens',
    email: '8@test.com',
    password: 'Achwm123!',
    country: 'Canada',
    city: 'Stratford',
    area: 'Ontario',
    organization_name: 'UHN',
    organization_type: 'Hospital',
    organization_title: 'Nurse',
  },
  {
    // Admin for Community 4 (No projects)
    id: user_id_9,
    first_name: 'Isadora',
    last_name: 'Ivanova',
    email: '9@test.com',
    password: 'Achwm123!',
    country: 'Canada',
    city: 'Stratford',
    area: 'Ontario',
    organization_name: 'UHN',
    organization_type: 'Hospital',
    organization_title: 'Nurse',
  },
]

const projects: Partial<Project>[] = [
  {
    id: project_id_1,
    name: 'Project 1',
    community_id: community_id_1,
    description: 'Project #1 for Community #1',
    number_of_participants: '1-10 participants',
    purpose: [ProjectPurposeEnum.TRIAGE, ProjectPurposeEnum.POP_HEALTH_ASSESSMENT],
    redcap_template_id: redcap_template_id_1,
  },
  {
    id: project_id_2,
    name: 'Short Test Project',
    community_id: community_id_1,
    description: 'Short test project for Community #1',
    number_of_participants: '1-10 participants',
    purpose: [ProjectPurposeEnum.TRIAGE],
    redcap_template_id: redcap_template_id_2,
  },
  {
    id: project_id_3,
    name: 'Inactive Project',
    community_id: community_id_1,
    description: 'Inactive project for Community #1',
    number_of_participants: '1-10 participants',
    purpose: [ProjectPurposeEnum.TRIAGE],
    status: ProjectStatusEnum.INACTIVE,
    redcap_template_id: redcap_template_id_1,
  },
]

const usersProjects: Partial<UserProject>[] = [
  {
    user_id: user_id_1,
    project_id: project_id_1,
    project_role: RoleEnum.ADMIN,
    project_pin: 'AA111111',
  },
  {
    user_id: user_id_2,
    project_id: project_id_1,
    project_role: RoleEnum.COORDINATOR,
    project_pin: 'BB222222',
  },
  {
    user_id: user_id_3,
    project_id: project_id_1,
    project_role: RoleEnum.FACILITATOR,
    project_pin: 'CC333333',
  },
  {
    user_id: user_id_4,
    project_id: project_id_2,
    project_role: RoleEnum.ADMIN,
    project_pin: 'DD444444',
  },
  {
    user_id: user_id_5,
    project_id: project_id_2,
    project_role: RoleEnum.COORDINATOR,
    project_pin: 'EE555555',
  },
  {
    user_id: user_id_6,
    project_id: project_id_2,
    project_role: RoleEnum.FACILITATOR,
    project_pin: 'FF666666',
  },
]

const now = dayjs().format('YYYY-MM-DD HH:mm:ss')

const participants = [
  {
    participant_id: '0001',
    project_id: project_id_1,
    birth_month: 'January',
    birth_year: 2014,
    pronouns: PronounsEnum.SHE_HER,
    updated_at: now,
    survey_preferences: {
      'Family Environment': 'Standard',
      'Community Version': 'First Nations',
      'Language Preference': 'English',
    },
  },
  {
    participant_id: '0002',
    project_id: project_id_1,
    birth_month: 'February',
    birth_year: 2014,
    pronouns: PronounsEnum.HE_HIM,
    updated_at: now,
  },
  {
    participant_id: '0003',
    project_id: project_id_2,
    birth_month: 'March',
    birth_year: 2014,
    pronouns: PronounsEnum.THEY_THEM,
    updated_at: now,
  },
  {
    participant_id: '0004',
    project_id: project_id_2,
    birth_month: 'April',
    birth_year: 2014,
    pronouns: PronounsEnum.OTHER,
    updated_at: now,
  },
  {
    participant_id: '0005',
    project_id: project_id_2,
    birth_month: 'May',
    birth_year: 2014,
    pronouns: PronounsEnum.PREFER_NOT_TO_SAY,
    updated_at: now,
  },
]

const adminsCommunities: Partial<AdminCommunity>[] = [
  {
    community_id: community_id_3,
    user_id: user_id_8,
  },
  {
    community_id: community_id_4,
    user_id: user_id_9,
    is_first_login: true,
  },
]

const datasets: Partial<Dataset>[] = [
  {
    name: 'Dataset 1 for Project 1',
    project_id: project_id_1,
  },
  {
    name: 'Dataset 2 for Project 1',
    project_id: project_id_1,
  },
  {
    name: 'Dataset 1 for Project 2',
    project_id: project_id_2,
  },
  {
    name: 'Dataset 2 for Project 2',
    project_id: project_id_2,
  },
  {
    name: 'Dataset 1 for Project 3',
    project_id: project_id_3,
  },
  {
    name: 'Dataset 2 for Project 3',
    project_id: project_id_3,
  },
]

export default async function (app: Application) {
  const serviceCreate = (service: any, data: any) => {
    if (Array.isArray(data)) {
      return (Promise as any).each(data, (item: Partial<Model>) => app.service(service).create(item))
    }

    return app.service(service).create(data)
  }

  console.log('Populating database with test data...')

  try {
    await Promise.all([serviceCreate('redcap-servers', redcapServers), serviceCreate('users', users)])
    await Promise.all([serviceCreate('redcap-templates', redcapTemplates), serviceCreate('communities', communities)])
    await serviceCreate('projects', projects)
    await Promise.all([
      serviceCreate('admins-communities', adminsCommunities),
      serviceCreate('users-projects', usersProjects),
      serviceCreate('datasets', datasets),
      serviceCreate('participants', participants),
    ])
  } catch (err) {
    console.error(err)
  }

  console.log('Successfully populated database with test data')
}
