import { Application } from '../declarations'

import authManagement from './auth-management/auth-management.service'
import adminsCommunities from './admins-communities/admins-communities.service'
import communities from './communities/communities.service'
import datasets from './datasets/datasets.service'
import emails from './emails/emails.service'
import invitations from './invitations/invitations.service'
import milestones from './milestones/milestones.service'
import mailer from './mailer/mailer.service'
import offlineData from './offline-data/offline-data.service'
import offlineSessions from './offline-sessions/offline-sessions.service'
import participants from './participants/participants.service'
import projects from './projects/projects.service'
import redcap from './redcap/redcap.service'
import redcapServers from './redcap-servers/redcap-servers.service'
import redcapTemplates from './redcap-templates/redcap-templates.service'
import scoringDictionaries from './scoring-dictionaries/scoring-dictionaries.service'
import superadminTableSettings from './superadmin-table-settings/superadmin-table-settings.service'
import surveyResponses from './survey-responses/survey-responses.service'
import surveys from './surveys/surveys.service'
import unsubscribe from './unsubscribe/unsubscribe.service'
import usersProjects from './users-projects/users-projects.service'
import users from './users/users.service'
import verification from './verification/verification.service'

export default function (app: Application): void {
  app.configure(authManagement)
  app.configure(adminsCommunities)
  app.configure(communities)
  app.configure(datasets)
  app.configure(emails)
  app.configure(invitations)
  app.configure(milestones)
  app.configure(mailer)
  app.configure(offlineData)
  app.configure(offlineSessions)
  app.configure(participants)
  app.configure(projects)
  app.configure(redcap)
  app.configure(redcapServers)
  app.configure(redcapTemplates)
  app.configure(scoringDictionaries)
  app.configure(superadminTableSettings)
  app.configure(surveyResponses)
  app.configure(surveys)
  app.configure(unsubscribe)
  app.configure(usersProjects)
  app.configure(users)
  app.configure(verification)
}
