const { getConnection } = require('./config');
const userDao = require('./userDao');

// 测试数据库连接
async function testConnection() {
  try {
    console.log('测试数据库连接...');
    const connection = await getConnection();
    console.log('数据库连接成功！');
    
    // 测试查询
    const [results] = await connection.promise().query('SELECT 1 + 1 AS solution');
    console.log('基本查询测试:', results[0].solution === 2 ? '通过' : '失败');
    
    connection.release();
    return true;
  } catch (error) {
    console.error('数据库连接失败:', error.message);
    return false;
  }
}

// 测试用户DAO功能
async function testUserDao() {
  try {
    console.log('\n测试用户DAO功能...');
    
    // 测试查找不存在的用户
    const user = await userDao.findUserByLogin('nonexistentuser');
    console.log('查找不存在用户测试:', user === undefined ? '通过' : '失败');
    
    console.log('用户DAO功能测试完成');
    return true;
  } catch (error) {
    console.error('用户DAO功能测试失败:', error.message);
    return false;
  }
}

// 主测试函数
async function runTests() {
  console.log('开始数据库测试...\n');
  
  const connectionSuccess = await testConnection();
  if (!connectionSuccess) {
    process.exit(1);
  }
  
  const userDaoSuccess = await testUserDao();
  if (!userDaoSuccess) {
    process.exit(1);
  }
  
  console.log('\n所有测试通过！');
  process.exit(0);
}

// 如果直接运行此脚本，则执行测试
if (require.main === module) {
  runTests();
}

module.exports = {
  testConnection,
  testUserDao
};