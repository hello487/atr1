// 导入所需模块
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const path = require('path');
const svgCaptcha = require('svg-captcha');
// const tencentcloud = require("tencentcloud-sdk-nodejs"); // 实际项目中取消注释

// 加载环境变量
dotenv.config();

// 导入DAO模块
const userDao = require('./db/userDao');
const smsDao = require('./db/smsDao');
const orderDao = require('./db/orderDao');
const paymentDao = require('./db/paymentDao');
const captchaDao = require('./db/captchaDao');
const adminDao = require('./db/adminDao');
const { createDefaultAdmin } = require('./init-admin.js');

// 从db/config.js导入数据库连接
const { pool, getConnection } = require('./db/config');

// 初始化数据库

// 数据库初始化
const { initDatabase } = require('./db/init');

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 服务器启动时初始化数据库
initDatabase().then(() => {
  // 初始化完成后创建默认管理员账户
  createDefaultAdmin().catch(error => {
    console.error('创建默认管理员账户时出错:', error);
  });
});

const servers = [
  {
    id: 1,
    name: '入门型',
    description: '适合小型网站和轻量级应用',
    cpu: 1,
    memory: 2,
    disk: 50,
    bandwidth: 100,
    ports: 3
  },
  {
    id: 2,
    name: '标准型',
    description: '适合中型企业网站和应用',
    cpu: 2,
    memory: 4,
    disk: 100,
    bandwidth: 200,
    ports: 5
  },
  {
    id: 3,
    name: '高性能型',
    description: '适合大型应用和高并发场景',
    cpu: 4,
    memory: 16,
    disk: 500,
    bandwidth: 500,
    ports: 10
  },
  {
    id: 4,
    name: '企业型',
    description: '适合大型企业级应用和数据库服务',
    cpu: 8,
    memory: 32,
    disk: 1000,
    bandwidth: 1000,
    ports: 20
  }
];

// 价格参数 - 在实际项目中这些应该存储在数据库中
const priceParams = {
  cpu: 10,      // 每核心每月价格
  memory: 5,    // 每GB每月价格
  disk: 0.1,    // 每GB每月价格
  bandwidth: 0.5, // 每Mbps每月价格
  port: 2       // 每个端口每月价格
};

// 工具函数：验证手机号格式
function isValidPhone(phone) {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
}

// 工具函数：验证用户名格式
function isValidUsername(username) {
  return username && username.length >= 3 && username.length <= 20;
}

// 工具函数：验证密码格式
function isValidPassword(password) {
  // 至少6位，包含字母和数字
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+={}|[\]:;"'<>?,./`~\-\\]{6,20}$/;
  return password && passwordRegex.test(password);
}

// 工具函数：生成随机验证码
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6位数字验证码
}

// 工具函数：发送短信（实际项目中应调用腾讯云短信API）
async function sendSMS(phone, code) {
  // 检查是否配置了腾讯云参数
  if (process.env.TENCENT_SECRET_ID && 
      process.env.TENCENT_SECRET_KEY &&
      process.env.TENCENT_SMS_SDK_APP_ID &&
      process.env.TENCENT_SMS_SIGN_NAME &&
      process.env.TENCENT_SMS_TEMPLATE_ID &&
      process.env.TENCENT_SECRET_ID !== 'your_secret_id') {
    try {
      // 导入腾讯云短信客户端
      const tencentcloud = require("tencentcloud-sdk-nodejs");
      const SmsClient = tencentcloud.sms.v20210111.Client;
      
      // 创建腾讯云短信客户端实例
      const clientConfig = {
        credential: {
          secretId: process.env.TENCENT_SECRET_ID,
          secretKey: process.env.TENCENT_SECRET_KEY,
        },
        region: "ap-beijing",
        profile: {
          httpProfile: {
            endpoint: "sms.tencentcloudapi.com",
          },
        },
      };
      
      const client = new SmsClient(clientConfig);
      
      const params = {
        PhoneNumberSet: [`+86${phone}`],
        SmsSdkAppId: process.env.TENCENT_SMS_SDK_APP_ID,
        SignName: process.env.TENCENT_SMS_SIGN_NAME,
        TemplateId: process.env.TENCENT_SMS_TEMPLATE_ID,
        TemplateParamSet: [code, "5"], // 验证码和有效分钟数
      };
      
      const result = await client.SendSms(params);
      
      if (result.SendStatusSet && result.SendStatusSet[0].Code === "Ok") {
        return {
          success: true,
          message: "短信发送成功"
        };
      } else {
        console.error("腾讯云短信发送失败:", result);
        return {
          success: false,
          message: "短信发送失败"
        };
      }
    } catch (error) {
      console.error("腾讯云短信发送错误:", error);
      // 如果腾讯云发送失败，回退到模拟发送
      console.log(`发送短信到 ${phone}，验证码是：${code} (模拟发送)`);
      return {
        success: true,
        message: '短信发送成功(模拟)'
      };
    }
  } else {
    // 模拟发送成功
    console.log(`发送短信到 ${phone}，验证码是：${code} (模拟发送)`);
    return {
      success: true,
      message: '短信发送成功(模拟)'
    };
  }
}

