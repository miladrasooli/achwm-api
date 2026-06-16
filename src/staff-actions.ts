export enum StaffActionKey {
  VIEW_PEOPLE = 'view_people',
  EDIT_PEOPLE = 'edit_people',
  MANAGE_STAFF_PERMISSIONS = 'manage_staff_permissions',
  ACTIVATE_DEACTIVATE_USERS = 'activate_deactivate_users',
  VIEW_COMMUNITIES = 'view_communities',
  CREATE_COMMUNITIES = 'create_communities',
  EDIT_COMMUNITIES = 'edit_communities',
  DELETE_COMMUNITIES = 'delete_communities',
  VIEW_PROJECTS = 'view_projects',
  EDIT_PROJECTS = 'edit_projects',
  ARCHIVE_PROJECTS = 'archive_projects',
  DELETE_PROJECTS = 'delete_projects',
  VIEW_REDCAP = 'view_redcap',
  CREATE_REDCAP = 'create_redcap',
  EDIT_REDCAP = 'edit_redcap',
  DELETE_REDCAP = 'delete_redcap',
}

export type StaffActionDefinition = {
  key: StaffActionKey
  group: string
  label: string
  description?: string
}

export const STAFF_ACTIONS: StaffActionDefinition[] = [
  { key: StaffActionKey.VIEW_PEOPLE, group: 'people', label: 'View people' },
  { key: StaffActionKey.EDIT_PEOPLE, group: 'people', label: 'Edit people' },
  { key: StaffActionKey.MANAGE_STAFF_PERMISSIONS, group: 'people', label: 'Manage staff permissions' },
  { key: StaffActionKey.ACTIVATE_DEACTIVATE_USERS, group: 'people', label: 'Activate/deactivate users' },
  { key: StaffActionKey.VIEW_COMMUNITIES, group: 'communities', label: 'View communities' },
  { key: StaffActionKey.CREATE_COMMUNITIES, group: 'communities', label: 'Create communities' },
  { key: StaffActionKey.EDIT_COMMUNITIES, group: 'communities', label: 'Edit communities' },
  { key: StaffActionKey.DELETE_COMMUNITIES, group: 'communities', label: 'Delete communities' },
  { key: StaffActionKey.VIEW_PROJECTS, group: 'projects', label: 'View projects' },
  { key: StaffActionKey.EDIT_PROJECTS, group: 'projects', label: 'Edit project details' },
  { key: StaffActionKey.ARCHIVE_PROJECTS, group: 'projects', label: 'Archive projects' },
  { key: StaffActionKey.DELETE_PROJECTS, group: 'projects', label: 'Delete projects' },
  { key: StaffActionKey.VIEW_REDCAP, group: 'redcap', label: 'View REDCap servers/templates' },
  { key: StaffActionKey.CREATE_REDCAP, group: 'redcap', label: 'Create REDCap servers/templates' },
  { key: StaffActionKey.EDIT_REDCAP, group: 'redcap', label: 'Edit REDCap servers/templates' },
  { key: StaffActionKey.DELETE_REDCAP, group: 'redcap', label: 'Delete REDCap servers/templates' },
]

export const hasStaffAction = (user: { staff_actions?: string[] } | undefined, action: StaffActionKey) =>
  !!user?.staff_actions?.includes(action)

export const hasAnyStaffAction = (user: { staff_actions?: string[] } | undefined, actions: StaffActionKey[]) =>
  actions.some((action) => hasStaffAction(user, action))
