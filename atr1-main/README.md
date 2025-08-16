# 云服务器售卖系统后端

基于 Node.js 和 Express 构建的云服务器售卖系统后端服务。

## 功能特性

- 提供服务器配置信息 API
- 实时计算服务器价格
- 订单创建和管理
- 用户注册和登录功能
- 密码加密存储
- 手机短信验证码登录/注册
- MySQL数据库存储用户数据
- RESTful API 设计
- 微信支付和支付宝集成
- 管理员后台管理功能
- 管理员登录图像验证码验证

## 管理员功能

系统提供管理员后台管理功能，包括：

1. 用户管理：
   - 查看所有注册用户
   - 删除用户

2. 订单管理：
   - 查看所有订单
   - 管理订单状态（待支付、已支付、已取消、已完成）

3. 安全功能：
   - 图像验证码验证登录
   - 管理员密码修改

### 管理员登录

管理员可以通过访问 `/admin/index.html` 进入管理登录页面。登录时需要输入用户名、密码和图像验证码。

### 管理员面板

登录成功后将跳转到 `/admin/dashboard.html`，在此可以管理用户和订单。

## 技术栈

- Node.js
- Express.js
- cors
- dotenv
- bcryptjs (密码加密)
- tencentcloud-sdk-nodejs (腾讯云SDK)
- mysql2 (MySQL数据库驱动)
- wechatpay-node-v3 (微信支付SDK)
- alipay-sdk (支付宝SDK)

## 安装和运行

1. 安装依赖：
   ```
   npm install
   ```

2. 配置数据库：
   - 确保MySQL服务正在运行
   - 在MySQL中创建数据库：`CREATE DATABASE cloud_server;`
   - 更新 [.env]文件中的数据库配置

3. 启动开发服务器：
   ```
   npm run dev
   ```

4. 或者启动生产服务器：
   ```
   npm start
   ```

服务器将在 `http://localhost:3000` 上运行。

## 打包和部署

### 打包项目

要创建项目发行包，可以使用以下命令：

```
npm run pack
```

这将创建一个 `.tgz` 文件，可以用于分发或部署。

### 构建生产环境

要为生产环境构建项目，运行：

```
npm run build
```

这将安装生产依赖并优化项目以供部署。

### 部署说明

1. 确保目标服务器已安装 Node.js (版本 >= 14.0.0) 和 npm
2. 将项目文件复制到服务器
3. 安装生产依赖：
   ```
   npm install --production
   ```
4. 配置环境变量（参考 [.env]文件）
5. 启动服务：
   ```
   npm start
   ```
   
或者使用进程管理器（如 PM2）来管理应用：
```
npm install -g pm2
pm2 start server.js --name "cloud-server"
```

### Docker 部署（可选）

项目根目录包含 Dockerfile，可以用于容器化部署：

```
docker build -t cloud-server .
docker run -d -p 3000:3000 --name cloud-server-app cloud-server
```

## 数据库设计

### 用户表 (users)
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL UNIQUE,
  email VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 短信验证码表 (sms_codes)
```sql
CREATE TABLE sms_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  phone VARCHAR(20) NOT NULL,
  code VARCHAR(10) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_phone (phone),
  INDEX idx_expires (expires_at)
);
```

## API 端点

### 用户认证

- `POST /api/register` - 用户注册（需要短信验证码验证，支持手机号注册）
- `POST /api/login` - 用户名/手机号 + 密码登录
- `POST /api/login-sms` - 手机号 + 短信验证码登录
- `POST /api/send-sms` - 发送短信验证码（用于注册或登录）

### 获取服务器配置

- `GET /api/servers` - 获取所有服务器配置列表
- `GET /api/servers/:id` - 获取特定ID的服务器配置详情

### 价格计算

- `POST /api/calculate` - 实时计算自定义服务器配置价格

请求体示例：
```json
{
  "cpu": 4,          // CPU核心数
  "memory": 16,      // 内存大小（GB）
  "disk": 500,       // 硬盘容量（GB）
  "bandwidth": 100,  // 带宽（Mbps）
  "ports": 5,        // 公网IP数量
  "months": 12       // 购买时长（月）
}
```

## 可选配置参数

API 支持以下可选参数来进一步定制服务器配置：

- `os`: 操作系统类型（如 "Linux", "Windows"）
- `datacenter`: 数据中心位置（如 "北京", "上海", "广州"）
- `backup`: 是否启用自动备份（布尔值）
- `ssl`: 是否需要SSL证书（布尔值）
- `firewall`: 是否启用防火墙（布尔值）
- `dedicated_ip`: 是否需要独立公网IP（布尔值）

这些可选参数可以根据具体业务需求添加到请求体中。

### 订单管理

- `POST /api/order` - 创建新订单并生成支付请求

请求体示例：
```json
{
  "serverId": 1,     // 服务器配置ID（可选）
  "cpu": 4,          // 自定义配置参数（可选）
  "memory": 16,
  "disk": 500,
  "bandwidth": 100,
  "ports": 5,
  "months": 12,
  "customerInfo": {  // 客户信息
    "name": "张三",
    "email": "zhangsan@example.com",
    "phone": "13800138000"
  }
}
```

## 前端页面

- `/` - 主页（产品概览）
- `/login` - 用户登录/注册页面（包含两个功能模块：用户名/密码登录与短信验证码登录/注册）
- `/buy.html` - 服务器配置和购买页面（可自定义配置并实时计算价格）
- `/payment.html` - 支付页面
- `/admin` - 管理员登录页面
- `/admin/dashboard.html` - 管理员仪表板页面

