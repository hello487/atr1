const { getConnection } = require('./config');
const bcrypt = require('bcryptjs');

// 创建管理员表
const createAdminsTable = async () => {
  let connection;
  try {
    connection = await getConnection();
    
    const sql = `
      CREATE TABLE IF NOT EXISTS admins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_username (username)
      )
    `;
    
    await connection.promise().query(sql);
    console.log('管理员表创建成功或已存在');
  } finally {
    if (connection) connection.release();
  }
};

// 根据用户名查找管理员
const findAdminByUsername = async (username) => {
  let connection;
  try {
    connection = await getConnection();
    
    const sql = 'SELECT * FROM admins WHERE username = ?';
    const values = [username];
    
    const [results] = await connection.promise().query(sql, values);
    return results[0]; // 返回第一个匹配的管理员或undefined
  } finally {
    if (connection) connection.release();
  }
};

// 创建新管理员
const createAdmin = async (adminData) => {
  let connection;
  try {
    connection = await getConnection();
    
    // 对密码进行加密
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(adminData.password, saltRounds);
    
    const { username, email } = adminData;
    const sql = 'INSERT INTO admins (username, password, email) VALUES (?, ?, ?)';
    const values = [username, hashedPassword, email];
    
    const [results] = await connection.promise().query(sql, values);
    return {
      id: results.insertId,
      username,
      email
    };
  } finally {
    if (connection) connection.release();
  }
};

// 更新管理员密码
const updateAdminPassword = async (adminId, newPassword) => {
  let connection;
  try {
    connection = await getConnection();
    
    // 对新密码进行加密
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    const sql = 'UPDATE admins SET password = ? WHERE id = ?';
    const values = [hashedPassword, adminId];
    
    const [results] = await connection.promise().query(sql, values);
    return results.affectedRows > 0;
  } finally {
    if (connection) connection.release();
  }
};

// 获取所有用户
const getAllUsers = async () => {
  let connection;
  try {
    connection = await getConnection();
    
    const sql = 'SELECT id, username, phone, email, created_at FROM users ORDER BY created_at DESC';
    
    const [results] = await connection.promise().query(sql);
    return results;
  } finally {
    if (connection) connection.release();
  }
};

// 删除用户
const deleteUser = async (userId) => {
  let connection;
  try {
    connection = await getConnection();
    
    const sql = 'DELETE FROM users WHERE id = ?';
    const values = [userId];
    
    const [results] = await connection.promise().query(sql, values);
    return results.affectedRows > 0;
  } finally {
    if (connection) connection.release();
  }
};

module.exports = {
  createAdminsTable,
  findAdminByUsername,
  createAdmin,
  updateAdminPassword,
  getAllUsers,
  deleteUser
};