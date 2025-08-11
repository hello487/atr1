const { getConnection } = require('./config');
const { createAdminsTable } = require('./adminDao');
const { createOrdersTable } = require('./orderDao');
const { createCaptchaTable } = require('./captchaDao');

// 创建用户表
const createUsersTable = async () => {
  const connection = await getConnection();
  
  const sql = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      phone VARCHAR(20) NOT NULL UNIQUE,
      email VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_username (username),
      INDEX idx_phone (phone)
    )
  `;
  
  return new Promise((resolve, reject) => {
    connection.query(sql, (err, results) => {
      connection.release();
      if (err) {
        reject(err);
      } else {
        console.log('用户表创建成功或已存在');
        resolve(results);
      }
    });
  });
};

// 创建短信验证码表
const createSmsCodesTable = async () => {
  const connection = await getConnection();
  
  const sql = `
    CREATE TABLE IF NOT EXISTS sms_codes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      phone VARCHAR(20) NOT NULL,
      code VARCHAR(10) NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_phone (phone),
      INDEX idx_expires (expires_at)
    )
  `;
  
  return new Promise((resolve, reject) => {
    connection.query(sql, (err, results) => {
      connection.release();
      if (err) {
        reject(err);
      } else {
        console.log('短信验证码表创建成功或已存在');
        resolve(results);
      }
    });
  });
};

// 初始化数据库
const initDatabase = async () => {
  try {
    console.log('开始初始化数据库表...');
    await createUsersTable();
    await createSmsCodesTable();
    await createAdminsTable();
    await createOrdersTable();
    await createCaptchaTable();
    console.log('数据库表初始化完成');
  } catch (error) {
    console.error('数据库表初始化失败:', error);
    throw error;
  }
};

// 如果直接运行此脚本，则执行初始化
if (require.main === module) {
  initDatabase()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('初始化过程中出错:', error);
      process.exit(1);
    });
}

module.exports = { initDatabase };