// 工具函数：生成JWT令牌（用于管理员身份验证）
function generateAdminToken(admin) {
  return Buffer.from(`admin:${admin.id}:${admin.username}`).toString('base64');
}

// 工具函数：生成用户令牌
function generateUserToken(user) {
  return Buffer.from(`user:${user.id}:${user.username}`).toString('base64');
}

// 工具函数：验证管理员令牌
function verifyAdminToken(token) {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const parts = decoded.split(':');
    if (parts[0] === 'admin') {
      return {
        id: parts[1],
        username: parts[2]
      };
    }
    return null;
  } catch (error) {
    return null;
  }
}

// 工具函数：验证用户令牌
function verifyUserToken(token) {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const parts = decoded.split(':');
    if (parts[0] === 'user') {
      return {
        id: parts[1],
        username: parts[2]
      };
    }
    return null;
  } catch (error) {
    return null;
  }
}

// 用户认证中间件
function requireUserAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: '未提供身份验证令牌'
    });
  }
  
  const token = authHeader.replace('Bearer ', '');
  const user = verifyUserToken(token);
  
  if (!user) {
    return res.status(401).json({
      success: false,
      message: '无效的身份验证令牌'
    });
  }
  
  req.user = user;
  next();
}

// 管理员登录中间件
function requireAdminAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: '未提供身份验证令牌'
    });
  }
  
  const token = authHeader.replace('Bearer ', '');
  const admin = verifyAdminToken(token);
  
  if (!admin) {
    return res.status(401).json({
      success: false,
      message: '无效的身份验证令牌'
    });
  }
  
  req.admin = admin;
  next();
}

// 路由定义

 // 首页路由 - 提供产品页面
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 登录页面路由
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login', 'index.html'));
});

// 购买页面路由
app.get('/buy.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'buy.html'));
});

// 支付页面路由
app.get('/payment.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'payment.html'));
});

// 管理员登录页面路由
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'index.html'));
});

// 管理员仪表板页面路由
app.get('/admin/dashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'dashboard.html'));
});

// 发送短信验证码
app.post('/api/send-sms', async (req, res) => {
  const { phone } = req.body;
  
  // 验证参数
  if (!phone) {
    return res.status(400).json({
      success: false,
      message: '手机号是必填项'
    });
  }
  
  if (!isValidPhone(phone)) {
    return res.status(400).json({
      success: false,
      message: '手机号格式不正确'
    });
  }
  
  // 生成验证码
  const code = generateVerificationCode();
  
  // 设置5分钟后过期
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  
  try {
    // 保存验证码到数据库
    await smsDao.saveSmsCode(phone, code, expiresAt);
    
    // 发送短信（实际项目中应调用腾讯云短信API）
    const result = await sendSMS(phone, code);
    
    if (result.success) {
      res.json({
        success: true,
        message: '验证码已发送'
      });
    } else {
      res.status(500).json({
        success: false,
        message: '短信发送失败'
      });
    }
  } catch (error) {
    console.error('短信发送错误:', error);
    res.status(500).json({
      success: false,
      message: '短信发送失败'
    });
  }
});

