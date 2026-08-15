const { createApp } = Vue;

function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        showLogs: params.get('showLogs') === 'true',
        showHttpLogs: params.get('showHttpLogs') === 'true'
    };
}

createApp({
    data() {
        return {
            status: {
                connected: false,
                machineId: '',
                version: '',
                platform: '',
                upgradeInfo: null,
                deviceCount: 0,
                requestCount: 0,
                cacheSize: 0,
                uptime: 0
            },
            devices: [],
            logs: [],
            httpLogs: [],
            logIdCounter: 0,
            lastDeviceCount: 0,
            showLogs: false,
            showHttpLogs: false
        };
    },
    computed: {
        uptime() {
            const elapsed = this.status.uptime || 0;
            const hours = Math.floor(elapsed / 3600);
            const minutes = Math.floor((elapsed % 3600) / 60);
            const seconds = elapsed % 60;
            
            if (hours > 0) {
                return `${hours}h ${minutes}m ${seconds}s`;
            } else if (minutes > 0) {
                return `${minutes}m ${seconds}s`;
            } else {
                return `${seconds}s`;
            }
        }
    },
    methods: {
        formatTime(seconds) {
            if (seconds < 60) {
                return `${seconds}秒`;
            } else if (seconds < 3600) {
                const minutes = Math.floor(seconds / 60);
                const secs = seconds % 60;
                return `${minutes}分${secs}秒`;
            } else {
                const hours = Math.floor(seconds / 3600);
                const minutes = Math.floor((seconds % 3600) / 60);
                return `${hours}小时${minutes}分`;
            }
        },
        formatHttpTime(timestamp) {
            const date = new Date(timestamp);
            return date.toLocaleTimeString();
        },
        addLog(message, type = 'info') {
            const timestamp = new Date().toLocaleTimeString();
            this.logs.unshift({ 
                id: this.logIdCounter++, 
                timestamp, 
                message, 
                type 
            });
            if (this.logs.length > 100) {
                this.logs.pop();
            }
        },
        clearLogs() {
            this.logs = [];
            this.addLog('日志已清空', 'info');
        },
        async checkUpdate() {
            try {
                this.addLog('正在检查更新...', 'info');
                const response = await fetch('/check-update', { method: 'POST' });
                const data = await response.json();
                if (data.success && data.upgradeInfo) {
                    this.status.upgradeInfo = data.upgradeInfo;
                    if (data.upgradeInfo.canUpgrade) {
                        this.addLog('发现新版本可用', 'success');
                    } else {
                        this.addLog('已是最新版本', 'info');
                    }
                }
            } catch (e) {
                this.addLog('检查更新失败: ' + e.message, 'error');
            }
        },
        async doUpgrade() {
            const info = this.status.upgradeInfo;
            if (!info || !info.canUpgrade) return;

            if (this.status.platform === 'linux') {
                this.addLog('正在执行更新脚本...', 'info');
                try {
                    const resp = await fetch('/exec-upgrade', { method: 'POST' });
                    const data = await resp.json();
                    if (data.success) {
                        this.addLog('更新脚本已执行，请稍后刷新页面', 'success');
                    } else {
                        this.addLog('更新失败: ' + (data.error || '未知错误'), 'error');
                    }
                } catch (e) {
                    this.addLog('更新请求失败: ' + e.message, 'error');
                }
            } else {
                // 其他系统：复制升级页面链接
                const pageUrl = info.proxyUpgradePageUrl ;
                if (pageUrl) {
                    try {
                        await navigator.clipboard.writeText(pageUrl);
                        this.addLog(`下载链接已复制: ${pageUrl}`, 'success');
                    } catch (e) {
                        this.addLog(`下载地址: ${pageUrl}`, 'info');
                    }
                }
            }
        },
        onVersionDblClick() {
            const info = this.status.upgradeInfo;
            if (info && info.canUpgrade) {
                this.handleUpgrade(info);
            } else {
                this.checkUpdate().then(() => {
                    const newInfo = this.status.upgradeInfo;
                    if (newInfo && newInfo.canUpgrade) {
                        this.handleUpgrade(newInfo);
                    }
                });
            }
        },
        handleUpgrade(info) {
            if (this.status.platform === 'linux') {
                if (confirm(`发现新版本，是否执行更新？\n${info.proxyUpdateInfo || ''}`)) {
                    this.doUpgrade();
                }
            } else {
                const pageUrl = info.proxyUpgradePageUrl;
                if (pageUrl) {
                    navigator.clipboard.writeText(pageUrl).then(() => {
                        alert(`发现新版本，下载链接已复制到剪切板！\n${pageUrl}`);
                    }).catch(() => {
                        alert(`发现新版本！\n下载地址: ${pageUrl}`);
                    });
                }
            }
        },
        async refreshStatus() {
            try {
                const response = await fetch('/status');
                const data = await response.json();
                
                this.status.connected = data.connected;
                this.status.machineId = data.machineId || '';
                this.status.version = data.version || '';
                this.status.platform = data.platform || '';
                this.status.upgradeInfo = data.upgradeInfo || null;
                this.status.deviceCount = data.deviceCount || 0;
                this.status.cacheSize = data.cacheSize;
                this.status.requestCount = data.requestCount || 0;
                this.status.uptime = data.uptime || 0;
                
                if (data.devices && data.devices.length > 0) {
                    this.devices = data.devices.map(device => ({
                        ...device,
                        connectedFor: Math.floor((Date.now() - device.connectedAt) / 1000),
                        lastSeenAgo: Math.floor((Date.now() - device.lastSeen) / 1000)
                    }));
                    if (data.devices.length !== this.lastDeviceCount) {
                        this.addLog(`已连接 ${data.devices.length} 台设备`, 'success');
                        this.lastDeviceCount = data.devices.length;
                    }
                } else {
                    if (this.lastDeviceCount > 0) {
                        this.addLog('所有设备已断开连接', 'warning');
                        this.lastDeviceCount = 0;
                    }
                    this.devices = [];
                }
                
                this.httpLogs = data.httpRequestLogs || [];
            } catch (error) {
                this.status.connected = false;
                this.addLog(`获取状态失败: ${error.message}`, 'error');
            }
        }
    },
    mounted() {
        const params = getUrlParams();
        this.showLogs = params.showLogs;
        this.showHttpLogs = params.showHttpLogs;
        
        this.addLog('管理面板已加载', 'success');
        this.refreshStatus();
        
        setInterval(() => {
            this.refreshStatus();
        }, 2000);
    }
}).mount('#app');
