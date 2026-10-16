'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('products', {
      id: { 
        type: Sequelize.INTEGER, 
        primaryKey: true, 
        autoIncrement: true, 
        allowNull: false 
      },
      name: { 
        type: Sequelize.STRING(255), 
        allowNull: false 
      },
      description: { 
        type: Sequelize.TEXT 
      },
      price: { 
        type: Sequelize.DECIMAL(10, 2), 
        allowNull: false 
      },
      category: { 
        type: Sequelize.STRING(100) 
      },
      image_url: { 
        type: Sequelize.STRING(255) 
      },
      images: { 
        type: Sequelize.TEXT // Stored as JSON string
      },
      colors: { 
        type: Sequelize.TEXT 
      },
      sizes: { 
        type: Sequelize.TEXT 
      },
      reviews: { // Added to match your SQL file
        type: Sequelize.TEXT 
      },
      stock_quantity: { 
        type: Sequelize.INTEGER, 
        defaultValue: 0 
      },
      is_new: { // Added to match your SQL file
        type: Sequelize.BOOLEAN, 
        defaultValue: false 
      },
      on_sale: { 
        type: Sequelize.BOOLEAN, 
        defaultValue: false 
      },
      discount_price: { 
        type: Sequelize.DECIMAL(10, 2) 
      },
      created_at: { 
        type: Sequelize.DATE, 
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') 
      },
      updated_at: { // Recommended for Sequelize stability
        type: Sequelize.DATE, 
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') 
      }
    });
  },
  down: async (queryInterface) => { 
    await queryInterface.dropTable('products'); 
  }
};