import { EmailTypeEnum } from '../../../models/emails.model'
import resetPassword from './resetPassword'
import verifyEmail from './verifyEmail'
import inviteAdmin from './inviteAdmin'
import inviteCollaborator from './inviteCollaborator'
import requestInvite from './requestInvite'
import enableOfflineMode from './enableOfflineMode'

export type EmailProps = {
  actionUrl: string
  unsubscribeUrl: string
  qrCode?: string
}

export default {
  resetPassword,
  verifyEmail,
  inviteAdmin,
  inviteCollaborator,
  requestInvite,
  enableOfflineMode,
} as Record<EmailTypeEnum, any>
