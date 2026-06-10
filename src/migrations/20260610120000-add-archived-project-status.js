'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      `ALTER TYPE "enum_projects_status" ADD VALUE IF NOT EXISTS 'Archived'`,
    )
  },

  async down() {
    // PostgreSQL does not support removing enum values without recreating the type.
  },
}
