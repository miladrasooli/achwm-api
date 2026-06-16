'use strict'

const { randomUUID } = require('crypto')

const actions = [
  { key: 'view_people', group: 'people', label: 'View people' },
  { key: 'edit_people', group: 'people', label: 'Edit people' },
  { key: 'manage_staff_permissions', group: 'people', label: 'Manage staff permissions' },
  { key: 'activate_deactivate_users', group: 'people', label: 'Activate/deactivate users' },
  { key: 'view_communities', group: 'communities', label: 'View communities' },
  { key: 'create_communities', group: 'communities', label: 'Create communities' },
  { key: 'edit_communities', group: 'communities', label: 'Edit communities' },
  { key: 'delete_communities', group: 'communities', label: 'Delete communities' },
  { key: 'view_projects', group: 'projects', label: 'View projects' },
  { key: 'edit_projects', group: 'projects', label: 'Edit project details' },
  { key: 'archive_projects', group: 'projects', label: 'Archive projects' },
  { key: 'delete_projects', group: 'projects', label: 'Delete projects' },
  { key: 'view_redcap', group: 'redcap', label: 'View REDCap servers/templates' },
  { key: 'create_redcap', group: 'redcap', label: 'Create REDCap servers/templates' },
  { key: 'edit_redcap', group: 'redcap', label: 'Edit REDCap servers/templates' },
  { key: 'delete_redcap', group: 'redcap', label: 'Delete REDCap servers/templates' },
]

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables()
    const hasTable = (tableName) => tables.includes(tableName)

    if (!hasTable('staff-actions')) {
      await queryInterface.createTable('staff-actions', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          allowNull: false,
          primaryKey: true,
        },
        key: {
          type: Sequelize.ENUM(...actions.map((action) => action.key)),
          allowNull: false,
          unique: true,
        },
        group: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        label: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        description: {
          type: Sequelize.STRING,
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.fn('now'),
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.fn('now'),
        },
      })
    }

    if (!hasTable('staff-action-permissions')) {
      await queryInterface.createTable('staff-action-permissions', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          allowNull: false,
          primaryKey: true,
        },
        user_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id',
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },
        action_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'staff-actions',
            key: 'id',
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },
        granted_by: {
          type: Sequelize.UUID,
          references: {
            model: 'users',
            key: 'id',
          },
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.fn('now'),
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.fn('now'),
        },
      })
    }

    try {
      await queryInterface.addConstraint('staff-action-permissions', {
        fields: ['user_id', 'action_id'],
        type: 'unique',
        name: 'staff_action_permissions_unique',
      })
    } catch (error) {
      if (!String(error).includes('already exists')) {
        throw error
      }
    }

    const now = new Date()
    const actionRows = actions.map((action) => ({
      id: randomUUID(),
      description: null,
      ...action,
      created_at: now,
      updated_at: now,
    }))

    for (const action of actionRows) {
      await queryInterface.sequelize.query(
        `
          INSERT INTO "staff-actions" ("id", "key", "group", "label", "description", "created_at", "updated_at")
          VALUES (:id, :key, :group, :label, :description, :created_at, :updated_at)
          ON CONFLICT ("key") DO UPDATE SET
            "group" = EXCLUDED."group",
            "label" = EXCLUDED."label",
            "description" = EXCLUDED."description",
            "updated_at" = EXCLUDED."updated_at"
        `,
        { replacements: action },
      )
    }

    const userColumns = await queryInterface.describeTable('users')
    const [superadminUsers] = userColumns.is_superadmin
      ? await queryInterface.sequelize.query('SELECT id FROM users WHERE is_superadmin = true')
      : [[]]
    const [staffActions] = await queryInterface.sequelize.query('SELECT id FROM "staff-actions"')

    if (superadminUsers.length > 0 && staffActions.length > 0) {
      for (const user of superadminUsers) {
        for (const action of staffActions) {
          await queryInterface.sequelize.query(
            `
              INSERT INTO "staff-action-permissions"
                ("id", "user_id", "action_id", "granted_by", "created_at", "updated_at")
              VALUES
                (:id, :user_id, :action_id, :granted_by, :created_at, :updated_at)
              ON CONFLICT ("user_id", "action_id") DO NOTHING
            `,
            {
              replacements: {
                id: randomUUID(),
                user_id: user.id,
                action_id: action.id,
                granted_by: user.id,
                created_at: now,
                updated_at: now,
              },
            },
          )
        }
      }
    }

    if (userColumns.is_superadmin) {
      await queryInterface.removeColumn('users', 'is_superadmin')
    }
  },

  async down(queryInterface, Sequelize) {
    const userColumns = await queryInterface.describeTable('users')

    if (!userColumns.is_superadmin) {
      await queryInterface.addColumn('users', 'is_superadmin', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      })
    }

    await queryInterface.dropTable('staff-action-permissions')
    await queryInterface.dropTable('staff-actions')
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_staff-actions_key"')
  },
}
