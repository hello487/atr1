
const userDao = {

  checkUsernameExists: async (username) => {
    let connection;
    try {
      connection = await getConnection();
      
      const sql = 'SELECT id FROM users WHERE username = ?';
      const values = [username];
      
      const [results] = await connection.promise().query(sql, values);
      return results.length > 0;
    } finally {
      if (connection) connection.release();
    }
  },
  
  
  checkPhoneExists: async (phone) => {
    let connection;
    try {
      connection = await getConnection();
      
      const sql = 'SELECT id FROM users WHERE phone = ?';
      const values = [phone];
      
      const [results] = await connection.promise().query(sql, values);
      return results.length > 0;
    } finally {
      if (connection) connection.release();
    }
  },
  
  // 根据用户名或手机号查找用户
  findUserByLogin: async (login) => {
    let connection;
    try {
      connection = await getConnection();
      
      const sql = 'SELECT id, username, password, phone, email FROM users WHERE username = ? OR phone = ?';
      const values = [login, login];
      
      const [results] = await connection.promise().query(sql, values);
      return results[0]; // 返回第一个匹配的用户或undefined
    } finally {
      if (connection) connection.release();
    }
  },
  
  // 根据手机号查找用户
  findUserByPhone: async (phone) => {
    let connection;
    try {
      connection = await getConnection();
      
      const sql = 'SELECT id, username, password, phone, email FROM users WHERE phone = ?';
      const values = [phone];
      
      const [results] = await connection.promise().query(sql, values);
      return results[0]; // 返回第一个匹配的用户或undefined
    } finally {
      if (connection) connection.release();
    }
  },
  
  // 创建新用户
  createUser: async (user) => {
    let connection;
    try {
      connection = await getConnection();
      
      const { username, password, phone, email } = user;
      const sql = 'INSERT INTO users (username, password, phone, email) VALUES (?, ?, ?, ?)';
      const values = [username, password, phone, email || null];
      
      const [results] = await connection.promise().query(sql, values);
      
      const selectSql = 'SELECT id, username, password, phone, email FROM users WHERE id = ?';
      const selectValues = [results.insertId];
      
      const [selectResults] = await connection.promise().query(selectSql, selectValues);
      return selectResults[0];
    } finally {
      if (connection) connection.release();
    }
  }
};

module.exports = userDao;