const { createUsersTable } = require('./userDao');
const { createSmsTable } = require('./smsDao');
const { createOrdersTable } = require('./orderDao');
const { createCaptchaTable } = require('./captchaDao');
const { 
  createMcsmInstancesTable, 
  createUserInstanceBindingsTable, 
  createMcsmUsersTable 
} = require('./mcsmDao');

const { pool } = require('./config');

async function initDatabase() {
  try {
    console.log('开始初始化数据库...');
    
    await createUsersTable();
    await createSmsTable();
    await createOrdersTable();
    await createCaptchaTable();
    await createMcsmInstancesTable();
    await createUserInstanceBindingsTable();
    await createMcsmUsersTable();
    
    console.log('数据库初始化完成！');
  } catch (error) {
    console.error('数据库初始化失败:', error);
    throw error;
  }
}

module.exports = { initDatabase };