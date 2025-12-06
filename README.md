# HealthTrack Personal Wellness Platform

一个完整的个人健康与健康管理平台，包含后端API服务和前端Vue.js应用。

![alt text](<localhost_5173_ (3).png>)

## 🚀 项目概述

HealthTrack是一个全面的健康管理平台，允许用户跟踪健康指标、参与健康挑战、管理医疗预约、创建家庭组，并与医疗提供者连接。平台提供实时数据分析和可视化仪表盘。

## ✨ 核心功能

### 📊 健康数据分析
- **健康指标跟踪**：记录体重、血压、步数等健康数据
- **月度统计分析**：计算特定健康指标的月均值、最小值、最大值
- **实时仪表盘**：可视化展示健康趋势和统计数据

### 🏆 健康挑战系统
- **创建挑战**：用户可以创建个性化的健康挑战
- **参与挑战**：加入他人创建的挑战并跟踪进度
- **热门挑战排行**：显示参与人数最多的健康挑战
- **进度跟踪**：实时更新挑战完成进度

### 👥 用户活跃度分析
- **最活跃用户排行**：基于健康记录和挑战参与度排名
- **活动分数计算**：健康记录数 + 挑战参与数×2
- **用户活动统计**：展示用户的整体参与度

### 🏥 医疗管理
- **预约管理**：预约医疗提供者，支持取消（24小时内）
- **医疗提供者**：管理医疗专业人员信息
- **家庭组**：创建家庭组，共享健康信息

### 📱 用户管理
- **多邮箱支持**：每个用户可关联多个邮箱
- **验证系统**：邮箱和电话验证支持
- **邀请系统**：15天有效期的邀请链接

## 🏗️ 技术架构

### 后端技术栈
- **Node.js** + **Express.js** - RESTful API服务器
- **MySQL** - 关系型数据库
- **JWT** - 用户认证和授权
- **bcrypt** - 密码加密
- **CORS** - 跨域资源共享

### 前端技术栈
- **Vue.js 3** - 渐进式JavaScript框架
- **Vue Router** - 前端路由管理
- **Axios** - HTTP客户端
- **Vite** - 前端构建工具
- **CSS3** - 响应式设计

## 📁 项目结构

```
health-care/
├── backend/                    # 后端服务
│   ├── src/
│   │   ├── config/            # 数据库配置
│   │   ├── controllers/       # API控制器
│   │   ├── middleware/        # 认证中间件
│   │   ├── models/           # 数据模型
│   │   ├── routes/           # API路由
│   │   ├── utils/            # 工具函数
│   │   └── app.js            # 主应用文件
│   ├── database.sql          # 数据库架构和示例数据
│   ├── .env                  # 环境变量
│   └── package.json          # 依赖项
│
├── frontend/                  # 前端应用
│   ├── src/
│   │   ├── components/       # Vue组件
│   │   │   ├── HealthMetricMonthlyStats.vue    # 健康指标月统计
│   │   │   ├── MostPopularChallenges.vue       # 最热门挑战
│   │   │   └── MostActiveUsers.vue             # 最活跃用户
│   │   ├── views/            # 页面视图
│   │   │   ├── Dashboard.vue                   # 仪表盘
│   │   │   ├── Login.vue                       # 登录页
│   │   │   ├── Register.vue                    # 注册页
│   │   │   ├── Profile.vue                     # 个人资料
│   │   │   ├── HealthMetrics.vue               # 健康指标
│   │   │   ├── Challenges.vue                  # 挑战管理
│   │   │   ├── Appointments.vue                # 预约管理
│   │   │   ├── Family.vue                      # 家庭组
│   │   │   ├── Invitations.vue                 # 邀请管理
│   │   │   └── Providers.vue                   # 医疗提供者
│   │   ├── services/         # API服务
│   │   │   ├── api.js                          # Axios配置
│   │   │   ├── auth.js                         # 认证服务
│   │   │   ├── healthMetrics.js                # 健康指标服务
│   │   │   ├── challenges.js                   # 挑战服务
│   │   │   ├── appointments.js                 # 预约服务
│   │   │   ├── family.js                       # 家庭组服务
│   │   │   ├── invitations.js                  # 邀请服务
│   │   │   ├── providers.js                    # 提供者服务
│   │   │   └── userStats.js                    # 用户统计服务（新增）
│   │   ├── router/           # 路由配置
│   │   ├── layouts/          # 布局组件
│   │   └── main.js           # 应用入口
│   └── package.json          # 前端依赖项
│
├── README.md                 # 项目文档
├── README_backup.md          # 原始文档备份
└── API_DOCUMENTATION.md      # API详细文档
```

## 🛠️ 安装与运行

### 前置要求
- Node.js (v14或更高版本)
- MySQL (v5.7或更高版本)
- npm 或 yarn

### 1. 克隆项目
```bash
git clone <repository-url>
cd health-care
```

### 2. 数据库设置
```bash
# 使用提供的MySQL root密码 (123456)
mysql -u root -p123456 < backend/database.sql
```

### 3. 后端设置
```bash
cd backend
npm install

# 环境配置（.env文件已提供）
# PORT=3000
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=123456
# DB_NAME=healthtrack
# JWT_SECRET=your_jwt_secret_key_here_change_in_production

# 启动后端服务器
npm run dev  # 开发模式
# 或
npm start    # 生产模式
```

