'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('addresses', {
      id: { 
        type: Sequelize.INTEGER, 
        primaryKey: true, 
        autoIncrement: true, 
        allowNull: false 
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE'
      },
      address_name: { 
        type: Sequelize.STRING(50), 
        defaultValue: 'Home' 
      },
      full_name: { 
        type: Sequelize.STRING(255), 
        allowNull: false 
      },
      address_line1: { 
        type: Sequelize.TEXT, 
        allowNull: false 
      },
      address_line2: { 
        type: Sequelize.TEXT, 
        allowNull: true 
      },
      city: { 
        type: Sequelize.STRING(100), 
        allowNull: false 
      },
      state_region: { 
        type: Sequelize.STRING(100), 
        allowNull: true 
      },
      postal_code: { 
        type: Sequelize.STRING(20), 
        allowNull: false 
      },
      country: { 
        type: Sequelize.STRING(100), 
        defaultValue: 'Bangladesh' 
      },
      phone_number: { 
        type: Sequelize.STRING(20), 
        allowNull: false 
      },
      is_default: { 
        type: Sequelize.BOOLEAN, 
        defaultValue: false 
      },
      created_at: { 
        type: Sequelize.DATE, 
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') 
      },
      updated_at: { 
        type: Sequelize.DATE, 
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') 
      }
    });
  },
  down: async (queryInterface) => { 
    await queryInterface.dropTable('addresses'); 
  }
};