const axios = require('axios');

class MCSMClient {
    constructor(baseUrl, apiKey) {
        this.baseUrl = baseUrl.replace(/\/$/, '');
        this.apiKey = apiKey;
        this.client = axios.create({
            baseURL: this.baseUrl,
            timeout: 30000,
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            }
        });
    }

    async getSystemInfo() {
        try {
            const response = await this.client.get('/api/system/info');
            return response.data;
        } catch (error) {
            throw new Error(`获取系统信息失败: ${error.message}`);
        }
    }

    async getSystemStatus() {
        try {
            const response = await this.client.get('/api/system/status');
            return response.data;
        } catch (error) {
            throw new Error(`获取系统状态失败: ${error.message}`);
        }
    }

    async getInstances() {
        try {
            const response = await this.client.get('/api/instance/list');
            return response.data.data || [];
        } catch (error) {
            throw new Error(`获取实例列表失败: ${error.message}`);
        }
    }

    async getInstance(instanceId) {
        try {
            const response = await this.client.get(`/api/instance/${instanceId}`);
            return response.data.data;
        } catch (error) {
            throw new Error(`获取实例信息失败: ${error.message}`);
        }
    }

    async getUsers() {
        try {
            const response = await this.client.get('/api/user/list');
            return response.data.data || [];
        } catch (error) {
            throw new Error(`获取用户列表失败: ${error.message}`);
        }
    }

    async createUser(userData) {
        try {
            const response = await this.client.post('/api/user/create', userData);
            return response.data;
        } catch (error) {
            throw new Error(`创建用户失败: ${error.message}`);
        }
    }

    async deleteUser(userId) {
        try {
            const response = await this.client.delete(`/api/user/${userId}`);
            return response.data;
        } catch (error) {
            throw new Error(`删除用户失败: ${error.message}`);
        }
    }

    async startServer(instanceId) {
        try {
            const response = await this.client.post(`/api/instance/${instanceId}/start`);
            return response.data;
        } catch (error) {
            throw new Error(`启动服务器失败: ${error.message}`);
        }
    }

    async stopServer(instanceId) {
        try {
            const response = await this.client.post(`/api/instance/${instanceId}/stop`);
            return response.data;
        } catch (error) {
            throw new Error(`停止服务器失败: ${error.message}`);
        }
    }

    async restartServer(instanceId) {
        try {
            const response = await this.client.post(`/api/instance/${instanceId}/restart`);
            return response.data;
        } catch (error) {
            throw new Error(`重启服务器失败: ${error.message}`);
        }
    }

    async sendCommand(instanceId, command) {
        try {
            const response = await this.client.post(`/api/instance/${instanceId}/command`, {
                command: command
            });
            return response.data;
        } catch (error) {
            throw new Error(`发送命令失败: ${error.message}`);
        }
    }

    async getConsoleLog(instanceId, lines = 50) {
        try {
            const response = await this.client.get(`/api/instance/${instanceId}/log?lines=${lines}`);
            return response.data.data || [];
        } catch (error) {
            throw new Error(`获取控制台日志失败: ${error.message}`);
        }
    }

    async getFileList(instanceId, path = '/') {
        try {
            const response = await this.client.get(`/api/instance/${instanceId}/files?path=${encodeURIComponent(path)}`);
            return response.data.data || [];
        } catch (error) {
            throw new Error(`获取文件列表失败: ${error.message}`);
        }
    }

    async readFile(instanceId, filePath) {
        try {
            const response = await this.client.get(`/api/instance/${instanceId}/files/read?path=${encodeURIComponent(filePath)}`);
            return response.data.data;
        } catch (error) {
            throw new Error(`读取文件失败: ${error.message}`);
        }
    }

    async getBackups(instanceId) {
        try {
            const response = await this.client.get(`/api/instance/${instanceId}/backup/list`);
            return response.data.data || [];
        } catch (error) {
            throw new Error(`获取备份列表失败: ${error.message}`);
        }
    }

    async createBackup(instanceId) {
        try {
            const response = await this.client.post(`/api/instance/${instanceId}/backup/create`);
            return response.data;
        } catch (error) {
            throw new Error(`创建备份失败: ${error.message}`);
        }
    }

    async waitForServerStart(instanceId, maxWaitTime = 60000) {
        const startTime = Date.now();
        while (Date.now() - startTime < maxWaitTime) {
            try {
                const instance = await this.getInstance(instanceId);
                if (instance.status === 'running') {
                    return true;
                }
                await new Promise(resolve => setTimeout(resolve, 2000));
            } catch (error) {
                console.log('等待服务器启动中...');
            }
        }
        throw new Error('服务器启动超时');
    }

    async batchOperation(instanceIds, operation) {
        const results = [];
        for (const instanceId of instanceIds) {
            try {
                let result;
                switch (operation) {
                    case 'start':
                        result = await this.startServer(instanceId);
                        break;
                    case 'stop':
                        result = await this.stopServer(instanceId);
                        break;
                    case 'restart':
                        result = await this.restartServer(instanceId);
                        break;
                    default:
                        throw new Error(`不支持的操作: ${operation}`);
                }
                results.push({
                    instanceId,
                    success: true,
                    result
                });
            } catch (error) {
                results.push({
                    instanceId,
                    success: false,
                    error: error.message
                });
            }
        }
        return results;
    }

    async bindUserToInstance(userId, instanceId, permissions = ['read']) {
        try {
            const response = await this.client.post(`/api/user/${userId}/instance/${instanceId}/bind`, {
                permissions: permissions
            });
            return response.data;
        } catch (error) {
            throw new Error(`绑定用户到实例失败: ${error.message}`);
        }
    }

    async unbindUserFromInstance(userId, instanceId) {
        try {
            const response = await this.client.delete(`/api/user/${userId}/instance/${instanceId}/bind`);
            return response.data;
        } catch (error) {
            throw new Error(`解绑用户从实例失败: ${error.message}`);
        }
    }

    async changeInstancePort(instanceId, newPort) {
        try {
            await this.stopServer(instanceId);
            
            const serverProps = await this.readFile(instanceId, '/server.properties');
            
            const updatedProps = serverProps.replace(/server-port=\d+/g, `server-port=${newPort}`);
            
            const response = await this.client.post(`/api/instance/${instanceId}/files/write`, {
                path: '/server.properties',
                content: updatedProps
            });
            
            await this.restartServer(instanceId);
            
            return response.data;
        } catch (error) {
            throw new Error(`更改实例端口失败: ${error.message}`);
        }
    }
}

module.exports = MCSMClient;
