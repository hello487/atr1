const adminDao = require('./db/adminDao');
const { initDatabase } = require('./db/init');
const bcrypt = require('bcryptjs');

// 默认管理员账户信息
const DEFAULT_ADMIN = {
  username: 'admin',
  password: 'admin123', // 建议上线后修改此默认密码
  email: 'admin@example.com'
};

async function createDefaultAdmin() {
  try {
    // 初始化数据库
    await initDatabase();
    
    // 检查是否已存在管理员账户
    const existingAdmin = await adminDao.findAdminByUsername(DEFAULT_ADMIN.username);
    
    if (existingAdmin) {
      console.log('默认管理员账户已存在:');
      console.log('- 用户名:', existingAdmin.username);
      console.log('- 邮箱:', existingAdmin.email);
      console.log('注意: 出于安全考虑，建议登录后立即修改默认密码');
    } else {
      // 创建默认管理员账户
      const adminData = {
        username: DEFAULT_ADMIN.username,
        password: DEFAULT_ADMIN.password,
        email: DEFAULT_ADMIN.email
      };
      
      const newAdmin = await adminDao.createAdmin(adminData);
      console.log('默认管理员账户创建成功:');
      console.log('- 用户名:', newAdmin.username);
      console.log('- 密码:', DEFAULT_ADMIN.password);
      console.log('- 邮箱:', newAdmin.email);
      console.log('注意: 出于安全考虑，建议登录后立即修改默认密码');
    }
  } catch (error) {
    console.error('创建默认管理员账户时出错:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本，则执行创建默认管理员账户
if (require.main === module) {
  createDefaultAdmin()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('执行过程中出错:', error);
      process.exit(1);
    });
}

module.exports = { createDefaultAdmin };