// 用户注册
app.post('/api/register', async (req, res) => {
  const { username, password, phone, email, smsCode } = req.body;
  
  // 验证参数
  if (!username || !password || !phone || !smsCode) {
    return res.status(400).json({
      success: false,
      message: '用户名、密码、手机号和短信验证码是必填项'
    });
  }
  
  if (!isValidUsername(username)) {
    return res.status(400).json({
      success: false,
      message: '用户名长度应为3-20个字符'
    });
  }
  
  if (!isValidPassword(password)) {
    return res.status(400).json({
      success: false,
      message: '密码长度应为6-20个字符，且必须包含字母和数字'
    });
  }
  
  if (!isValidPhone(phone)) {
    return res.status(400).json({
      success: false,
      message: '手机号格式不正确'
    });
  }
  
  try {
    // 验证短信验证码
    const savedCode = await smsDao.verifySmsCode(phone, smsCode);
    if (!savedCode) {
      return res.status(400).json({
        success: false,
        message: '短信验证码错误或已过期'
      });
    }
    
    // 检查用户名是否已存在
    const usernameExists = await userDao.checkUsernameExists(username);
    if (usernameExists) {
      return res.status(400).json({
        success: false,
        message: '用户名已存在'
      });
    }
    
    // 检查手机号是否已存在
    const phoneExists = await userDao.checkPhoneExists(phone);
    if (phoneExists) {
      return res.status(400).json({
        success: false,
        message: '手机号已被注册'
      });
    }
    
    // 对密码进行加密
    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);
    
    // 创建新用户
    const newUser = {
      username,
      password: hash, // 存储加密后的密码
      phone,
      email: email || ''
    };
    
    const createdUser = await userDao.createUser(newUser);
    
    // 清除已使用的验证码
    await smsDao.deleteSmsCode(phone);
    
    // 生成令牌
    const token = generateUserToken(createdUser);
    
    res.json({
      success: true,
      message: '注册成功',
      data: {
        token,
        user: {
          id: createdUser.id,
          username: createdUser.username,
          phone: createdUser.phone,
          email: createdUser.email
        }
      }
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({
      success: false,
      message: '注册失败'
    });
  }
});

// 用户名/密码登录
app.post('/api/login', async (req, res) => {
  const { login, password } = req.body;
  
  // 验证参数
  if (!login || !password) {
    return res.status(400).json({
      success: false,
      message: '用户名/手机号和密码是必填项'
    });
  }
  
  try {
    // 查找用户（支持用户名或手机号登录）
    const user = await userDao.findUserByLogin(login);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    // 验证密码
    const result = await bcrypt.compare(password, user.password);
    if (!result) {
      return res.status(401).json({
        success: false,
        message: '密码错误'
      });
    }
    
    // 生成令牌
    const token = generateUserToken(user);
    
    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          phone: user.phone,
          email: user.email
        }
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({
      success: false,
      message: '登录失败'
    });
  }
});

// 短信验证码登录
app.post('/api/login-sms', async (req, res) => {
  const { phone, smsCode } = req.body;
  
  // 验证参数
  if (!phone || !smsCode) {
    return res.status(400).json({
      success: false,
      message: '手机号和短信验证码是必填项'
    });
  }
  
  if (!isValidPhone(phone)) {
    return res.status(400).json({
      success: false,
      message: '手机号格式不正确'
    });
  }
  
  try {
    // 验证短信验证码
    const savedCode = await smsDao.verifySmsCode(phone, smsCode);
    if (!savedCode) {
      return res.status(400).json({
        success: false,
        message: '短信验证码错误或已过期'
      });
    }
    
    // 查找用户
    const user = await userDao.findUserByPhone(phone);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户不存在，请先注册'
      });
    }
    
    // 清除已使用的验证码
    await smsDao.deleteSmsCode(phone);
    
    // 生成令牌
    const token = generateUserToken(user);
    
    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          phone: user.phone,
          email: user.email
        }
      }
    });
  } catch (error) {
    console.error('短信登录错误:', error);
    res.status(500).json({
      success: false,
      message: '登录失败'
    });
  }
});

// 获取所有服务器配置
app.get('/api/servers', (req, res) => {
  res.json({
    success: true,
    data: servers
  });
});

