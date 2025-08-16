const { getConnection } = require('./config');

const mcsmDao = {
  
  createMcsmInstancesTable: async () => {
    const connection = await getConnection();
    
    const sql = `
      CREATE TABLE IF NOT EXISTS mcsm_instances (
        id INT AUTO_INCREMENT PRIMARY KEY,
        instance_uuid VARCHAR(100) NOT NULL UNIQUE,
        nickname VARCHAR(100) NOT NULL,
        status VARCHAR(20) DEFAULT 'stopped',
        port INT DEFAULT 25565,
        max_memory INT DEFAULT 1024,
        current_memory INT DEFAULT 0,
        cpu_usage FLOAT DEFAULT 0,
        disk_usage FLOAT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_uuid (instance_uuid),
        INDEX idx_status (status)
      )
    `;
    
    return new Promise((resolve, reject) => {
      connection.query(sql, (err, results) => {
        connection.release();
        if (err) {
          reject(err);
        } else {
          console.log('MCSM实例表创建成功或已存在');
          resolve(results);
        }
      });
    });
  },

  createUserInstanceBindingsTable: async () => {
    const connection = await getConnection();
    
    const sql = `
      CREATE TABLE IF NOT EXISTS user_instance_bindings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        instance_uuid VARCHAR(100) NOT NULL,
        permissions JSON DEFAULT '["read"]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_instance (user_id, instance_uuid),
        INDEX idx_user_id (user_id),
        INDEX idx_instance_uuid (instance_uuid)
      )
    `;
    
    return new Promise((resolve, reject) => {
      connection.query(sql, (err, results) => {
        connection.release();
        if (err) {
          reject(err);
        } else {
          console.log('用户实例绑定表创建成功或已存在');
          resolve(results);
        }
      });
    });
  },

  createMcsmUsersTable: async () => {
    const connection = await getConnection();
    
    const sql = `
      CREATE TABLE IF NOT EXISTS mcsm_users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        mcsm_user_id VARCHAR(100) NOT NULL UNIQUE,
        username VARCHAR(50) NOT NULL,
        password VARCHAR(255) NOT NULL,
        permission VARCHAR(20) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_mcsm_user_id (mcsm_user_id),
        INDEX idx_username (username)
      )
    `;
    
    return new Promise((resolve, reject) => {
      connection.query(sql, (err, results) => {
        connection.release();
        if (err) {
          reject(err);
        } else {
          console.log('MCSM用户表创建成功或已存在');
          resolve(results);
        }
      });
    });
  },

  saveOrUpdateInstance: async (instanceData) => {
    let connection;
    try {
      connection = await getConnection();
      
      const {
        instance_uuid,
        nickname,
        status,
        port,
        max_memory,
        current_memory,
        cpu_usage,
        disk_usage
      } = instanceData;
      
      const sql = `
        INSERT INTO mcsm_instances 
        (instance_uuid, nickname, status, port, max_memory, current_memory, cpu_usage, disk_usage)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        nickname = VALUES(nickname),
        status = VALUES(status),
        port = VALUES(port),
        max_memory = VALUES(max_memory),
        current_memory = VALUES(current_memory),
        cpu_usage = VALUES(cpu_usage),
        disk_usage = VALUES(disk_usage),
        updated_at = CURRENT_TIMESTAMP
      `;
      
      const values = [
        instance_uuid,
        nickname,
        status,
        port || 25565,
        max_memory || 1024,
        current_memory || 0,
        cpu_usage || 0,
        disk_usage || 0
      ];
      
      const [results] = await connection.promise().query(sql, values);
      return results;
    } finally {
      if (connection) connection.release();
    }
  },

  getAllInstances: async () => {
    let connection;
    try {
      connection = await getConnection();
      
      const sql = 'SELECT * FROM mcsm_instances ORDER BY created_at DESC';
      const [results] = await connection.promise().query(sql);
      return results;
    } finally {
      if (connection) connection.release();
    }
  },

  getInstanceByUuid: async (instanceUuid) => {
    let connection;
    try {
      connection = await getConnection();
      
      const sql = 'SELECT * FROM mcsm_instances WHERE instance_uuid = ?';
      const [results] = await connection.promise().query(sql, [instanceUuid]);
      return results[0];
    } finally {
      if (connection) connection.release();
    }
  },

  updateInstanceStatus: async (instanceUuid, status) => {
    let connection;
    try {
      connection = await getConnection();
      
      const sql = 'UPDATE mcsm_instances SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE instance_uuid = ?';
      const [results] = await connection.promise().query(sql, [status, instanceUuid]);
      return results.affectedRows > 0;
    } finally {
      if (connection) connection.release();
    }
  },

  updateInstancePort: async (instanceUuid, port) => {
    let connection;
    try {
      connection = await getConnection();
      
      const sql = 'UPDATE mcsm_instances SET port = ?, updated_at = CURRENT_TIMESTAMP WHERE instance_uuid = ?';
      const [results] = await connection.promise().query(sql, [port, instanceUuid]);
      return results.affectedRows > 0;
    } finally {
      if (connection) connection.release();
    }
  },

  bindUserToInstance: async (userId, instanceUuid, permissions = ['read']) => {
    let connection;
    try {
      connection = await getConnection();
      
      const sql = `
        INSERT INTO user_instance_bindings (user_id, instance_uuid, permissions)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE
        permissions = VALUES(permissions),
        updated_at = CURRENT_TIMESTAMP
      `;
      
      const values = [userId, instanceUuid, JSON.stringify(permissions)];
      const [results] = await connection.promise().query(sql, values);
      return results;
    } finally {
      if (connection) connection.release();
    }
  },

  unbindUserFromInstance: async (userId, instanceUuid) => {
    let connection;
    try {
      connection = await getConnection();
      
      const sql = 'DELETE FROM user_instance_bindings WHERE user_id = ? AND instance_uuid = ?';
      const [results] = await connection.promise().query(sql, [userId, instanceUuid]);
      return results.affectedRows > 0;
    } finally {
      if (connection) connection.release();
    }
  },

  getUserInstances: async (userId) => {
    let connection;
    try {
      connection = await getConnection();
      
      const sql = `
        SELECT b.*, i.nickname, i.status, i.port, i.max_memory, i.current_memory, i.cpu_usage, i.disk_usage
        FROM user_instance_bindings b
        JOIN mcsm_instances i ON b.instance_uuid = i.instance_uuid
        WHERE b.user_id = ?
        ORDER BY b.created_at DESC
      `;
      
      const [results] = await connection.promise().query(sql, [userId]);
      return results.map(row => ({
        ...row,
        permissions: JSON.parse(row.permissions)
      }));
    } finally {
      if (connection) connection.release();
    }
  },

  getInstanceUsers: async (instanceUuid) => {
    let connection;
    try {
      connection = await getConnection();
      
      const sql = `
        SELECT b.*, u.username, u.phone, u.email
        FROM user_instance_bindings b
        JOIN users u ON b.user_id = u.id
        WHERE b.instance_uuid = ?
        ORDER BY b.created_at DESC
      `;
      
      const [results] = await connection.promise().query(sql, [instanceUuid]);
      return results.map(row => ({
        ...row,
        permissions: JSON.parse(row.permissions)
      }));
    } finally {
      if (connection) connection.release();
    }
  },

  checkUserInstancePermission: async (userId, instanceUuid, requiredPermission = 'read') => {
    let connection;
    try {
      connection = await getConnection();
      
      const sql = 'SELECT permissions FROM user_instance_bindings WHERE user_id = ? AND instance_uuid = ?';
      const [results] = await connection.promise().query(sql, [userId, instanceUuid]);
      
      if (results.length === 0) {
        return false;
      }
      
      const permissions = JSON.parse(results[0].permissions);
      return permissions.includes(requiredPermission) || permissions.includes('admin');
    } finally {
      if (connection) connection.release();
    }
  },

  saveMcsmUser: async (userData) => {
    let connection;
    try {
      connection = await getConnection();
      
      const { mcsm_user_id, username, password, permission } = userData;
      
      const sql = `
        INSERT INTO mcsm_users (mcsm_user_id, username, password, permission)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        username = VALUES(username),
        password = VALUES(password),
        permission = VALUES(permission),
        updated_at = CURRENT_TIMESTAMP
      `;
      
      const values = [mcsm_user_id, username, password, permission || 'user'];
      const [results] = await connection.promise().query(sql, values);
      return results;
    } finally {
      if (connection) connection.release();
    }
  },

  getAllMcsmUsers: async () => {
    let connection;
    try {
      connection = await getConnection();
      
      const sql = 'SELECT * FROM mcsm_users ORDER BY created_at DESC';
      const [results] = await connection.promise().query(sql);
      return results;
    } finally {
      if (connection) connection.release();
    }
  },

  deleteMcsmUser: async (mcsmUserId) => {
    let connection;
    try {
      connection = await getConnection();
      
      const sql = 'DELETE FROM mcsm_users WHERE mcsm_user_id = ?';
      const [results] = await connection.promise().query(sql, [mcsmUserId]);
      return results.affectedRows > 0;
    } finally {
      if (connection) connection.release();
    }
  },

  findMcsmUserByUsername: async (username) => {
    let connection;
    try {
      connection = await getConnection();
      
      const sql = 'SELECT * FROM mcsm_users WHERE username = ?';
      const [results] = await connection.promise().query(sql, [username]);
      return results[0];
    } finally {
      if (connection) connection.release();
    }
  }
};

module.exports = mcsmDao;
