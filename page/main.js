// ==================== 常量配置 ====================
const CONSTANTS = {
    ELECTRICITY: {
        MIN_VALUE: 0,
        MAX_VALUE: 1000,
        SUFFICIENT_THRESHOLD: 100,
        LOW_THRESHOLD: 10,
        MAX_DAILY_CONSUMPTION: 50
    },
    TIME: {
        TWO_WEEKS_MS: 14 * 24 * 60 * 60 * 1000,
        ONE_DAY_MS: 24 * 60 * 60 * 1000,
        CONTINUOUS_DAY_THRESHOLD: 1.5
    },
    CHART: {
        ANIMATION_DURATION: 1000,
        DEFAULT_ZOOM_DELTA: 10
    }
};

// ==================== 工具函数 ====================

// 验证工具函数
const ValidationUtils = {
    isValidNumber(value, min = -Infinity, max = Infinity) {
        return typeof value === 'number' &&
               !isNaN(value) &&
               isFinite(value) &&
               value >= min &&
               value <= max;
    },

    isValidArray(arr, minLength = 0) {
        return Array.isArray(arr) && arr.length >= minLength;
    },

    isValidTimeString(timeStr) {
        return typeof timeStr === 'string' &&
               /^\d{1,2}-\d{1,2}(\s+\d{1,2}:\d{1,2})?/.test(timeStr);
    },

    sanitizeElectricityValue(value) {
        if (!this.isValidNumber(value, CONSTANTS.ELECTRICITY.MIN_VALUE, CONSTANTS.ELECTRICITY.MAX_VALUE)) {
            console.warn(`无效的电量值: ${value}, 使用默认值 0`);
            return 0;
        }
        return Math.round(value * 100) / 100;
    }
};

// 数学运算安全工具
const MathUtils = {
    safeDivide(numerator, denominator, fallback = 0) {
        if (!ValidationUtils.isValidNumber(numerator) ||
            !ValidationUtils.isValidNumber(denominator) ||
            denominator === 0) {
            return fallback;
        }
        return numerator / denominator;
    },

    safeAverage(values, fallback = 0) {
        if (!ValidationUtils.isValidArray(values, 1)) return fallback;
        const validValues = values.filter(v => ValidationUtils.isValidNumber(v));
        if (validValues.length === 0) return fallback;
        const sum = validValues.reduce((acc, val) => acc + val, 0);
        return this.safeDivide(sum, validValues.length, fallback);
    },

    clamp(value, min, max) {
        if (!ValidationUtils.isValidNumber(value)) return min;
        return Math.max(min, Math.min(max, value));
    },

    safeMax(values, fallback = 0) {
        if (!ValidationUtils.isValidArray(values, 1)) return fallback;
        const validValues = values.filter(v => ValidationUtils.isValidNumber(v));
        if (validValues.length === 0) return fallback;
        return Math.max(...validValues);
    },

    safeMin(values, fallback = 0) {
        if (!ValidationUtils.isValidArray(values, 1)) return fallback;
        const validValues = values.filter(v => ValidationUtils.isValidNumber(v));
        if (validValues.length === 0) return fallback;
        return Math.min(...validValues);
    }
};

// 错误处理工具
const ErrorHandler = {
    handleDataLoadError(error, context = '数据加载') {
        console.error(`${context}错误:`, error);
        showToast(`${context}失败: ${error.message || '未知错误'}`, 'error');
    },

    handleChartError(error, chartName = '图表') {
        console.error(`${chartName}渲染错误:`, error);
        showToast(`${chartName}渲染失败`, 'error');
    },

    withErrorHandling(fn, context = '操作') {
        return async (...args) => {
            try {
                return await fn(...args);
            } catch (error) {
                this.handleDataLoadError(error, context);
                return null;
            }
        };
    }
};
// ==================== 主题系统 ====================
const themeToggle = document.getElementById('theme-toggle');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
let isDark = localStorage.getItem('theme') === 'dark' || (localStorage.getItem('theme') === null && prefersDark);

// 图表变量先声明
let chartLight = null;
let chartAc = null;

function setTheme(dark) {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem('theme', dark ? 'dark' : 'light');
    isDark = dark;
    if (chartLight && chartAc) {
        updateChartsTheme();
    }
}

setTheme(isDark);
themeToggle.addEventListener('click', () => {
    setTheme(!isDark);
    showToast(isDark ? '已切换到深色模式' : '已切换到浅色模式');
});

