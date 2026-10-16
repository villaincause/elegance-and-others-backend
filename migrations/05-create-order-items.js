'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('order_items', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      order_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'orders',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE' // Matches order_items_ibfk_1 in SQL 
      },
      product_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'products',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'NO ACTION' // Matches order_items_ibfk_2 in SQL 
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      price_at_purchase: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      size: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      color_name: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      color_hex: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      // Adding timestamps to ensure Sequelize model compatibility
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
    await queryInterface.dropTable('order_items');
  }
};