// 根据ID获取特定服务器配置
app.get('/api/servers/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const server = servers.find(s => s.id === id);
  
  if (!server) {
    return res.status(404).json({
      success: false,
      message: '服务器配置未找到'
    });
  }
  
  res.json({
    success: true,
    data: server
  });
});

// 计算服务器价格
app.post('/api/calculate', (req, res) => {
  const { cpu, memory, disk, bandwidth, ports, months } = req.body;
  
  // 验证参数
  if (!cpu || !memory || !disk || !bandwidth || !ports || !months) {
    return res.status(400).json({
      success: false,
      message: '缺少必要的参数'
    });
  }
  
  // 计算价格
  const cpuCost = cpu * priceParams.cpu;
  const memoryCost = memory * priceParams.memory;
  const diskCost = disk * priceParams.disk;
  const bandwidthCost = bandwidth * priceParams.bandwidth;
  const portCost = ports * priceParams.port;
  
  const monthlyCost = cpuCost + memoryCost + diskCost + bandwidthCost + portCost;
  const totalCost = monthlyCost * months;
  
  res.json({
    success: true,
    data: {
      monthlyCost: monthlyCost.toFixed(2),
      totalCost: totalCost.toFixed(2),
      details: {
        cpuCost: cpuCost.toFixed(2),
        memoryCost: memoryCost.toFixed(2),
        diskCost: diskCost.toFixed(2),
        bandwidthCost: bandwidthCost.toFixed(2),
        portCost: portCost.toFixed(2)
      }
    }
  });
});

// 创建订单
app.post('/api/order', requireUserAuth, async (req, res) => {
  const { serverId, cpu, memory, disk, bandwidth, ports, months, customerInfo } = req.body;
  const userId = req.user.id; // 从认证信息中获取用户ID
  
  // 验证参数
  if (!serverId || !cpu || !memory || !disk || !bandwidth || !ports || !months || !customerInfo) {
    return res.status(400).json({
      success: false,
      message: '缺少必要的参数'
    });
  }
  
  try {
    // 生成订单ID
    const orderId = 'ORD' + Date.now();
    
    // 计算价格
    const cpuCost = cpu * priceParams.cpu;
    const memoryCost = memory * priceParams.memory;
    const diskCost = disk * priceParams.disk;
    const bandwidthCost = bandwidth * priceParams.bandwidth;
    const portCost = ports * priceParams.port;
    
    const monthlyCost = cpuCost + memoryCost + diskCost + bandwidthCost + portCost;
    const totalCost = monthlyCost * months;
    
    // 保存订单到数据库
    const orderData = {
      orderId,
      userId,
      serverId,
      cpu,
      memory,
      disk,
      bandwidth,
      ports,
      months,
      monthlyCost: parseFloat(monthlyCost.toFixed(2)),
      totalCost: parseFloat(totalCost.toFixed(2)),
      customerInfo
    };
    
    const createdOrder = await orderDao.createOrder(orderData);
    
    res.json({
      success: true,
      data: {
        orderId: orderId,
        serverId: serverId,
        configuration: {
          cpu,
          memory,
          disk,
          bandwidth,
          ports
        },
        months: months,
        customerInfo: customerInfo,
        pricing: {
          monthlyCost: parseFloat(monthlyCost.toFixed(2)),
          totalCost: parseFloat(totalCost.toFixed(2))
        },
        status: 'pending',
        createdAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('创建订单错误:', error);
    res.status(500).json({
      success: false,
      message: '创建订单失败'
    });
  }
});

// 获取订单详情
app.get('/api/order/:orderId', requireUserAuth, async (req, res) => {
  const { orderId } = req.params;
  const userId = req.user.id;
  
  // 验证参数
  if (!orderId) {
    return res.status(400).json({
      success: false,
      message: '订单ID是必填项'
    });
  }
  
  try {
    // 获取订单详情
    const order = await orderDao.getOrderById(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: '订单未找到'
      });
    }
    
    // 验证订单是否属于当前用户
    if (order.user_id != userId) {
      return res.status(403).json({
        success: false,
        message: '无权访问此订单'
      });
    }
    
    res.json({
      success: true,
      data: {
        orderId: order.order_id,
        serverId: order.server_id,
        configuration: {
          cpu: order.cpu,
          memory: order.memory,
          disk: order.disk,
          bandwidth: order.bandwidth,
          ports: order.ports
        },
        months: order.months,
        pricing: {
          monthlyCost: order.monthly_cost,
          totalCost: order.total_cost
        },
        status: order.status,
        createdAt: order.created_at
      }
    });
  } catch (error) {
    console.error('获取订单详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取订单详情失败'
    });
  }
});

