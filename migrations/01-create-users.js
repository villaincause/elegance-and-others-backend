'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('users', {
      id: { 
        type: Sequelize.INTEGER, 
        primaryKey: true, 
        autoIncrement: true, 
        allowNull: false 
      },
      full_name: { 
        type: Sequelize.STRING(255), // Matches SQL varchar(255)
        allowNull: false 
      },
      email: { 
        type: Sequelize.STRING(255), 
        allowNull: false, 
        unique: true 
      },
      password: { 
        type: Sequelize.STRING(255), 
        allowNull: false 
      },
      role: { 
        type: Sequelize.STRING(50), // Matches SQL varchar(50)
        defaultValue: 'customer' 
      },
      profile_picture: { 
        type: Sequelize.STRING(255), 
        defaultValue: 'default-avatar.png' 
      },
      phone_number: { 
        type: Sequelize.STRING(20) // Matches SQL varchar(20)
      },
      created_at: { 
        type: Sequelize.DATE, 
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') 
      },
      updated_at: { // Required for Sequelize stability
        type: Sequelize.DATE, 
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') 
      }
    });
  },
  down: async (queryInterface) => { 
    await queryInterface.dropTable('users'); 
  }
};