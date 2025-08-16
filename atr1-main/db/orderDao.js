const { getConnection } = require('./config');

// 创建订单表
const createOrdersTable = async () => {
  let connection;
  try {
    connection = await getConnection();
    
    const sql = `
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id VARCHAR(50) NOT NULL UNIQUE,
        user_id INT,
        server_id INT NOT NULL,
        cpu INT NOT NULL,
        memory INT NOT NULL,
        disk INT NOT NULL,
        bandwidth INT NOT NULL,
        ports INT NOT NULL,
        months INT NOT NULL,
        monthly_cost DECIMAL(10, 2) NOT NULL,
        total_cost DECIMAL(10, 2) NOT NULL,
        status ENUM('pending', 'paid', 'cancelled', 'completed') DEFAULT 'pending',
        customer_name VARCHAR(100),
        customer_phone VARCHAR(20),
        customer_email VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_order_id (order_id),
        INDEX idx_user_id (user_id),
        INDEX idx_status (status),
        INDEX idx_created_at (created_at)
      )
    `;
    
    await connection.promise().query(sql);
    console.log('订单表创建成功或已存在');
  } finally {
    if (connection) connection.release();
  }
};

// 订单数据访问对象
const orderDao = {
  // 创建订单
  createOrder: async (order) => {
    let connection;
    try {
      connection = await getConnection();
      
      const sql = 'INSERT INTO orders (order_id, user_id, server_id, cpu, memory, disk, bandwidth, ports, months, monthly_cost, total_cost, customer_name, customer_phone, customer_email, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
      const values = [order.orderId, order.userId, order.serverId, order.cpu, order.memory, order.disk, order.bandwidth, order.ports, 
        order.months, order.monthlyCost, order.totalCost, order.customerInfo.name, order.customerInfo.phone, 
        order.customerInfo.email, 'pending'];
      
      const [results] = await connection.promise().query(sql, values);
      return {
        id: results.insertId,
        ...order,
        status: 'pending',
        createdAt: new Date().toISOString()
      };
    } finally {
      if (connection) connection.release();
    }
  },
  
  // 获取所有订单
  getAllOrders: async () => {
    let connection;
    try {
      connection = await getConnection();
      
      const sql = `
        SELECT o.*, u.username as user_username 
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        ORDER BY o.created_at DESC
      `;
      
      const [results] = await connection.promise().query(sql);
      return results;
    } finally {
      if (connection) connection.release();
    }
  },
  
  // 根据用户ID获取订单
  getOrdersByUserId: async (userId) => {
    let connection;
    try {
      connection = await getConnection();
      
      const sql = 'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC';
      const values = [userId];
      
      const [results] = await connection.promise().query(sql, values);
      return results;
    } finally {
      if (connection) connection.release();
    }
  },
  
  // 更新订单状态
  updateOrderStatus: async (orderId, status) => {
    let connection;
    try {
      connection = await getConnection();
      
      const sql = 'UPDATE orders SET status = ? WHERE order_id = ?';
      const values = [status, orderId];
      
      const [results] = await connection.promise().query(sql, values);
      return results.affectedRows > 0;
    } finally {
      if (connection) connection.release();
    }
  },

  // 根据订单ID获取订单详情
  getOrderById: async (orderId) => {
    let connection;
    try {
      connection = await getConnection();
      
      const sql = 'SELECT * FROM orders WHERE order_id = ?';
      const values = [orderId];
      
      const [results] = await connection.promise().query(sql, values);
      return results[0]; // 返回第一个匹配的订单或undefined
    } finally {
      if (connection) connection.release();
    }
  }
};

// 添加createOrdersTable到导出
module.exports = {
  ...orderDao,
  createOrdersTable
};