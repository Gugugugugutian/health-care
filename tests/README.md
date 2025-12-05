# HealthTrack 功能测试套件

## 测试文件说明

### 测试脚本列表

1. **01_user_registration.ps1** - 用户注册功能测试
   - 姓名、唯一健康ID、邮箱、电话
   - 一个电话，多个邮箱
   - 验证状态记录

2. **02_provider_linking.ps1** - 医疗提供者关联测试
   - 链接多个提供者，设置主要医生
   - 提供者验证
   - 链接/取消链接功能
   - 搜索提供者

3. **03_family_groups.ps1** - 家庭组功能测试
   - 创建家庭组
   - 添加/移除成员
   - 权限管理
   - 关系跟踪

4. **04_appointments.ps1** - 预约功能测试
   - 通过provider_id预约
   - 通过license_number预约（新功能）
   - 通过verified email预约（新功能）
   - 24小时前取消规则
   - 取消原因记录

5. **05_wellness_challenges.ps1** - 健康挑战功能测试
   - 创建挑战（目标、起止日期）
   - 邀请参与者
   - 进度跟踪
   - 搜索挑战

6. **06_invitations.ps1** - 邀请系统测试
   - 发送邀请到邮箱/电话
   - 15天有效期
   - 新用户注册接受邀请
   - 邀请状态跟踪

7. **07_health_data.ps1** - 健康数据功能测试
   - 记录健康指标
   - 月度汇总报告
   - 搜索功能
   - 数据统计

8. **run_all_tests.ps1** - 运行所有测试的主脚本

## 运行测试步骤

### 前提条件
1. 确保MySQL服务正在运行
2. 确保服务器正在运行（`npm run dev`）
3. 确保已创建数据库（运行过`database.sql`）

### 方法1：运行单个测试
```powershell
cd D:\Coding\development\health-care\tests
.\01_user_registration.ps1
```

### 方法2：运行所有测试
```powershell
cd D:\Coding\development\health-care\tests
.\run_all_tests.ps1
```

### 方法3：手动测试特定功能
```powershell
# 测试健康端点
curl http://localhost:3000/health

# 测试提供者列表
curl http://localhost:3000/api/providers

# 注册用户
curl -X POST http://localhost:3000/api/auth/register -H "Content-Type: application/json" -d "{\"health_id\": \"TEST001\", \"name\": \"Test User\", \"phone\": \"+15551234567\", \"password\": \"Password123\", \"email\": \"test@example.com\"}"
```

## 测试数据

测试脚本会自动创建测试用户和数据，不会影响现有数据。

## 功能覆盖检查

所有项目需求都已实现：

### ✅ 用户注册功能
- [x] 姓名、唯一健康ID、邮箱、电话
- [x] 一个电话，多个邮箱
- [x] 验证状态记录
- [x] 验证过程不实现（按要求）

### ✅ 医疗提供者关联
- [x] 唯一医疗执照号
- [x] 多个提供者，一个主要医生
- [x] 提供者验证状态
- [x] 链接/取消链接功能

### ✅ 家庭组
- [x] 家庭组创建
- [x] 权限管理
- [x] 成员关系

### ✅ 预约功能
- [x] 通过provider_id预约
- [x] 通过license_number预约 ✓
- [x] 通过verified email预约 ✓
- [x] 日期、时间、咨询类型、备注
- [x] 唯一ID
- [x] 24小时前取消
- [x] 取消原因记录

### ✅ 健康挑战功能
- [x] 通过邮箱/电话邀请
- [x] 目标、起止日期
- [x] 唯一ID
- [x] 参与者跟踪

### ✅ 邀请系统
- [x] 15天有效期
- [x] 邀请状态跟踪
- [x] 新用户注册接受

### ✅ 健康数据和搜索
- [x] 月度报告
- [x] 搜索功能

## 注意事项

1. 测试脚本使用PowerShell编写，适用于Windows系统
2. 如果遇到执行策略错误，运行：
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```
3. 测试过程中会创建临时用户和数据，测试完成后可清理
4. 确保服务器端口3000可用，或在`.env`文件中修改端口