// ==================== Toast 通知 ====================
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast toast-${type} show`;
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// ==================== 图表初始化 ====================
chartLight = echarts.init(document.getElementById('chart-light'));
chartAc = echarts.init(document.getElementById('chart-ac'));
let currentChartType = 'area';
let rawData = [];

function getChartColors() {
    const style = getComputedStyle(document.documentElement);
    return {
        text: style.getPropertyValue('--text-primary').trim() || '#1e293b',
        textSecondary: style.getPropertyValue('--text-secondary').trim() || '#64748b',
        border: style.getPropertyValue('--border-color').trim() || '#e2e8f0',
        cardBg: style.getPropertyValue('--card-bg').trim() || '#ffffff',
        light: '#3b82f6',
        lightGradient: ['rgba(59, 130, 246, 0.4)', 'rgba(59, 130, 246, 0.05)'],
        ac: '#10b981',
        acGradient: ['rgba(16, 185, 129, 0.4)', 'rgba(16, 185, 129, 0.05)']
    };
}

function getChartOption(title, color, gradientColors, data, type = 'line') {
    const colors = getChartColors();

    const seriesConfig = {
        line: {
            type: 'line',
            smooth: true,
            symbol: 'circle',
            symbolSize: 6,
            lineStyle: { width: 3, color: color },
            itemStyle: { color: color, borderWidth: 2, borderColor: '#fff' },
            areaStyle: {
                color: {
                    type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                    colorStops: [
                        { offset: 0, color: gradientColors[0] },
                        { offset: 1, color: gradientColors[1] }
                    ]
                }
            }
        },
        bar: {
            type: 'bar',
            barWidth: '60%',
            itemStyle: {
                color: {
                    type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                    colorStops: [
                        { offset: 0, color: color },
                        { offset: 1, color: gradientColors[0] }
                    ]
                },
                borderRadius: [4, 4, 0, 0]
            }
        },
        area: {
            type: 'line',
            smooth: true,
            symbol: 'none',
            lineStyle: { width: 2, color: color },
            areaStyle: {
                color: {
                    type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                    colorStops: [
                        { offset: 0, color: gradientColors[0] },
                        { offset: 1, color: gradientColors[1] }
                    ]
                }
            }
        }
    };

    return {
        title: {
            show: false
        },
        tooltip: {
            trigger: 'axis',
            backgroundColor: colors.cardBg,
            borderColor: colors.border,
            borderWidth: 1,
            textStyle: { color: colors.text },
            formatter: params => {
                const date = new Date(params[0].value[0]);
                const timeStr = date.toLocaleString('zh-CN', {
                    month: '2-digit', day: '2-digit',
                    hour: '2-digit', minute: '2-digit'
                });
                return `<div style="font-weight:600">${timeStr}</div>
                        <div style="margin-top:4px">
                            <span style="display:inline-block;width:10px;height:10px;background:${color};border-radius:50%;margin-right:6px"></span>
                            ${params[0].value[1].toFixed(2)} kWh
                        </div>`;
            }
        },
        grid: {
            left: '3%', right: '4%', bottom: '15%', top: '8%',
            containLabel: true
        },
        xAxis: {
            type: 'time',
            axisLine: { lineStyle: { color: colors.border } },
            axisLabel: { color: colors.textSecondary, fontSize: 11 },
            splitLine: { show: false }
        },
        yAxis: {
            type: 'value',
            axisLine: { show: false },
            axisLabel: { color: colors.textSecondary },
            splitLine: { lineStyle: { color: colors.border, type: 'dashed' } }
        },
        series: [{
            name: title,
            data: data,
            ...seriesConfig[type]
        }],
        dataZoom: [
            {
                type: 'slider',
                xAxisIndex: 0,
                height: 24,
                bottom: 8,
                borderColor: 'transparent',
                backgroundColor: colors.border + '40',
                fillerColor: color + '30',
                handleStyle: { color: color },
                textStyle: { color: colors.textSecondary },
                brushSelect: false
            },
            { type: 'inside', xAxisIndex: 0 }
        ],
        animation: true,
        animationDuration: 1000,
        animationEasing: 'cubicOut'
    };
}

function updateChartsTheme() {
    if (rawData.length > 0) {
        renderCharts(rawData, currentChartType);
    }
}

// ==================== 数据处理 ====================
function interpolateMissingData(dataArray) {
    const processed = [...dataArray];
    ['light_Balance', 'ac_Balance'].forEach(field => {
        for (let i = 0; i < processed.length; i++) {
            if (processed[i][field] == null) {
                let prev = i - 1;
                while (prev >= 0 && processed[prev][field] == null) prev--;
                let next = i + 1;
                while (next < processed.length && processed[next][field] == null) next++;
                if (prev >= 0 && next < processed.length) {
                    const step = (processed[next][field] - processed[prev][field]) / (next - prev);
                    processed[i][field] = processed[prev][field] + step * (i - prev);
                } else if (prev >= 0) {
                    processed[i][field] = processed[prev][field];
                } else if (next < processed.length) {
                    processed[i][field] = processed[next][field];
                } else {
                    processed[i][field] = 0;
                }
            }
        }
    });
    return processed;
}

function getStatus(value) {
    if (value > CONSTANTS.ELECTRICITY.SUFFICIENT_THRESHOLD) return { text: '充足', class: 'status-good', percent: 100 };
    if (value > CONSTANTS.ELECTRICITY.LOW_THRESHOLD) return { text: '偏低', class: 'status-warning', percent: Math.min(value, 100) };
    return { text: '不足', class: 'status-danger', percent: value };
}

// 解析时间字符串，支持跨年 (格式: "MM-DD HH:mm")
function parseTimeString(timeStr) {
    try {
        // 验证输入
        if (!ValidationUtils.isValidTimeString(timeStr)) {
            console.warn(`无效的时间格式: ${timeStr}`);
            return new Date(); // 返回当前时间作为fallback
        }

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;

        // 解析月份
        const parts = timeStr.split('-');
        const month = parseInt(parts[0], 10);

        // 验证月份有效性
        if (month < 1 || month > 12) {
            console.warn(`无效的月份: ${month}`);
            return new Date();
        }

        // 如果数据月份大于当前月份，说明是去年的数据
        let year = currentYear;
        if (month > currentMonth) {
            year = currentYear - 1;
        }

        const dateStr = `${year}-${timeStr}`;
        const parsedDate = new Date(dateStr);

        // 验证解析结果
        if (isNaN(parsedDate.getTime())) {
            console.warn(`日期解析失败: ${dateStr}`);
            return new Date();
        }

        return parsedDate;
    } catch (error) {
        console.error('日期解析错误:', error.message);
        return new Date(); // fallback to current time
    }
}

function calculateStats(data) {
    // 数据验证
    if (!ValidationUtils.isValidArray(data, 2)) {
        console.warn('计算统计数据失败: 数据不足');
        return null;
    }

    try {
        const lightValues = data.map(d => d.light_Balance).filter(v => v != null);
        const acValues = data.map(d => d.ac_Balance).filter(v => v != null);

        const latest = data[data.length - 1];
        const latestTime = parseTimeString(latest.time);

        // 找到今日0点
        const todayStart = new Date(latestTime);
        todayStart.setHours(0, 0, 0, 0);

        // 查找今日0点或今日最早的记录
        let todayFirstRecord = null;
        for (let i = 0; i < data.length; i++) {
            const recordTime = parseTimeString(data[i].time);
            if (recordTime >= todayStart) {
                todayFirstRecord = data[i];
                break;
            }
        }

        // 使用今日最早记录或上一条记录
        const baseline = todayFirstRecord || (data.length > 1 ? data[data.length - 2] : latest);

        // 计算日均消耗 (取近两周的数据)
        const lastTime = parseTimeString(latest.time);
        const twoWeeksAgo = new Date(lastTime.getTime() - CONSTANTS.TIME.TWO_WEEKS_MS);

        // 筛选近两周的数据
        const recentData = data.filter(d => {
            try {
                const t = parseTimeString(d.time);
                return t >= twoWeeksAgo;
            } catch {
                return false;
            }
        });

        // 如果近两周数据不足，使用全部数据
        const calcData = recentData.length >= 2 ? recentData : data;
        const firstRecord = calcData[0];
        const lastRecord = calcData[calcData.length - 1];
        const firstTime = parseTimeString(firstRecord.time);
        const calcLastTime = parseTimeString(lastRecord.time);
        const daysDiff = Math.max(1, (calcLastTime.getTime() - firstTime.getTime()) / CONSTANTS.TIME.ONE_DAY_MS);

        // 累计实际消耗（只计算电量减少的部分，忽略充电）
        let lightTotalConsumption = 0;
        let acTotalConsumption = 0;
        for (let i = 1; i < calcData.length; i++) {
            const prevLight = ValidationUtils.sanitizeElectricityValue(calcData[i - 1].light_Balance || 0);
            const currLight = ValidationUtils.sanitizeElectricityValue(calcData[i].light_Balance || 0);
            const prevAc = ValidationUtils.sanitizeElectricityValue(calcData[i - 1].ac_Balance || 0);
            const currAc = ValidationUtils.sanitizeElectricityValue(calcData[i].ac_Balance || 0);
            // 只累计消耗（电量减少），忽略充电（电量增加）
            if (prevLight > currLight) lightTotalConsumption += (prevLight - currLight);
            if (prevAc > currAc) acTotalConsumption += (prevAc - currAc);
        }

        // 使用安全除法计算日均消耗
        const lightAvgDaily = MathUtils.safeDivide(lightTotalConsumption, daysDiff, 0).toFixed(1);
        const acAvgDaily = MathUtils.safeDivide(acTotalConsumption, daysDiff, 0).toFixed(1);

        // 预计可用天数 (分开计算，使用安全除法)
        const lightDaysLeft = parseFloat(lightAvgDaily) > 0
            ? Math.floor(MathUtils.safeDivide(latest.light_Balance || 0, parseFloat(lightAvgDaily), 0))
            : '∞';
        const acDaysLeft = parseFloat(acAvgDaily) > 0
            ? Math.floor(MathUtils.safeDivide(latest.ac_Balance || 0, parseFloat(acAvgDaily), 0))
            : '∞';

        // 计算今日已消耗（今日0点/最早记录 - 当前记录 = 消耗量，正值表示消耗）
        const lightTrend = ((baseline.light_Balance || 0) - (latest.light_Balance || 0)).toFixed(1);
        const acTrend = ((baseline.ac_Balance || 0) - (latest.ac_Balance || 0)).toFixed(1);

        // 计算昨日消耗
        // 找到昨日0点
        const yesterdayStart = new Date(todayStart);
        yesterdayStart.setDate(yesterdayStart.getDate() - 1);

        // 查找昨日0点后最早的记录(昨日开始)
        let yesterdayFirstRecord = null;
        for (let i = 0; i < data.length; i++) {
            const recordTime = parseTimeString(data[i].time);
            if (recordTime >= yesterdayStart && recordTime < todayStart) {
                yesterdayFirstRecord = data[i];
                break;
            }
        }

        // 昨日消耗 = 昨日开始记录(baseline) - 昨日结束记录(今日开始记录)
        // 如果找不到昨日记录,消耗为0
        let lightYesterdayTrend = 0;
        let acYesterdayTrend = 0;
        if (yesterdayFirstRecord && baseline) {
            lightYesterdayTrend = Math.max(0, (yesterdayFirstRecord.light_Balance || 0) - (baseline.light_Balance || 0));
            acYesterdayTrend = Math.max(0, (yesterdayFirstRecord.ac_Balance || 0) - (baseline.ac_Balance || 0));
            lightYesterdayTrend = lightYesterdayTrend.toFixed(1);
            acYesterdayTrend = acYesterdayTrend.toFixed(1);
        }

        return {
            lightTrend: lightTrend,
            acTrend: acTrend,
            lightYesterdayTrend: lightYesterdayTrend,
            acYesterdayTrend: acYesterdayTrend,
            maxLight: MathUtils.safeMax(lightValues, 0).toFixed(1),
            minLight: MathUtils.safeMin(lightValues, 0).toFixed(1),
            maxAc: MathUtils.safeMax(acValues, 0).toFixed(1),
            minAc: MathUtils.safeMin(acValues, 0).toFixed(1),
            lightAvgDaily: lightAvgDaily,
            acAvgDaily: acAvgDaily,
            lightDaysLeft: lightDaysLeft,
            acDaysLeft: acDaysLeft,
            lastUpdate: latest.time,
            yesterdayTotalConsumption: (parseFloat(lightYesterdayTrend) + parseFloat(acYesterdayTrend)).toFixed(1)
        };
    } catch (error) {
        console.error('统计计算错误:', error);
        return null;
    }
}

function updateUI(data) {
    if (data.length === 0) return;

    const latest = data[data.length - 1];
    const lightValue = latest.light_Balance || 0;
    const acValue = latest.ac_Balance || 0;

    // 更新主卡片
    document.getElementById('light-value').textContent = lightValue.toFixed(1);
    document.getElementById('ac-value').textContent = acValue.toFixed(1);

    const lightStatus = getStatus(lightValue);
    const acStatus = getStatus(acValue);

    document.getElementById('light-status').textContent = lightStatus.text;
    document.getElementById('light-status').className = `stat-status ${lightStatus.class}`;
    document.getElementById('light-progress').style.width = `${lightStatus.percent}%`;

    document.getElementById('ac-status').textContent = acStatus.text;
    document.getElementById('ac-status').className = `stat-status ${acStatus.class}`;
    document.getElementById('ac-progress').style.width = `${acStatus.percent}%`;

    // 更新统计数据
    const stats = calculateStats(data);
    if (stats) {
        // 更新昨日消耗
        const lightYesterdayTrendEl = document.getElementById('light-yesterday-trend');
        const acYesterdayTrendEl = document.getElementById('ac-yesterday-trend');

        lightYesterdayTrendEl.querySelector('.trend-value').textContent =
            (stats.lightYesterdayTrend >= 0 ? '-' : '+') + Math.abs(stats.lightYesterdayTrend);
        lightYesterdayTrendEl.className = `stat-trend ${parseFloat(stats.lightYesterdayTrend) > 0 ? 'trend-down' : (parseFloat(stats.lightYesterdayTrend) < 0 ? 'trend-up' : '')}`;

        acYesterdayTrendEl.querySelector('.trend-value').textContent =
            (stats.acYesterdayTrend >= 0 ? '-' : '+') + Math.abs(stats.acYesterdayTrend);
        acYesterdayTrendEl.className = `stat-trend ${parseFloat(stats.acYesterdayTrend) > 0 ? 'trend-down' : (parseFloat(stats.acYesterdayTrend) < 0 ? 'trend-up' : '')}`;

        // 更新今日消耗
        const lightTrendEl = document.getElementById('light-trend');
        const acTrendEl = document.getElementById('ac-trend');

        lightTrendEl.querySelector('.trend-value').textContent =
            (stats.lightTrend >= 0 ? '-' : '+') + Math.abs(stats.lightTrend);
        lightTrendEl.className = `stat-trend ${parseFloat(stats.lightTrend) > 0 ? 'trend-down' : (parseFloat(stats.lightTrend) < 0 ? 'trend-up' : '')}`;

        acTrendEl.querySelector('.trend-value').textContent =
            (stats.acTrend >= 0 ? '-' : '+') + Math.abs(stats.acTrend);
        acTrendEl.className = `stat-trend ${parseFloat(stats.acTrend) > 0 ? 'trend-down' : (parseFloat(stats.acTrend) < 0 ? 'trend-up' : '')}`;

        document.getElementById('max-light').textContent = stats.maxLight;
        document.getElementById('min-light').textContent = stats.minLight;
        document.getElementById('max-ac').textContent = stats.maxAc;
        document.getElementById('min-ac').textContent = stats.minAc;
        document.getElementById('light-avg-daily').textContent = stats.lightAvgDaily;
        document.getElementById('ac-avg-daily').textContent = stats.acAvgDaily;
        document.getElementById('light-days-left').textContent = stats.lightDaysLeft + '天';
        document.getElementById('ac-days-left').textContent = stats.acDaysLeft + '天';
        document.getElementById('total-consumption').textContent = stats.yesterdayTotalConsumption + ' 度';
        document.getElementById('last-update').textContent = stats.lastUpdate;
    }
}

function renderCharts(data, type = 'line') {
    const colors = getChartColors();

    const processedData = data.map(e => ({
        ...e,
        timestamp: parseTimeString(e.time).getTime()
    })).sort((a, b) => a.timestamp - b.timestamp);

    const lightData = processedData.map(e => [e.timestamp, e.light_Balance]);
    const acData = processedData.map(e => [e.timestamp, e.ac_Balance]);

    chartLight.setOption(getChartOption('照明电量', colors.light, colors.lightGradient, lightData, type));
    chartAc.setOption(getChartOption('空调电量', colors.ac, colors.acGradient, acData, type));
}

// ==================== 数据加载 ====================
async function fetchData(filepath) {
    const response = await fetch(filepath);
    return response.json();
}

async function loadData() {
    try {
        const sel = document.getElementById('timeSplit').value;
        const data = await fetchData(`./data/${sel}.json`);
        rawData = interpolateMissingData(data);
        updateUI(rawData);
        renderCharts(rawData, currentChartType);
        showToast('数据加载成功', 'success');
    } catch (err) {
        console.error('加载错误:', err);
        showToast('数据加载失败', 'error');
    }
}

// ==================== 事件绑定 ====================
document.getElementById('timeSplit').addEventListener('change', loadData);
document.getElementById('refresh-btn').addEventListener('click', () => {
    document.getElementById('refresh-btn').classList.add('spinning');
    loadData().finally(() => {
        setTimeout(() => {
            document.getElementById('refresh-btn').classList.remove('spinning');
        }, 500);
    });
});

// 图表类型切换
document.querySelectorAll('.btn-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.btn-toggle').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentChartType = btn.dataset.type;
        if (rawData.length > 0) {
            renderCharts(rawData, currentChartType);
        }
    });
});

// 图表缩放控制
document.querySelectorAll('[data-zoom]').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const action = e.target.dataset.zoom;
        const chart = e.target.closest('.chart-container').querySelector('.chart');
        const chartInstance = chart.id === 'chart-light' ? chartLight : chartAc;

        if (action === 'reset') {
            chartInstance.dispatchAction({ type: 'dataZoom', start: 0, end: 100 });
        } else {
            const option = chartInstance.getOption();
            const zoom = option.dataZoom[0];
            const range = zoom.end - zoom.start;
            const delta = action === 'in' ? -CONSTANTS.CHART.DEFAULT_ZOOM_DELTA : CONSTANTS.CHART.DEFAULT_ZOOM_DELTA;
            const newStart = Math.max(0, zoom.start - delta / 2);
            const newEnd = Math.min(100, zoom.end + delta / 2);
            chartInstance.dispatchAction({ type: 'dataZoom', start: newStart, end: newEnd });
        }
    });
});

// 响应式
window.addEventListener('resize', () => {
    chartLight.resize();
    chartAc.resize();
});

// ==================== 初始化 ====================
fetchData('./data/time.json').then(timeData => {
    const sel = document.getElementById('timeSplit');
    timeData.forEach(v => {
        const opt = document.createElement('option');
        opt.value = v;
        opt.text = v;
        sel.add(opt);
    });
    loadData();
}).catch(() => {
    loadData();
});

// ==================== 年度总结功能 ====================
const reportModal = document.getElementById('report-modal');
const reportBtn = document.getElementById('report-btn');
const modalClose = document.getElementById('modal-close');
const modalOverlay = document.querySelector('.modal-overlay');
const exportBtn = document.getElementById('export-btn');
const yearSelect = document.getElementById('report-year-select');

let chartDaily = null;
let chartMonthly = null;
let chartHeatmap = null;
let yearlyData = {};
let availableYears = [];

// 打开模态框
reportBtn.addEventListener('click', async () => {
    reportModal.classList.add('show');
    document.body.style.overflow = 'hidden';
    await initYearSelect();
});

// 关闭模态框
function closeModal() {
    reportModal.classList.remove('show');
    document.body.style.overflow = '';
}

modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', closeModal);

// 年份选择变化
yearSelect.addEventListener('change', async () => {
    await loadYearlyReport(parseInt(yearSelect.value));
});

// 初始化年份选择器
async function initYearSelect() {
    try {
        const timeList = await fetchData('./data/time.json');

        // 提取所有年份
        const years = [...new Set(timeList.map(m => m.split('-')[0]))].sort().reverse();
        availableYears = years;

        // 填充年份选择器
        yearSelect.innerHTML = '';
        years.forEach(year => {
            const opt = document.createElement('option');
            opt.value = year;
            opt.text = year;
            yearSelect.add(opt);
        });

        // 加载当前选中年份的数据
        if (years.length > 0) {
            await loadYearlyReport(parseInt(years[0]));
        }
    } catch (err) {
        console.error('初始化年份选择失败:', err);
        showToast('加载失败', 'error');
    }
}

// 加载年度报告数据
async function loadYearlyReport(year) {
    try {
        showToast('正在加载年度数据...', 'info');

        // 获取时间列表
        const timeList = await fetchData('./data/time.json');

        // 筛选指定年份的月份文件
        const yearMonths = timeList.filter(m => m.startsWith(year.toString()));

        if (yearMonths.length === 0) {
            showToast('暂无该年数据', 'error');
            return;
        }

        // 加载所有月份数据
        const allData = [];
        for (const month of yearMonths) {
            try {
                const monthData = await fetchData(`./data/${month}.json`);
                allData.push(...monthData.map(d => ({ ...d, month })));
            } catch (e) {
                console.warn(`加载 ${month} 数据失败`);
            }
        }

        if (allData.length === 0) {
            showToast('暂无数据', 'error');
            return;
        }

        // 计算年度统计
        calculateYearlyStats(allData, year);

        // 渲染图表
        renderDailyChart(allData, year);
        renderMonthlyChart(allData, year);
        renderHeatmapChart(allData, year);

        // 确保图表正确 resize (模态框可能影响尺寸计算)
        setTimeout(() => {
            if (chartDaily) chartDaily.resize();
            if (chartMonthly) chartMonthly.resize();
            if (chartHeatmap) chartHeatmap.resize();
        }, 100);

        showToast('年度报告加载完成', 'success');
    } catch (err) {
        console.error('加载年度报告失败:', err);
        showToast('加载失败', 'error');
    }
}

// 计算年度统计数据
function calculateYearlyStats(data, year) {
    // 按日期分组计算每日消耗
    const dailyConsumption = {};

    // 解析日期字符串，返回 YYYY-MM-DD 格式
    function parseDateStr(record) {
        // record.time 可能的格式: "MM-DD HH:mm" 或 "MM-DD-HH"
        // record.month 格式: "YYYY-MM"
        const yearPart = record.month.split('-')[0]; // "2025"
        const timePart = record.time.split(' ')[0]; // 取空格前的部分

        // 检查 timePart 是否包含多个连字符 (如 "05-05-23")
        const parts = timePart.split('-');
        if (parts.length >= 2) {
            // 取前两部分作为 MM-DD
            const month = parts[0].padStart(2, '0');
            const day = parts[1].padStart(2, '0');
            return `${yearPart}-${month}-${day}`;
        }
        return `${yearPart}-${timePart}`;
    }

    // 解析完整时间戳用于排序
    function parseTimestamp(record) {
        const yearPart = record.month.split('-')[0];
        const timePart = record.time;
        // 尝试解析 "MM-DD HH:mm" 格式
        const parts = timePart.split(' ');
        const datePart = parts[0].split('-');
        const month = datePart[0].padStart(2, '0');
        const day = datePart[1].padStart(2, '0');
        const time = parts[1] || '00:00';
        return new Date(`${yearPart}-${month}-${day}T${time}`);
    }

    // 按日期分组所有记录
    const recordsByDate = {};
    data.forEach(record => {
        const dateStr = parseDateStr(record);
        if (!recordsByDate[dateStr]) {
            recordsByDate[dateStr] = [];
        }
        recordsByDate[dateStr].push(record);
    });

    // 对每个日期，计算当日的消耗
    const sortedDates = Object.keys(recordsByDate)
        .filter(dateStr => dateStr.startsWith(year.toString()))
        .sort();

    sortedDates.forEach((dateStr, index) => {
        const dayRecords = recordsByDate[dateStr].sort((a, b) => parseTimestamp(a) - parseTimestamp(b));

        if (dayRecords.length > 0) {
            const firstRecord = dayRecords[0];
            const lastRecord = dayRecords[dayRecords.length - 1];

            // 获取下一天的第一条记录
            let nextDayFirstRecord = null;
            if (index < sortedDates.length - 1) {
                const nextDateStr = sortedDates[index + 1];
                const nextDayRecords = recordsByDate[nextDateStr];
                if (nextDayRecords && nextDayRecords.length > 0) {
                    nextDayFirstRecord = nextDayRecords.sort((a, b) => parseTimestamp(a) - parseTimestamp(b))[0];
                }
            }

            let lightConsumption = 0;
            let acConsumption = 0;

            if (nextDayFirstRecord) {
                // 检查下一日是否为连续日期（修复102度异常值问题）
                const currentDate = new Date(dateStr);
                const nextDate = new Date(sortedDates[index + 1]);
                const dayDiff = (nextDate - currentDate) / CONSTANTS.TIME.ONE_DAY_MS;

                if (dayDiff <= CONSTANTS.TIME.CONTINUOUS_DAY_THRESHOLD) { // 连续日期
                    // 历史日期：当日消耗 = 当日第一条记录 - 下一日第一条记录
                    lightConsumption = Math.max(0, (firstRecord.light_Balance || 0) - (nextDayFirstRecord.light_Balance || 0));
                    acConsumption = Math.max(0, (firstRecord.ac_Balance || 0) - (nextDayFirstRecord.ac_Balance || 0));
                } else {
                    // 非连续日期，使用当日首尾差值（避免跨日期间隔异常值）
                    console.warn(`检测到非连续日期: ${dateStr} -> ${sortedDates[index + 1]}, 间隔${dayDiff.toFixed(1)}天，使用当日首尾差值`);
                    if (dayRecords.length >= 2) {
                        lightConsumption = Math.max(0, (firstRecord.light_Balance || 0) - (lastRecord.light_Balance || 0));
                        acConsumption = Math.max(0, (firstRecord.ac_Balance || 0) - (lastRecord.ac_Balance || 0));
                    }
                }
            } else {
                // 今日或最后一天：当日消耗 = 当日第一条记录 - 当日最后一条记录
                if (dayRecords.length >= 2) {
                    lightConsumption = Math.max(0, (firstRecord.light_Balance || 0) - (lastRecord.light_Balance || 0));
                    acConsumption = Math.max(0, (firstRecord.ac_Balance || 0) - (lastRecord.ac_Balance || 0));
                }
                // 如果只有一条记录，消耗为0（已经是默认值）
            }

            dailyConsumption[dateStr] = {
                light: lightConsumption,
                ac: acConsumption
            };
        }
    });

    // 先计算总消耗（只使用实际数据，不包括插值数据）
    let totalLight = 0, totalAc = 0;
    let peakDay = '', peakValue = 0;

    Object.entries(dailyConsumption).forEach(([date, consumption]) => {
        totalLight += consumption.light;
        totalAc += consumption.ac;

        const dayTotal = consumption.light + consumption.ac;
        if (dayTotal > peakValue) {
            peakValue = dayTotal;
            peakDay = date;
        }
    });

    // 填充缺失日期的数据（使用余额插值，避免消耗量异常）
    const existingDates = Object.keys(dailyConsumption).sort();

    if (existingDates.length > 1) {
        const firstDate = existingDates[0];
        const lastDate = existingDates[existingDates.length - 1];

        // 只在第一个数据日期和最后一个数据日期之间填充
        const startDate = new Date(firstDate);
        const endDate = new Date(lastDate);

        // 生成需要填充的日期范围
        const allDatesInRange = [];
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            allDatesInRange.push(d.toISOString().split('T')[0]);
        }

        // 对于缺失的日期，使用简单的平均消耗量填充
        // 计算现有数据的平均消耗量
        const existingConsumptions = Object.values(dailyConsumption);
        const avgLightConsumption = existingConsumptions.length > 0 ?
            existingConsumptions.reduce((sum, d) => sum + d.light, 0) / existingConsumptions.length : 0;
        const avgAcConsumption = existingConsumptions.length > 0 ?
            existingConsumptions.reduce((sum, d) => sum + d.ac, 0) / existingConsumptions.length : 0;

        // 填充缺失的日期（使用平均消耗量，避免异常值）
        allDatesInRange.forEach(dateStr => {
            if (!dailyConsumption[dateStr]) {
                // 寻找最近的前后数据点
                let prevData = null;
                let nextData = null;

                // 向前查找最近的数据
                for (let i = existingDates.length - 1; i >= 0; i--) {
                    if (existingDates[i] < dateStr) {
                        prevData = dailyConsumption[existingDates[i]];
                        break;
                    }
                }

                // 向后查找最近的数据
                for (let i = 0; i < existingDates.length; i++) {
                    if (existingDates[i] > dateStr) {
                        nextData = dailyConsumption[existingDates[i]];
                        break;
                    }
                }

                let lightValue = 0;
                let acValue = 0;

                if (prevData && nextData) {
                    // 使用前后数据的平均值，但限制在合理范围内
                    lightValue = Math.min((prevData.light + nextData.light) / 2, avgLightConsumption * 2);
                    acValue = Math.min((prevData.ac + nextData.ac) / 2, avgAcConsumption * 2);
                } else if (prevData) {
                    // 只有前面的数据，使用该数据但限制范围
                    lightValue = Math.min(prevData.light, avgLightConsumption * 2);
                    acValue = Math.min(prevData.ac, avgAcConsumption * 2);
                } else if (nextData) {
                    // 只有后面的数据，使用该数据但限制范围
                    lightValue = Math.min(nextData.light, avgLightConsumption * 2);
                    acValue = Math.min(nextData.ac, avgAcConsumption * 2);
                } else {
                    // 使用平均消耗量
                    lightValue = avgLightConsumption;
                    acValue = avgAcConsumption;
                }

                // 确保消耗量在合理范围内
                lightValue = MathUtils.clamp(lightValue, 0, CONSTANTS.ELECTRICITY.MAX_DAILY_CONSUMPTION);
                acValue = MathUtils.clamp(acValue, 0, CONSTANTS.ELECTRICITY.MAX_DAILY_CONSUMPTION);

                dailyConsumption[dateStr] = {
                    light: lightValue,
                    ac: acValue
                };
            }
        });
    }

    // 计算占比（使用实际总消耗）
    const total = totalLight + totalAc;
    const lightPercent = total > 0 ? ((totalLight / total) * 100).toFixed(1) : 0;
    const acPercent = total > 0 ? ((totalAc / total) * 100).toFixed(1) : 0;

    // 更新 UI
    document.getElementById('report-total').textContent = total.toFixed(2) + ' 度';
    document.getElementById('report-light-total').textContent = totalLight.toFixed(2) + ' 度';
    document.getElementById('report-light-percent').textContent = `占比 ${lightPercent}%`;
    document.getElementById('report-ac-total').textContent = totalAc.toFixed(2) + ' 度';
    document.getElementById('report-ac-percent').textContent = `占比 ${acPercent}%`;
    document.getElementById('report-peak').textContent = peakValue.toFixed(2) + ' 度';
    document.getElementById('report-peak-date').textContent = peakDay;

    // 数据范围
    const dates = Object.keys(dailyConsumption).sort();
    if (dates.length > 0) {
        document.getElementById('report-date-range').textContent =
            `数据范围：${dates[0]} 至 ${dates[dates.length - 1]}`;
    }

    yearlyData = { dailyConsumption, totalLight, totalAc };
}

// 渲染每日用电图表
function renderDailyChart(data, year) {
    if (!chartDaily) {
        chartDaily = echarts.init(document.getElementById('chart-daily'));
    }

    const colors = getChartColors();
    const dailyData = yearlyData.dailyConsumption;

    const dates = Object.keys(dailyData).sort();
    const lightData = dates.map(d => [d, dailyData[d].light.toFixed(2)]);
    const acData = dates.map(d => [d, dailyData[d].ac.toFixed(2)]);

    const option = {
        tooltip: {
            trigger: 'axis',
            backgroundColor: colors.cardBg,
            borderColor: colors.border,
            textStyle: { color: colors.text }
        },
        legend: {
            data: ['照明', '空调'],
            textStyle: { color: colors.textSecondary },
            top: 0
        },
        grid: {
            left: '3%', right: '4%', bottom: '15%', top: '12%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: dates,
            axisLine: { lineStyle: { color: colors.border } },
            axisLabel: {
                color: colors.textSecondary,
                fontSize: 10,
                rotate: 45,
                formatter: v => v.substring(5)
            }
        },
        yAxis: {
            type: 'value',
            name: '用量 (度)',
            axisLine: { show: false },
            axisLabel: { color: colors.textSecondary },
            splitLine: { lineStyle: { color: colors.border, type: 'dashed' } }
        },
        series: [
            {
                name: '照明',
                type: 'line',
                smooth: true,
                symbol: 'none',
                data: lightData.map(d => d[1]),
                lineStyle: { color: '#3b82f6', width: 2 },
                areaStyle: {
                    color: {
                        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [
                            { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
                            { offset: 1, color: 'rgba(59, 130, 246, 0.05)' }
                        ]
                    }
                }
            },
            {
                name: '空调',
                type: 'line',
                smooth: true,
                symbol: 'none',
                data: acData.map(d => d[1]),
                lineStyle: { color: '#ef4444', width: 2 },
                areaStyle: {
                    color: {
                        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [
                            { offset: 0, color: 'rgba(239, 68, 68, 0.3)' },
                            { offset: 1, color: 'rgba(239, 68, 68, 0.05)' }
                        ]
                    }
                }
            }
        ],
        dataZoom: [
            { type: 'slider', height: 20, bottom: 5 },
            { type: 'inside' }
        ]
    };

    chartDaily.setOption(option);
}

// 渲染月度统计图表
function renderMonthlyChart(data, year) {
    if (!chartMonthly) {
        chartMonthly = echarts.init(document.getElementById('chart-monthly'));
    }

    const colors = getChartColors();
    const dailyData = yearlyData.dailyConsumption;

    // 按月汇总
    const monthlyStats = {};
    Object.entries(dailyData).forEach(([date, consumption]) => {
        const month = date.substring(0, 7);
        if (!monthlyStats[month]) {
            monthlyStats[month] = { light: 0, ac: 0 };
        }
        monthlyStats[month].light += consumption.light;
        monthlyStats[month].ac += consumption.ac;
    });

    const months = Object.keys(monthlyStats).sort();
    const lightData = months.map(m => monthlyStats[m].light.toFixed(1));
    const acData = months.map(m => monthlyStats[m].ac.toFixed(1));

    const option = {
        tooltip: {
            trigger: 'axis',
            backgroundColor: colors.cardBg,
            borderColor: colors.border,
            textStyle: { color: colors.text },
            formatter: params => {
                let result = `<div style="font-weight:600">${params[0].name}</div>`;
                params.forEach(p => {
                    result += `<div>${p.marker} ${p.seriesName}: ${p.value} 度</div>`;
                });
                const total = params.reduce((sum, p) => sum + parseFloat(p.value), 0);
                result += `<div style="margin-top:4px;font-weight:600">合计: ${total.toFixed(1)} 度</div>`;
                return result;
            }
        },
        legend: {
            data: ['照明', '空调'],
            textStyle: { color: colors.textSecondary },
            top: 0
        },
        grid: {
            left: '3%', right: '4%', bottom: '8%', top: '15%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: months.map(m => m.substring(5) + '月'),
            axisLine: { lineStyle: { color: colors.border } },
            axisLabel: { color: colors.textSecondary }
        },
        yAxis: {
            type: 'value',
            name: '用电量 (度)',
            axisLine: { show: false },
            axisLabel: { color: colors.textSecondary },
            splitLine: { lineStyle: { color: colors.border, type: 'dashed' } }
        },
        series: [
            {
                name: '照明',
                type: 'bar',
                stack: 'total',
                data: lightData,
                itemStyle: {
                    color: '#3b82f6',
                    borderRadius: [0, 0, 0, 0]
                }
            },
            {
                name: '空调',
                type: 'bar',
                stack: 'total',
                data: acData,
                itemStyle: {
                    color: '#ef4444',
                    borderRadius: [4, 4, 0, 0]
                }
            }
        ]
    };

    chartMonthly.setOption(option);
}

// 渲染热力图
function renderHeatmapChart(data, year) {
    if (!chartHeatmap) {
        chartHeatmap = echarts.init(document.getElementById('chart-heatmap'));
    }

    const colors = getChartColors();
    const dailyData = yearlyData.dailyConsumption;

    // 检查是否有数据
    if (!dailyData || Object.keys(dailyData).length === 0) {
        console.warn('热力图: 无数据');
        return;
    }

    // 转换为热力图数据格式 (ECharts calendar 需要 YYYY-MM-DD 格式和数字类型)
    const heatmapData = [];
    let maxValue = 0;
    Object.entries(dailyData).forEach(([date, consumption]) => {
        const total = consumption.light + consumption.ac;
        const value = parseFloat(total.toFixed(2));
        // 确保日期格式正确 (YYYY-MM-DD) 且值为数字
        heatmapData.push([date, value]);
        if (value > maxValue) maxValue = value;
    });

    // 动态计算 visualMap 的最大值
    const visualMapMax = Math.max(10, Math.ceil(maxValue / 10) * 10);

    const option = {
        tooltip: {
            formatter: params => {
                return `${params.value[0]}<br/>用电量: ${params.value[1]} 度`;
            }
        },
        calendar: {
            top: 120,
            left: 40,
            right: 40,
            cellSize: ['auto', 20],
            range: year.toString(),
            itemStyle: {
                borderWidth: 2,
                borderColor: colors.cardBg
            },
            yearLabel: { show: false },
            dayLabel: {
                color: colors.textSecondary,
                nameMap: 'ZH'
            },
            monthLabel: {
                color: colors.textSecondary,
                nameMap: 'ZH'
            },
            splitLine: {
                lineStyle: { color: colors.border }
            }
        },
        visualMap: {
            min: 0,
            max: visualMapMax,
            calculable: true,
            orient: 'horizontal',
            left: 'center',
            top: 0,
            inRange: {
                color: ['#e8f5e9', '#c8e6c9', '#a5d6a7', '#81c784', '#66bb6a', '#4caf50', '#43a047', '#388e3c', '#2e7d32', '#1b5e20']
            },
            textStyle: { color: colors.textSecondary }
        },
        series: [{
            type: 'heatmap',
            coordinateSystem: 'calendar',
            data: heatmapData
        }]
    };

    chartHeatmap.setOption(option);
}

// 导出图片功能
exportBtn.addEventListener('click', async () => {
    showToast('正在生成图片...', 'info');

    try {
        // 动态加载 modern-screenshot
        if (typeof modernScreenshot === 'undefined') {
            await loadScript('https://cdn.jsdelivr.net/npm/modern-screenshot@4.6.7/dist/index.js');
        }

        const reportContent = document.getElementById('report-content');
        const yearSelect = document.getElementById('report-year-select');

        // 临时隐藏关闭按钮和导出按钮
        const closeBtn = document.getElementById('modal-close');
        const exportBtnEl = document.getElementById('export-btn');
        closeBtn.style.display = 'none';
        exportBtnEl.style.display = 'none';

        // 临时替换整个标题，避免select元素渲染问题
        const titleElement = document.querySelector('.report-header h2');
        const originalTitle = titleElement.innerHTML;
        const currentYear = yearSelect.value;

        // 直接设置为纯文本标题
        titleElement.innerHTML = `⚡ ${currentYear} 宿舍用电年度总结`;

        // 使用 modern-screenshot 生成图片
        const dataUrl = await modernScreenshot.domToPng(reportContent, {
            scale: 2,
            backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--bg-primary').trim(),
            style: {
                transform: 'scale(1)',
                transformOrigin: 'top left'
            },
            filter: (node) => {
                return !node.classList || (!node.classList.contains('modal-close') && !node.classList.contains('btn-export'));
            }
        });

        // 恢复原始标题
        titleElement.innerHTML = originalTitle;

        // 恢复按钮
        closeBtn.style.display = '';
        exportBtnEl.style.display = '';

        // 下载图片
        const link = document.createElement('a');
        link.download = `电量年度总结_${currentYear}.png`;
        link.href = dataUrl;
        link.click();

        showToast('图片已保存', 'success');
    } catch (err) {
        console.error('导出失败:', err);
        showToast('导出失败', 'error');
    }
});

// 动态加载脚本
function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// 窗口大小变化时调整图表
window.addEventListener('resize', () => {
    chartLight.resize();
    chartAc.resize();
    if (chartDaily) chartDaily.resize();
    if (chartMonthly) chartMonthly.resize();
    if (chartHeatmap) chartHeatmap.resize();
});

// ==================== 房间查询器功能 ====================

// 房间查询器事件绑定
document.addEventListener('DOMContentLoaded', function() {
    // 绑定房间查询按钮
    const roomFinderBtn = document.getElementById('room-query-btn');
    const roomQueryModal = document.getElementById('room-query-modal');
    const roomModalClose = document.getElementById('room-modal-close');

    if (roomFinderBtn && roomQueryModal) {
        roomFinderBtn.addEventListener('click', () => {
            roomQueryModal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        });
    }

    if (roomModalClose && roomQueryModal) {
        roomModalClose.addEventListener('click', () => {
            roomQueryModal.style.display = 'none';
            document.body.style.overflow = '';
        });
    }

    // 点击模态框背景关闭
    if (roomQueryModal) {
        roomQueryModal.addEventListener('click', (e) => {
            if (e.target === roomQueryModal) {
                roomQueryModal.style.display = 'none';
                document.body.style.overflow = '';
            }
        });
    }

    // 房间查询器功能
    const areaSelect = document.getElementById('area-select');
    const buildingSelect = document.getElementById('building-select');
    const unitSelect = document.getElementById('unit-select');
    const roomSelect = document.getElementById('room-select');
    const lightRoomResult = document.getElementById('light-room-result');
    const acRoomResult = document.getElementById('ac-room-result');
    const copyLightBtn = document.getElementById('copy-light-btn');
    const copyAcBtn = document.getElementById('copy-ac-btn');

    let currentLightRoomId = '';
    let currentAcRoomId = '';

    // 区域选择变化
    if (areaSelect) {
        areaSelect.addEventListener('change', function() {
            const areaId = this.value;

            // 重置后续选择器
            buildingSelect.innerHTML = '<option value="">请选择建筑</option>';
            unitSelect.innerHTML = '<option value="">请选择单元</option>';
            roomSelect.innerHTML = '<option value="">请选择房间</option>';
            buildingSelect.disabled = !areaId;
            unitSelect.disabled = true;
            roomSelect.disabled = true;

            // 清空结果
            clearResults();

            if (areaId && window.roomData && window.roomData[areaId]) {
                const buildings = window.roomData[areaId].buildings;
                // 对建筑名称按柳荷菊松顺序，然后按数字排序
                const sortedBuildingNames = Object.keys(buildings).sort((a, b) => {
                    // 定义园区优先级：柳荷菊松
                    const gardenOrder = ['柳园', '荷园', '菊园', '松园'];

                    // 提取园区名称
                    const gardenA = gardenOrder.find(garden => a.startsWith(garden)) || '';
                    const gardenB = gardenOrder.find(garden => b.startsWith(garden)) || '';

                    // 先按园区排序
                    const gardenIndexA = gardenOrder.indexOf(gardenA);
                    const gardenIndexB = gardenOrder.indexOf(gardenB);

                    if (gardenIndexA !== gardenIndexB) {
                        return gardenIndexA - gardenIndexB;
                    }

                    // 同一园区内按数字排序
                    const matchA = a.match(/\d+/);
                    const matchB = b.match(/\d+/);
                    const numA = matchA ? parseInt(matchA[0]) : 0;
                    const numB = matchB ? parseInt(matchB[0]) : 0;
                    if (numA !== numB) return numA - numB;

                    // 如果数字相同，按字符串排序
                    return a.localeCompare(b);
                });

                sortedBuildingNames.forEach(buildingName => {
                    const option = document.createElement('option');
                    option.value = buildingName;
                    option.textContent = buildingName;
                    buildingSelect.appendChild(option);
                });
            }
        });
    }

    // 建筑选择变化
    if (buildingSelect) {
        buildingSelect.addEventListener('change', function() {
            const areaId = areaSelect.value;
            const buildingName = this.value;

            // 重置后续选择器
            unitSelect.innerHTML = '<option value="">请选择单元</option>';
            roomSelect.innerHTML = '<option value="">请选择房间</option>';
            unitSelect.disabled = !buildingName;
            roomSelect.disabled = true;

            // 清空结果
            clearResults();

            if (areaId && buildingName && window.roomData && window.roomData[areaId].buildings[buildingName]) {
                const units = window.roomData[areaId].buildings[buildingName].units;
                // 对单元名称进行数字排序
                const sortedUnitNames = Object.keys(units).sort((a, b) => {
                    // 提取数字进行比较
                    const matchA = a.match(/\d+/);
                    const matchB = b.match(/\d+/);
                    const numA = matchA ? parseInt(matchA[0]) : 0;
                    const numB = matchB ? parseInt(matchB[0]) : 0;
                    if (numA !== numB) return numA - numB;
                    // 如果数字相同，按字符串排序
                    return a.localeCompare(b);
                });

                sortedUnitNames.forEach(unitName => {
                    const option = document.createElement('option');
                    option.value = unitName;
                    option.textContent = unitName;
                    unitSelect.appendChild(option);
                });
            }
        });
    }

    // 单元选择变化
    if (unitSelect) {
        unitSelect.addEventListener('change', function() {
            const areaId = areaSelect.value;
            const buildingName = buildingSelect.value;
            const unitName = this.value;

            // 重置房间选择器
            roomSelect.innerHTML = '<option value="">请选择房间</option>';
            roomSelect.disabled = !unitName;

            // 清空结果
            clearResults();

            if (areaId && buildingName && unitName && window.roomData) {
                const unit = window.roomData[areaId].buildings[buildingName].units[unitName];
                if (unit && unit.rooms) {
                    // 对房间号进行数字排序
                    const sortedRooms = unit.rooms.slice().sort((a, b) => {
                        // 提取数字进行比较
                        const matchA = a.match(/\d+/);
                        const matchB = b.match(/\d+/);
                        const numA = matchA ? parseInt(matchA[0]) : 0;
                        const numB = matchB ? parseInt(matchB[0]) : 0;
                        if (numA !== numB) return numA - numB;
                        // 如果数字相同，按字符串排序
                        return a.localeCompare(b);
                    });

                    sortedRooms.forEach(room => {
                        const option = document.createElement('option');
                        option.value = room;
                        option.textContent = room;
                        roomSelect.appendChild(option);
                    });
                }
            }
        });
    }

    // 房间选择变化
    if (roomSelect) {
        roomSelect.addEventListener('change', function() {
            const areaId = areaSelect.value;
            const buildingName = buildingSelect.value;
            const unitName = unitSelect.value;
            const roomNumber = this.value;

            if (areaId && buildingName && unitName && roomNumber && window.roomData) {
                const building = window.roomData[areaId].buildings[buildingName];

                // 查找照明房间ID (支持所有照明相关的单元类型)
                let lightUnit = null;
                const units = building.units;

                // 特殊处理洛阳校区(105) - 使用"层"作为单元
                if (areaId === '105') {
                    // 洛阳校区每个房间只有一个ID，同时用作照明和空调
                    const currentUnit = units[unitName];
                    if (currentUnit) {
                        const roomIndex = currentUnit.rooms.indexOf(roomNumber);
                        if (roomIndex !== -1 && currentUnit.ids[roomIndex]) {
                            const roomId = currentUnit.ids[roomIndex];
                            currentLightRoomId = roomId;
                            currentAcRoomId = roomId;
                            lightRoomResult.textContent = roomId;
                            acRoomResult.textContent = roomId;
                            copyLightBtn.disabled = false;
                            copyAcBtn.disabled = false;
                        }
                    }
                } else {
                    // 其他校区的正常处理逻辑
                    // 优先查找照明相关单元
                    for (const unitName in units) {
                        if (unitName.includes('照明')) {
                            lightUnit = units[unitName];
                            break;
                        }
                    }

                    // 如果没有找到照明单元，检查是否有"房间用电"单元
                    if (!lightUnit && units['房间用电']) {
                        lightUnit = units['房间用电'];
                    }

                    if (lightUnit) {
                        const lightIndex = lightUnit.rooms.indexOf(roomNumber);
                        if (lightIndex !== -1 && lightUnit.ids[lightIndex]) {
                            currentLightRoomId = lightUnit.ids[lightIndex];
                            lightRoomResult.textContent = currentLightRoomId;
                            copyLightBtn.disabled = false;
                        }
                    }

                    // 查找空调房间ID (支持所有空调相关的单元类型)
                    let acUnit = null;

                    // 优先查找空调相关单元
                    for (const unitName in units) {
                        if (unitName.includes('空调')) {
                            acUnit = units[unitName];
                            break;
                        }
                    }

                    // 如果没有找到空调单元，检查是否有"房间用电"单元
                    if (!acUnit && units['房间用电']) {
                        acUnit = units['房间用电'];
                    }

                    if (acUnit) {
                        const acIndex = acUnit.rooms.indexOf(roomNumber);
                        if (acIndex !== -1 && acUnit.ids[acIndex]) {
                            currentAcRoomId = acUnit.ids[acIndex];
                            acRoomResult.textContent = currentAcRoomId;
                            copyAcBtn.disabled = false;
                        } else {
                            acRoomResult.textContent = '该房间无空调编号';
                            copyAcBtn.disabled = true;
                        }
                    } else {
                        acRoomResult.textContent = '该房间无空调编号';
                        copyAcBtn.disabled = true;
                    }
                }
            } else {
                clearResults();
            }
        });
    }

    // 复制按钮事件
    if (copyLightBtn) {
        copyLightBtn.addEventListener('click', function() {
            if (currentLightRoomId) {
                copyToClipboard(currentLightRoomId, '照明房间编号已复制');
            }
        });
    }

    if (copyAcBtn) {
        copyAcBtn.addEventListener('click', function() {
            if (currentAcRoomId) {
                copyToClipboard(currentAcRoomId, '空调房间编号已复制');
            }
        });
    }

    // 工具函数
    function clearResults() {
        lightRoomResult.textContent = '请先选择房间';
        acRoomResult.textContent = '请先选择房间';
        copyLightBtn.disabled = true;
        copyAcBtn.disabled = true;
        currentLightRoomId = '';
        currentAcRoomId = '';
    }

    function copyToClipboard(text, successMessage) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                showToast(successMessage, 'success');
            }).catch(err => {
                console.error('复制失败:', err);
                fallbackCopyTextToClipboard(text, successMessage);
            });
        } else {
            fallbackCopyTextToClipboard(text, successMessage);
        }
    }

    function fallbackCopyTextToClipboard(text, successMessage) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            const successful = document.execCommand('copy');
            if (successful) {
                showToast(successMessage, 'success');
            } else {
                showToast('复制失败，请手动复制', 'error');
            }
        } catch (err) {
            console.error('复制失败:', err);
            showToast('复制失败，请手动复制', 'error');
        }

        document.body.removeChild(textArea);
    }
});