### 4. 前端设置
```bash
cd ../frontend
npm install

# 启动前端开发服务器
npm run dev
```

## 🌐 API端点

### 公开API
- `GET /api/challenges/popular` - 获取最热门挑战
- `GET /api/user-stats/active` - 获取最活跃用户
- `GET /api/challenges/active` - 获取活跃挑战
- `GET /api/challenges/search` - 搜索挑战

### 需要认证的API
- `GET /api/health-metrics/summary/monthly` - 获取月度健康指标统计
- `GET /api/challenges/stats` - 获取挑战统计
- `GET /api/user-stats/stats` - 获取用户活动统计
- 其他用户相关API需要JWT令牌

## 📈 新增功能详情

### 1. 健康指标月统计组件
**文件位置**: `frontend/src/components/HealthMetricMonthlyStats.vue`
- 按月份和指标类型显示统计数据
- 支持年份、月份、指标类型筛选
- 显示记录数、平均值、最小值、最大值
- 使用现有API: `GET /api/health-metrics/summary/monthly`

### 2. 最热门挑战组件
**文件位置**: `frontend/src/components/MostPopularChallenges.vue`
- 显示参与人数最多的健康挑战
- 按参与人数排序，显示排名
- 显示挑战详情、参与人数、平均进度
- 使用新增API: `GET /api/challenges/popular`

### 3. 最活跃用户组件
**文件位置**: `frontend/src/components/MostActiveUsers.vue`
- 显示最活跃的用户（基于健康记录和挑战参与）
- 计算活动分数：`健康记录数 + 挑战数×2`
- 显示用户头像、健康记录数、挑战参与数
- 使用新增API: `GET /api/user-stats/active`

### 4. 后端API扩展
**最热门挑战API**: `backend/src/models/WellnessChallenge.js:191-241`
- 新增`getMostPopularChallenges()`方法
- 只返回有参与者的挑战
- 按参与人数降序排序

**最活跃用户API**: `backend/src/models/User.js:214-269`
- 新增`getMostActiveUsers()`方法
- 只返回有活动的用户（activity_score > 0）
- 按活动分数降序排序

**新增控制器**: `backend/src/controllers/userStatsController.js`
- 处理用户统计相关API

**新增路由**: `backend/src/routes/userStats.js`
- 用户统计API路由配置

## 🎨 仪表盘功能

### 统计卡片
- 我的预约总数
- 活跃挑战数
- 健康指标记录数
- 家庭组成员数

### 实时数据
- 最近5条预约
- 最近5个活跃挑战（带进度条）
- 健康指标月度统计
- 最热门挑战排行
- 最活跃用户排行

## 🔧 数据验证与过滤

### 数据质量保证
1. **真实数据展示**：只显示有实际数据的记录
2. **活动用户过滤**：只显示有健康记录或挑战参与的用户
3. **有效挑战过滤**：只显示有参与者的挑战
4. **空状态处理**：无数据时显示友好提示

### 后端过滤逻辑
```javascript
// 只返回有活动的用户
if (activityScore > 0) {
    // 包含用户
}

// 只返回有参与者的挑战
if (participantCount > 0) {
    // 包含挑战
}
```

## 🧪 测试数据

数据库包含以下示例数据：
- 6个用户（不同验证状态）
- 3个医疗提供者
- 多个预约记录
- 4个健康挑战（不同参与度）
- 1个家庭组
- 多个健康指标记录

## 🔒 安全特性

- **密码加密**：使用bcrypt进行密码哈希
- **JWT认证**：JSON Web Tokens用于用户认证
- **输入验证**：所有API端点都有输入验证
- **SQL注入防护**：使用参数化查询
- **CORS配置**：安全的跨域资源共享
- **路由守卫**：前端路由认证保护

## 📱 响应式设计

- 移动端优先的设计理念
- 自适应网格布局
- 触摸友好的交互元素
- 优化的加载状态和空状态

## 🚀 性能优化

- **API优化**：减少不必要的数据库查询
- **前端懒加载**：按需加载组件
- **数据缓存**：合理使用浏览器缓存
- **错误边界**：优雅的错误处理

## 🔄 开发工作流

### 后端开发
```bash
cd backend
npm run dev  # 启动开发服务器（带热重载）
```

### 前端开发
```bash
cd frontend
npm run dev  # 启动Vite开发服务器
```

### 数据库管理
```bash
# 重置数据库
mysql -u root -p123456 < backend/database.sql
```

## 📄 许可证

ISC License

## 🤝 贡献指南

1. Fork项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开Pull Request

## 📞 支持与反馈

如有问题或建议，请通过以下方式联系：
- 创建GitHub Issue
- 提交Pull Request
- 查看API文档获取详细信息

## 🎯 项目状态

✅ **已完成功能**
- 用户注册与认证系统
- 健康指标跟踪与月统计
- 健康挑战创建与参与
- 医疗预约管理
- 家庭组管理
- 邀请系统
- 仪表盘数据分析
- 最热门挑战排行
- 最活跃用户排行

🔧 **待优化功能**
- 实时通知系统
- 移动端应用
- 高级数据分析
- 第三方健康设备集成

---

**最后更新**: 2025年12月6日
**版本**: 2.0.0
**作者**: HealthTrack开发团队