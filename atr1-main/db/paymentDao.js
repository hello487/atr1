const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

// 延迟初始化微信支付和支付宝支付，在实际调用时才初始化
let wechatPay = null;
let alipay = null;

// 初始化微信支付的函数
function initWechatPay() {
  if (wechatPay) return true;
  
  // 检查是否配置了微信支付参数
  if (!process.env.WECHAT_PAY_APP_ID || 
      !process.env.WECHAT_PAY_MCH_ID || 
      !process.env.WECHAT_PAY_PUBLIC_KEY || 
      !process.env.WECHAT_PAY_PRIVATE_KEY || 
      !process.env.WECHAT_PAY_API_V3_KEY ||
      process.env.WECHAT_PAY_APP_ID === 'your_wechat_pay_app_id') {
    console.log('微信支付参数未配置完整，跳过初始化');
    return false;
  }
  
  try {
    const WechatPay = require('wechatpay-node-v3');
    wechatPay = new WechatPay({
      appid: process.env.WECHAT_PAY_APP_ID,
      mchid: process.env.WECHAT_PAY_MCH_ID,
      publicKey: process.env.WECHAT_PAY_PUBLIC_KEY,
      privateKey: process.env.WECHAT_PAY_PRIVATE_KEY,
      apiV3Key: process.env.WECHAT_PAY_API_V3_KEY,
      notify_url: process.env.WECHAT_PAY_NOTIFY_URL
    });
    console.log('微信支付初始化成功');
    return true;
  } catch (error) {
    console.error('微信支付初始化失败:', error);
    return false;
  }
}

// 初始化支付宝支付的函数
function initAlipay() {
  if (alipay) return true;
  
  // 检查是否配置了支付宝参数
  if (!process.env.ALIPAY_APP_ID || 
      !process.env.ALIPAY_PRIVATE_KEY || 
      !process.env.ALIPAY_PUBLIC_KEY ||
      process.env.ALIPAY_APP_ID === 'your_alipay_app_id') {
    console.log('支付宝参数未配置完整，跳过初始化');
    return false;
  }
  
  try {
    const AlipaySdk = require('alipay-sdk').default;
    alipay = new AlipaySdk({
      appId: process.env.ALIPAY_APP_ID,
      privateKey: process.env.ALIPAY_PRIVATE_KEY,
      alipayPublicKey: process.env.ALIPAY_PUBLIC_KEY,
      gateway: process.env.ALIPAY_GATEWAY || 'https://openapi.alipay.com/gateway.do',
      timeout: process.env.ALIPAY_TIMEOUT || 5000
    });
    console.log('支付宝初始化成功');
    return true;
  } catch (error) {
    console.error('支付宝初始化失败:', error);
    return false;
  }
}

// 支付数据访问对象
const paymentDao = {
  // 创建微信支付订单
  createWechatPayOrder: async (paymentInfo) => {
    try {
      // 尝试初始化微信支付
      const isInitialized = initWechatPay();
      if (!isInitialized) {
        return {
          code: -1,
          message: '微信支付未配置或配置不完整'
        };
      }
      
      // 模拟调用微信支付接口
      // 在实际项目中应集成微信支付SDK
      console.log('创建微信支付订单:', paymentInfo);
      
      // 模拟返回支付信息
      return {
        code: 0,
        message: '成功',
        data: {
          paymentId: `WXP${Date.now()}`,
          prepayId: `prepay_${Date.now()}`,
          nonceStr: Math.random().toString(36).substring(2, 15),
          timestamp: Math.floor(Date.now() / 1000),
          sign: 'mock-signature'
        }
      };
    } catch (error) {
      console.error('创建微信支付订单失败:', error);
      return {
        code: -1,
        message: '创建微信支付订单失败'
      };
    }
  },
  
  // 查询微信支付订单
  queryWechatPayOrder: async (orderId) => {
    try {
      // 尝试初始化微信支付
      const isInitialized = initWechatPay();
      if (!isInitialized) {
        return {
          code: -1,
          message: '微信支付未配置或配置不完整'
        };
      }
      
      // 模拟调用微信支付查询接口
      console.log('查询微信支付订单:', orderId);
      
      // 模拟返回支付状态
      return {
        code: 0,
        message: '成功',
        data: {
          status: 'SUCCESS',
          transactionId: `wx${Date.now()}`,
          payTime: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('查询微信支付订单失败:', error);
      return {
        code: -1,
        message: '查询微信支付订单失败'
      };
    }
  },
  
  // 创建支付宝支付订单
  createAlipayPayOrder: async (paymentInfo) => {
    try {
      // 尝试初始化支付宝支付
      const isInitialized = initAlipay();
      if (!isInitialized) {
        return {
          code: -1,
          message: '支付宝未配置或配置不完整'
        };
      }
      
      // 模拟调用支付宝支付接口
      console.log('创建支付宝支付订单:', paymentInfo);
      
      // 模拟返回支付信息
      return {
        code: 0,
        message: '成功',
        data: {
          paymentId: `ALI${Date.now()}`,
          alipayTradeNo: `20210011066${Date.now()}`,
          qrCodeUrl: `https://mock-qr-code.com/${Date.now()}`,
          redirectUrl: `https://alipay.com/pay/${Date.now()}`
        }
      };
    } catch (error) {
      console.error('创建支付宝支付订单失败:', error);
      return {
        code: -1,
        message: '创建支付宝支付订单失败'
      };
    }
  },
  
  // 查询支付宝支付订单
  queryAlipayPayOrder: async (orderId) => {
    try {
      // 尝试初始化支付宝支付
      const isInitialized = initAlipay();
      if (!isInitialized) {
        return {
          code: -1,
          message: '支付宝未配置或配置不完整'
        };
      }
      
      // 模拟调用支付宝支付查询接口
      console.log('查询支付宝支付订单:', orderId);
      
      // 模拟返回支付状态
      return {
        code: 0,
        message: '成功',
        data: {
          status: 'TRADE_SUCCESS',
          alipayTradeNo: `20210011066${Date.now()}`,
          payTime: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('查询支付宝支付订单失败:', error);
      return {
        code: -1,
        message: '查询支付宝支付订单失败'
      };
    }
  }
};

module.exports = paymentDao;