// 获取用户订单列表
app.get('/api/orders', requireUserAuth, async (req, res) => {
  const { userId } = req.query;
  
  if (!userId) {
    return res.status(400).json({
      success: false,
      message: '缺少用户ID参数'
    });
  }
  
  try {
    const orders = await orderDao.getOrdersByUserId(userId);
    
    // 格式化订单数据
    const formattedOrders = orders.map(order => ({
      id: order.id,
      orderId: order.order_id,
      serverId: order.server_id,
      configuration: {
        cpu: order.cpu,
        memory: order.memory,
        disk: order.disk,
        bandwidth: order.bandwidth,
        ports: order.ports
      },
      months: order.months,
      pricing: {
        monthlyCost: order.monthly_cost,
        totalCost: order.total_cost
      },
      customerInfo: {
        name: order.customer_name,
        phone: order.customer_phone,
        email: order.customer_email
      },
      status: order.status,
      createdAt: order.created_at
    }));
    
    res.json({
      success: true,
      data: formattedOrders
    });
  } catch (error) {
    console.error('获取用户订单错误:', error);
    res.status(500).json({
      success: false,
      message: '获取订单失败'
    });
  }
});

// 发起支付
app.post('/api/payment/create', async (req, res) => {
  const { orderId, paymentMethod, amount, description } = req.body;
  
  // 验证参数
  if (!orderId || !paymentMethod || !amount || !description) {
    return res.status(400).json({
      success: false,
      message: '缺少必要的参数'
    });
  }
  
  try {
    let paymentResult;
    
    // 根据支付方式调用不同的支付接口
    if (paymentMethod === 'wechat') {
      paymentResult = await paymentDao.createWechatPayOrder({
        orderId,
        amount,
        description
      });
    } else if (paymentMethod === 'alipay') {
      paymentResult = await paymentDao.createAlipayPayOrder({
        orderId,
        amount,
        description
      });
    } else {
      return res.status(400).json({
        success: false,
        message: '不支持的支付方式'
      });
    }
    
    if (paymentResult.code === 0) {
      res.json({
        success: true,
        data: paymentResult.data
      });
    } else {
      res.status(500).json({
        success: false,
        message: paymentResult.message || '支付订单创建失败'
      });
    }
  } catch (error) {
    console.error('支付订单创建失败:', error);
    res.status(500).json({
      success: false,
      message: '支付订单创建失败'
    });
  }
});

// 查询支付状态
app.get('/api/payment/status/:paymentId/:paymentMethod', async (req, res) => {
  const { paymentId, paymentMethod } = req.params;
  const { orderId } = req.query;
  
  // 验证参数
  if (!paymentId || !paymentMethod || !orderId) {
    return res.status(400).json({
      success: false,
      message: '缺少必要的参数'
    });
  }
  
  try {
    let queryResult;
    
    // 根据支付方式调用不同的查询接口
    if (paymentMethod === 'wechat') {
      queryResult = await paymentDao.queryWechatPayOrder(orderId);
    } else if (paymentMethod === 'alipay') {
      queryResult = await paymentDao.queryAlipayPayOrder(orderId);
    } else {
      return res.status(400).json({
        success: false,
        message: '不支持的支付方式'
      });
    }
    
    if (queryResult.code === 0) {
      res.json({
        success: true,
        data: queryResult.data
      });
    } else {
      res.status(500).json({
        success: false,
        message: queryResult.message || '支付状态查询失败'
      });
    }
  } catch (error) {
    console.error('支付状态查询失败:', error);
    res.status(500).json({
      success: false,
      message: '支付状态查询失败'
    });
  }
});

