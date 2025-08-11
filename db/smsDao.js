// 短信验证码数据访问对象
const smsDao = {
  // 保存验证码
  saveSmsCode: async (phone, code, expiresAt) => {
    let connection;
    try {
      connection = await getConnection();
      
      // 先删除过期的验证码
      await connection.promise().query('DELETE FROM sms_codes WHERE expires_at < NOW()');
      
      const sql = 'INSERT INTO sms_codes (phone, code, expires_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE code = ?, expires_at = ?';
      const values = [phone, code, expiresAt, code, expiresAt];
      
      const [results] = await connection.promise().query(sql, values);
      return results;
    } finally {
      if (connection) connection.release();
    }
  },
  
  // 验证验证码
  verifySmsCode: async (phone, code) => {
    let connection;
    try {
      connection = await getConnection();
      
      // 先删除过期的验证码
      await connection.promise().query('DELETE FROM sms_codes WHERE expires_at < NOW()');
      
      const sql = 'SELECT * FROM sms_codes WHERE phone = ? AND code = ? AND expires_at > NOW()';
      const values = [phone, code];
      
      const [results] = await connection.promise().query(sql, values);
      return results[0]; // 返回匹配的验证码记录或undefined
    } finally {
      if (connection) connection.release();
    }
  },
  
  // 删除特定手机号的验证码（使用后删除）
  deleteSmsCode: async (phone) => {
    let connection;
    try {
      connection = await getConnection();
      
      const sql = 'DELETE FROM sms_codes WHERE phone = ?';
      const values = [phone];
      
      const [results] = await connection.promise().query(sql, values);
      return results;
    } finally {
      if (connection) connection.release();
    }
  },
  
  // 删除过期的短信验证码
  deleteExpiredSmsCodes: async () => {
    let connection;
    try {
      connection = await getConnection();
      
      const sql = 'DELETE FROM sms_codes WHERE expires_at < NOW()';
      
      const [results] = await connection.promise().query(sql);
      console.log(`已删除 ${results.affectedRows} 条过期的短信验证码`);
      return results.affectedRows;
    } finally {
      if (connection) connection.release();
    }
  }
};

module.exports = smsDao;