## 目录结构

```
.
├── server.js          # 主服务器文件
├── package.json       # 项目依赖和配置
├── .env               # 环境变量配置
├── README.md          # 项目说明文档
├── db/                # 数据库相关文件
│   ├── config.js      # 数据库配置
│   ├── init.js        # 数据库初始化
│   ├── userDao.js     # 用户数据访问对象
│   └── smsDao.js      # 短信验证码数据访问对象
├── public/            # 前端静态文件
│   ├── index.html     # 产品展示页面
│   ├── buy.html       # 购买配置页面
│   ├── payment.html   # 支付页面
│   ├── test.html      # 测试页面
│   ├── login/         # 登录/注册页面目录
│   │   ├── index.html # 登录/注册页面
│   │   ├── app.js     # 登录/注册页面逻辑
│   │   └── style.css  # 登录/注册页面样式
│   └── admin/         # 管理员页面目录
│       ├── index.html # 管理员登录页面
│       └── dashboard.html # 管理员仪表板页面
```

## 管理员账户

系统默认不创建管理员账户。为了安全起见，需要手动运行初始化脚本来创建默认管理员账户：

```bash
node init-admin.js
```

该脚本会创建以下默认管理员账户：
- 用户名: admin
- 密码: 123456
- 邮箱: admin@example.com

**安全提醒**: 出于安全考虑，强烈建议在首次登录后立即修改默认密码。

## 安全特性

### 密码加密
- 使用 bcryptjs 对用户密码进行加密存储
- 默认使用 10 轮加密

### 短信验证码
- 6位数字验证码
- 5分钟有效期
- 防止重复发送（60秒冷却时间）

### 输入验证
- 用户名格式验证（3-20个字符）
- 密码格式验证（6-20个字符）
- 手机号格式验证（中国大陆手机号）
- 邮箱格式验证

## 开发说明

1. 所有 API 端点都以 `/api` 开头
2. 成功的响应格式：
   ```json
   {
     "success": true,
     "data": {}
   }
   ```

3. 错误响应格式：
   ```json
   {
     "success": false,
     "message": "错误信息"
   }
   ```

## 用户认证功能说明

### 注册功能
- 用户名长度应为3-20个字符
- 密码长度应为6-20个字符
- 必须提供有效的中国大陆手机号
- 必须提供有效的短信验证码
- 手机号必须唯一，不能重复注册

### 登录功能
- 支持两种登录方式：
  1. 用户名/手机号 + 密码登录
  2. 手机号 + 短信验证码登录

### 短信验证码功能
- 用户注册时需要短信验证码验证
- 用户可以通过短信验证码直接登录
- 验证码60秒内不能重复发送

## 腾讯云短信集成说明

当前版本使用模拟短信发送功能，在实际部署时需要：

1. 在 `.env` 文件中配置腾讯云短信参数：
   ```
   TENCENT_SECRET_ID=your_secret_id
   TENCENT_SECRET_KEY=your_secret_key
   TENCENT_SMS_SDK_APP_ID=your_sdk_app_id
   TENCENT_SMS_SIGN_NAME=your_sign_name
   TENCENT_SMS_TEMPLATE_ID=your_template_id
   ```

2. 取消注释 [server.js]中的腾讯云短信集成代码并注释模拟发送函数

## 数据库配置说明

1. 确保本地已安装并运行MySQL服务
2. 创建数据库：
   ```sql
   CREATE DATABASE cloud_server;
   ```
3. 在 [.env]文件中配置数据库连接参数：
   ```
   DB_HOST=localhost
   DB_USER=your_username
   DB_PASSWORD=your_password
   DB_NAME=cloud_server
   ```
4. 应用启动时会自动创建所需的表结构

## 支付功能说明

系统已集成微信支付和支付宝功能：

### 微信支付
- 需要在 `.env` 文件中配置微信支付相关参数
- 支持创建支付订单和查询支付状态

### 支付宝
- 需要在 `.env` 文件中配置支付宝相关参数
- 支持创建支付订单和查询支付状态

### 支付回调
- 系统提供微信支付和支付宝的回调接口
- 支付完成后会自动更新订单状态

## 可选功能配置说明

本系统支持在缺少第三方服务配置的情况下正常启动，部分功能将受限：

### 短信服务
- **可选配置**：腾讯云短信服务参数
- **默认行为**：未配置时使用模拟发送，仅在控制台输出验证码
- **生产环境**：建议配置真实的腾讯云短信服务参数以启用真实短信发送功能

### 支付功能
- **可选配置**：微信支付和支付宝参数
- **默认行为**：未配置时支付功能仍然可用，但会返回配置缺失提示
- **生产环境**：必须配置真实的支付参数以启用完整支付功能

### 配置检查
系统在启动时会检查配置完整性，并在日志中输出相关提示信息，便于部署时确认配置状态。

## 后续改进建议

1. 添加 JWT 令牌认证
2. 实现完整的订单管理系统
3. 添加支付接口集成
4. 实现服务器配置的管理后台
5. 添加更完善的安全防护措施（如频率限制）
6. 集成真实的腾讯云短信服务
7. 添加邮箱验证功能
8. 实现数据库连接池监控
9. 添加数据库备份和恢复机制