// 微信支付通知回调
app.post('/api/payment/wechat/notify', express.raw({type: 'application/json'}), (req, res) => {
  // 在实际应用中，这里应该处理微信支付的回调通知
  console.log('收到微信支付回调通知');
  
  // 处理支付结果通知
  // 更新订单状态等操作
  
  // 返回成功响应
  res.json({ code: 'SUCCESS', message: '成功' });
});

// 获取所有订单（管理员功能）
app.get('/api/admin/orders', requireAdminAuth, async (req, res) => {
  try {
    const orders = await orderDao.getAllOrders();
    
    // 格式化订单数据
    const formattedOrders = orders.map(order => ({
      id: order.id,
      orderId: order.order_id,
      userId: order.user_id,
      userUsername: order.user_username,
      serverId: order.server_id,
      configuration: {
        cpu: order.cpu,
        memory: order.memory,
        disk: order.disk,
        bandwidth: order.bandwidth,
        ports: order.ports
      },
      months: order.months,
      pricing: {
        monthlyCost: order.monthly_cost,
        totalCost: order.total_cost
      },
      customerInfo: {
        name: order.customer_name,
        phone: order.customer_phone,
        email: order.customer_email
      },
      status: order.status,
      createdAt: order.created_at
    }));
    
    res.json({
      success: true,
      data: formattedOrders
    });
  } catch (error) {
    console.error('获取订单列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取订单列表失败'
    });
  }
});

// 更新订单状态（管理员功能）
app.put('/api/admin/orders/:orderId/status', requireAdminAuth, async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;
  
  // 验证状态值
  const validStatuses = ['pending', 'paid', 'cancelled', 'completed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: '无效的订单状态'
    });
  }
  
  try {
    const result = await orderDao.updateOrderStatus(orderId, status);
    
    if (result) {
      res.json({
        success: true,
        message: '订单状态更新成功'
      });
    } else {
      res.status(404).json({
        success: false,
        message: '订单未找到'
      });
    }
  } catch (error) {
    console.error('更新订单状态错误:', error);
    res.status(500).json({
      success: false,
      message: '更新订单状态失败'
    });
  }
});

// 支付宝通知回调
app.post('/api/payment/alipay/notify', (req, res) => {
  // 在实际应用中，这里应该处理支付宝的回调通知
  console.log('收到支付宝回调通知');
  
  // 处理支付结果通知
  // 更新订单状态等操作
  
  // 返回成功响应
  res.send('success');
});

// 生成图像验证码
app.get('/api/captcha', async (req, res) => {
  try {
    // 先清理过期的验证码
    await captchaDao.deleteExpiredCaptchas();
    
    // 生成验证码
    const captcha = svgCaptcha.create({
      size: 6, // 验证码长度
      ignoreChars: '0o1iIl', // 排除易混淆字符
      noise: 3, // 干扰线条数量
      color: true, // 彩色验证码
      background: '#f0f0f0' // 背景色
    });
    
    // 生成唯一的验证码ID
    const captchaId = 'CAP' + Date.now() + Math.random().toString(36).substring(2, 10);
    
    // 设置5分钟后过期
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    
    // 保存验证码到数据库
    await captchaDao.saveCaptcha(captchaId, captcha.text.toUpperCase(), expiresAt);
    
    // 检查验证码数据是否存在
    if (!captcha.data) {
      throw new Error('验证码生成失败，未返回SVG数据');
    }
    
    // 返回验证码ID和SVG图像
    res.json({
      success: true,
      data: {
        captchaId: captchaId,
        svg: captcha.data
      }
    });
  } catch (error) {
    console.error('生成验证码错误:', error);
    res.status(500).json({
      success: false,
      message: '生成验证码失败: ' + error.message
    });
  }
});

