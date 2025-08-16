// 导入MCSM客户端
const MCSMClient = require('./mcsm-api.js');

// 配置信息 - 请根据您的实际情况修改
const CONFIG = {
    baseUrl: 'http://your-mcsm-panel.com',  // 面板地址
    apiKey: 'your-api-key-here'             // API密钥
};

// 创建客户端实例
const mcsm = new MCSMClient(CONFIG.baseUrl, CONFIG.apiKey);
async function basicOperations() {
    console.log('=== 基础操作示例 ===');
    
    try {
        // 1. 获取系统信息
        console.log('1. 获取系统信息...');
        const systemInfo = await mcsm.getSystemInfo();
        console.log('系统信息:', systemInfo);
        
        // 2. 获取实例列表
        console.log('\n2. 获取实例列表...');
        const instances = await mcsm.getInstances();
        console.log(`找到 ${instances.length} 个实例:`);
        instances.forEach((instance, index) => {
            console.log(`  ${index + 1}. ${instance.config.nickname} (${instance.uuid}) - 状态: ${instance.status}`);
        });
        
        // 3. 获取用户列表
        console.log('\n3. 获取用户列表...');
        const users = await mcsm.getUsers();
        console.log(`找到 ${users.length} 个用户:`);
        users.forEach((user, index) => {
            console.log(`  ${index + 1}. ${user.userName} (${user.permission})`);
        });
        
    } catch (error) {
        console.error('基础操作失败:', error.message);
    }
}

async function serverControl() {
    console.log('\n=== 服务器控制示例 ===');
    
    try {
        // 获取实例列表
        const instances = await mcsm.getInstances();
        if (instances.length === 0) {
            console.log('没有找到任何实例');
            return;
        }
        
        const instanceId = instances[0].uuid;
        const instanceName = instances[0].config.nickname;
        
        console.log(`操作实例: ${instanceName} (${instanceId})`);
        
        // 1. 检查服务器状态
        const instance = await mcsm.getInstance(instanceId);
        console.log(`当前状态: ${instance.status}`);
        
        // 2. 如果服务器未运行，启动它
        if (instance.status !== 'running') {
            console.log('启动服务器...');
            await mcsm.startServer(instanceId);
            console.log('启动命令已发送');
            
            // 等待服务器启动
            console.log('等待服务器启动...');
            await mcsm.waitForServerStart(instanceId);
            console.log('服务器已成功启动!');
        }
        
        // 3. 发送控制台命令
        console.log('发送测试命令...');
        await mcsm.sendCommand(instanceId, 'say 来自API的测试消息!');
        
        // 4. 获取控制台日志
        console.log('获取最新日志...');
        const logs = await mcsm.getConsoleLog(instanceId, 10);
        console.log('最新10行日志:');
        logs.forEach(log => {
            console.log(`  ${log.time} - ${log.text}`);
        });
        
    } catch (error) {
        console.error('服务器控制失败:', error.message);
    }
}

/**
 * 文件管理
 */
async function fileManagement() {
    console.log('\n=== 文件管理示例 ===');
    
    try {
        const instances = await mcsm.getInstances();
        if (instances.length === 0) {
            console.log('没有找到任何实例');
            return;
        }
        
        const instanceId = instances[0].uuid;
        
        // 1. 获取根目录文件列表
        console.log('获取根目录文件列表...');
        const files = await mcsm.getFileList(instanceId, '/');
        console.log('根目录文件:');
        files.forEach(file => {
            const type = file.isDir ? '[目录]' : '[文件]';
            console.log(`  ${type} ${file.name}`);
        });
        
        // 2. 读取server.properties文件（如果存在）
        try {
            console.log('\n读取server.properties文件...');
            const serverProps = await mcsm.readFile(instanceId, '/server.properties');
            console.log('server.properties内容:');
            console.log(serverProps);
        } catch (error) {
            console.log('server.properties文件不存在或无法读取');
        }
        
    } catch (error) {
        console.error('文件管理失败:', error.message);
    }
}


async function backupManagement() {
    console.log('\n=== 备份管理示例 ===');
    
    try {
        const instances = await mcsm.getInstances();
        if (instances.length === 0) {
            console.log('没有找到任何实例');
            return;
        }
        
        const instanceId = instances[0].uuid;
        
        // 1. 获取备份列表
        console.log('获取备份列表...');
        const backups = await mcsm.getBackups(instanceId);
        console.log(`找到 ${backups.length} 个备份:`);
        backups.forEach((backup, index) => {
            console.log(`  ${index + 1}. ${backup.fileName} - 大小: ${backup.size} - 时间: ${backup.time}`);
        });
        
        // 2. 创建新备份
        console.log('\n创建新备份...');
        await mcsm.createBackup(instanceId);
        console.log('备份创建命令已发送');
        
    } catch (error) {
        console.error('备份管理失败:', error.message);
    }
}

async function batchOperations() {
    console.log('\n=== 批量操作示例 ===');
    
    try {
        const instances = await mcsm.getInstances();
        if (instances.length === 0) {
            console.log('没有找到任何实例');
            return;
        }
        
        // 获取所有实例的ID
        const instanceIds = instances.map(instance => instance.uuid);
        
        // 批量重启所有实例
        console.log(`批量重启 ${instanceIds.length} 个实例...`);
        const results = await mcsm.batchOperation(instanceIds, 'restart');
        
        console.log('批量操作结果:');
        results.forEach(result => {
            if (result.success) {
                console.log(`  ✓ ${result.instanceId} - 成功`);
            } else {
                console.log(`  ✗ ${result.instanceId} - 失败: ${result.error}`);
            }
        });
        
    } catch (error) {
        console.error('批量操作失败:', error.message);
    }
}

async function monitoring() {
    console.log('\n=== 监控示例 ===');
    
    try {
        // 1. 获取系统状态
        const systemStatus = await mcsm.getSystemStatus();
        console.log('系统状态:', systemStatus);
        
        // 2. 监控所有实例状态
        const instances = await mcsm.getInstances();
        console.log('\n实例状态监控:');
        instances.forEach(instance => {
            const status = instance.status;
            const statusIcon = status === 'running' ? '🟢' : status === 'stopped' ? '🔴' : '🟡';
            console.log(`${statusIcon} ${instance.config.nickname}: ${status}`);
        });
        
    } catch (error) {
        console.error('监控失败:', error.message);
    }
}

/**
 * 主函数 - 运行所有示例
 */
async function main() {
    console.log('MCSM面板API使用示例');
    console.log('==================\n');
    
    // 检查配置
    if (CONFIG.baseUrl === 'http://your-mcsm-panel.com' || CONFIG.apiKey === 'your-api-key-here') {
        console.error('请先修改配置文件中的baseUrl和apiKey!');
        console.log('请在mcsm-example.js文件中修改CONFIG对象的值');
        return;
    }
    
    try {
        // 运行各种示例
        await basicOperations();
        await serverControl();
        await fileManagement();
        await backupManagement();
        await batchOperations();
        await monitoring();
        
        console.log('\n=== 所有示例执行完成 ===');
        
    } catch (error) {
        console.error('示例执行失败:', error.message);
    }
}

// 如果直接运行此文件，执行主函数
if (require.main === module) {
    main();
}

// 导出示例函数供其他文件使用
module.exports = {
    basicOperations,
    serverControl,
    fileManagement,
    backupManagement,
    batchOperations,
    monitoring
};
