const { getConnection } = require('./config');

// 创建验证码表
const createCaptchaTable = async () => {
  let connection;
  try {
    connection = await getConnection();
    
    const sql = `
      CREATE TABLE IF NOT EXISTS captcha (
        id INT AUTO_INCREMENT PRIMARY KEY,
        captcha_id VARCHAR(50) NOT NULL UNIQUE,
        captcha_text VARCHAR(10) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL,
        is_used BOOLEAN DEFAULT FALSE,
        INDEX idx_captcha_id (captcha_id),
        INDEX idx_expires_at (expires_at)
      )
    `;
    
    await connection.promise().query(sql);
    console.log('验证码表创建成功或已存在');
  } finally {
    if (connection) connection.release();
  }
};

// 保存验证码
const saveCaptcha = async (captchaId, captchaText, expiresAt) => {
  let connection;
  try {
    connection = await getConnection();
    
    const sql = 'INSERT INTO captcha (captcha_id, captcha_text, expires_at) VALUES (?, ?, ?)';
    const values = [captchaId, captchaText, expiresAt];
    
    const [results] = await connection.promise().query(sql, values);
    return results.insertId;
  } finally {
    if (connection) connection.release();
  }
};

// 验证验证码
const verifyCaptcha = async (captchaId, captchaText) => {
  let connection;
  try {
    connection = await getConnection();
    
    // 先删除过期的验证码
    await connection.promise().query('DELETE FROM captcha WHERE expires_at < NOW()');
    
    const sql = `
      SELECT * FROM captcha 
      WHERE captcha_id = ? 
      AND captcha_text = ? 
      AND expires_at > NOW() 
      AND is_used = FALSE
    `;
    const values = [captchaId, captchaText.toUpperCase()]; // 不区分大小写验证
    
    const [results] = await connection.promise().query(sql, values);
    return results[0]; // 返回匹配的验证码记录或undefined
  } finally {
    if (connection) connection.release();
  }
};

// 标记验证码为已使用
const markCaptchaAsUsed = async (captchaId) => {
  let connection;
  try {
    connection = await getConnection();
    
    const sql = 'UPDATE captcha SET is_used = TRUE WHERE captcha_id = ?';
    const values = [captchaId];
    
    const [results] = await connection.promise().query(sql, values);
    return results.affectedRows > 0;
  } finally {
    if (connection) connection.release();
  }
};

// 删除过期的验证码
const deleteExpiredCaptchas = async () => {
  let connection;
  try {
    connection = await getConnection();
    
    const sql = 'DELETE FROM captcha WHERE expires_at < NOW()';
    
    const [results] = await connection.promise().query(sql);
    console.log(`已删除 ${results.affectedRows} 条过期的验证码`);
    return results.affectedRows;
  } finally {
    if (connection) connection.release();
  }
};

module.exports = {
  createCaptchaTable,
  saveCaptcha,
  verifyCaptcha,
  markCaptchaAsUsed,
  deleteExpiredCaptchas
};