// 验证图像验证码（用于测试）
app.post('/api/verify-captcha', async (req, res) => {
  const { captchaId, captchaText } = req.body;
  
  // 验证参数
  if (!captchaId || !captchaText) {
    return res.status(400).json({
      success: false,
      message: '验证码ID和验证码文本是必填项'
    });
  }
  
  try {
    // 验证验证码
    const savedCaptcha = await captchaDao.verifyCaptcha(captchaId, captchaText);
    
    if (savedCaptcha) {
      // 标记验证码为已使用
      await captchaDao.markCaptchaAsUsed(captchaId);
      
      res.json({
        success: true,
        message: '验证码正确'
      });
    } else {
      res.status(400).json({
        success: false,
        message: '验证码错误或已过期'
      });
    }
  } catch (error) {
    console.error('验证验证码错误:', error);
    res.status(500).json({
      success: false,
      message: '验证验证码失败'
    });
  }
});

// 管理员登录
app.post('/api/admin/login', async (req, res) => {
  const { username, password, captchaId, captchaText } = req.body;
  
  // 验证参数
  if (!username || !password || !captchaId || !captchaText) {
    return res.status(400).json({
      success: false,
      message: '用户名、密码和验证码是必填项'
    });
  }
  
  try {
    // 验证图像验证码
    const savedCaptcha = await captchaDao.verifyCaptcha(captchaId, captchaText);
    
    if (!savedCaptcha) {
      return res.status(400).json({
        success: false,
        message: '验证码错误或已过期'
      });
    }
    
    // 标记验证码为已使用
    await captchaDao.markCaptchaAsUsed(captchaId);
    
    // 查找管理员
    const admin = await adminDao.findAdminByUsername(username);
    
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: '管理员不存在'
      });
    }
    
    // 验证密码
    const result = await bcrypt.compare(password, admin.password);
    if (!result) {
      return res.status(401).json({
        success: false,
        message: '密码错误'
      });
    }
    
    // 生成令牌
    const token = generateAdminToken(admin);
    
    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        admin: {
          id: admin.id,
          username: admin.username,
          email: admin.email
        }
      }
    });
  } catch (error) {
    console.error('管理员登录错误:', error);
    res.status(500).json({
      success: false,
      message: '登录失败'
    });
  }
});

// 更新管理员密码（管理员功能）
app.put('/api/admin/password', requireAdminAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const adminId = req.admin.id;
  
  // 验证参数
  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: '当前密码和新密码是必填项'
    });
  }
  
  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: '新密码长度至少6位'
    });
  }
  
  try {
    // 查找管理员
    const admin = await adminDao.findAdminByUsername(req.admin.username);
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: '管理员不存在'
      });
    }
    
    // 验证当前密码
    const result = await bcrypt.compare(currentPassword, admin.password);
    if (!result) {
      return res.status(401).json({
        success: false,
        message: '当前密码错误'
      });
    }
    
    // 更新密码
    const updated = await adminDao.updateAdminPassword(adminId, newPassword);
    
    if (updated) {
      res.json({
        success: true,
        message: '密码更新成功'
      });
    } else {
      res.status(500).json({
        success: false,
        message: '密码更新失败'
      });
    }
  } catch (error) {
    console.error('更新管理员密码错误:', error);
    res.status(500).json({
      success: false,
      message: '密码更新失败'
    });
  }
});

// 获取所有用户（管理员功能）
app.get('/api/admin/users', requireAdminAuth, async (req, res) => {
  try {
    const users = await adminDao.getAllUsers();
    
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取用户列表失败'
    });
  }
});

// 删除用户（管理员功能）
app.delete('/api/admin/users/:id', requireAdminAuth, async (req, res) => {
  const userId = parseInt(req.params.id);
  
  if (isNaN(userId)) {
    return res.status(400).json({
      success: false,
      message: '无效的用户ID'
    });
  }
  
  try {
    const result = await adminDao.deleteUser(userId);
    
    if (result) {
      res.json({
        success: true,
        message: '用户删除成功'
      });
    } else {
      res.status(404).json({
        success: false,
        message: '用户未找到'
      });
    }
  } catch (error) {
    console.error('删除用户错误:', error);
    res.status(500).json({
      success: false,
      message: '删除用户失败'
    });
  }
});

// 404 错误处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API 端点未找到'
  });
});

// 全局错误处理
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: '服务器内部错误'
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`云服务器售卖系统后端服务正在运行在端口 ${PORT}`);
  console.log(`访问 http://localhost:${PORT} 查看 API 信息`);
});

module.exports = app;