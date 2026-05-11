# 🚀 Quick Start Guide

Hướng dẫn nhanh để chạy dự án Real Estate Management System

## 📋 Yêu cầu hệ thống

- ✅ Java 17 hoặc cao hơn
- ✅ Node.js 18 hoặc cao hơn
- ✅ PostgreSQL 14 hoặc cao hơn
- ✅ Maven 3.8 hoặc cao hơn

## 🎯 Các bước thực hiện

### Bước 1: Setup Database

```bash
# 1. Tạo database
createdb real_estate_db

# 2. Import schema
psql -U postgres -d real_estate_db -f backend/sql/index.sql

# 3. Import dữ liệu mẫu (tùy chọn)
psql -U postgres -d real_estate_db -f backend/sql/sample_data.sql
```

**Lưu ý**: Nếu bạn dùng Windows, có thể dùng pgAdmin hoặc DBeaver để import SQL files.

### Bước 2: Cấu hình Backend

Mở file `backend/src/main/resources/application.properties` và cập nhật thông tin database:

```properties
# Database Configuration
spring.datasource.url=jdbc:postgresql://localhost:5432/real_estate_db
spring.datasource.username=postgres
spring.datasource.password=your_password_here

# JWT Secret (Đổi thành secret key của bạn)
jwt.secret=your-secret-key-here-change-this-in-production
jwt.expiration=86400000
```

### Bước 3: Chạy Backend

```bash
# Di chuyển vào thư mục backend
cd backend

# Build project
mvn clean install

# Chạy application
mvn spring-boot:run
```

Backend sẽ chạy tại: **http://localhost:8080**

Kiểm tra backend đã chạy:
```bash
curl http://localhost:8080/api/test
```

### Bước 4: Chạy Frontend

Mở terminal mới:

```bash
# Di chuyển vào thư mục frontend
cd frontend

# Install dependencies
npm install

# Chạy development server
npm run dev
```

Frontend sẽ chạy tại: **http://localhost:5173**

## 🎉 Hoàn tất!

Mở trình duyệt và truy cập: **http://localhost:5173**

## 👤 Tài khoản demo

### Admin
```
Email: admin@realestate.com
Password: admin123
```

### Broker
```
Email: broker@realestate.com
Password: broker123
```

### Customer
```
Email: customer@realestate.com
Password: customer123
```

## 🧪 Test các chức năng

### 1. Test đăng nhập
1. Truy cập http://localhost:5173
2. Click "Đăng nhập"
3. Nhập email và password của một trong các tài khoản demo
4. Kiểm tra redirect đúng dashboard theo role

### 2. Test xem danh sách BĐS (Public)
1. Truy cập http://localhost:5173/properties
2. Xem danh sách BĐS
3. Click vào một BĐS để xem chi tiết

### 3. Test thêm BĐS (Admin/Broker)
1. Đăng nhập với tài khoản Admin hoặc Broker
2. Vào trang quản lý BĐS
3. Click "Thêm BĐS"
4. Điền thông tin và submit
5. Kiểm tra BĐS mới xuất hiện trong danh sách

### 4. Test đặt lịch hẹn (Customer)
1. Đăng nhập với tài khoản Customer
2. Vào trang danh sách BĐS
3. Click vào một BĐS
4. Click "Hẹn xem BĐS"
5. Chọn ngày giờ và submit
6. Kiểm tra lịch hẹn trong dashboard

## 🐛 Xử lý lỗi thường gặp

### Backend không khởi động

**Lỗi: "Connection refused"**
```
Nguyên nhân: PostgreSQL chưa chạy
Giải pháp:
- Windows: Mở Services và start PostgreSQL
- Linux/Mac: sudo systemctl start postgresql
```

**Lỗi: "Port 8080 already in use"**
```
Nguyên nhân: Port 8080 đã bị chiếm
Giải pháp:
- Tìm và kill process đang dùng port 8080
- Hoặc đổi port trong application.properties:
  server.port=8081
```

**Lỗi: "Authentication failed"**
```
Nguyên nhân: Sai username/password database
Giải pháp: Kiểm tra lại thông tin trong application.properties
```

### Frontend không kết nối Backend

**Lỗi: "Network Error" hoặc "CORS Error"**
```
Nguyên nhân: Backend chưa chạy hoặc CORS chưa cấu hình đúng
Giải pháp:
1. Kiểm tra backend đã chạy: curl http://localhost:8080/api/test
2. Kiểm tra CORS trong SecurityConfig.java
3. Restart backend
```

**Lỗi: "Cannot find module"**
```
Nguyên nhân: Dependencies chưa được install
Giải pháp:
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Database errors

**Lỗi: "Database does not exist"**
```
Giải pháp:
createdb real_estate_db
psql -U postgres -d real_estate_db -f backend/sql/index.sql
```

**Lỗi: "Table already exists"**
```
Giải pháp:
# Drop và tạo lại database
dropdb real_estate_db
createdb real_estate_db
psql -U postgres -d real_estate_db -f backend/sql/index.sql
```

## 📚 Tài liệu bổ sung

- [README.md](./README.md) - Tổng quan dự án
- [WORKFLOW.md](./WORKFLOW.md) - Luồng hoạt động chi tiết
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - Tài liệu API
- [FIXES_APPLIED.md](./FIXES_APPLIED.md) - Các sửa đổi đã thực hiện

## 🔧 Development Tips

### Hot Reload

**Backend**: Spring Boot DevTools đã được enable, code sẽ tự động reload khi save.

**Frontend**: Vite hỗ trợ HMR (Hot Module Replacement), thay đổi sẽ hiển thị ngay lập tức.

### Debug Backend

Thêm breakpoint trong IDE và chạy debug mode:
```bash
mvn spring-boot:run -Dspring-boot.run.jvmArguments="-Xdebug -Xrunjdwp:transport=dt_socket,server=y,suspend=n,address=5005"
```

### Debug Frontend

Mở Chrome DevTools (F12) và sử dụng:
- Console tab: Xem logs
- Network tab: Xem API requests
- React DevTools: Debug React components

### View Logs

**Backend logs**: Hiển thị trực tiếp trong terminal

**Frontend logs**: Mở Console trong browser (F12)

**Database logs**: 
```bash
# PostgreSQL logs location
# Linux: /var/log/postgresql/
# Windows: C:\Program Files\PostgreSQL\14\data\log\
```

## 🚀 Production Deployment

### Backend

```bash
# Build JAR file
cd backend
mvn clean package -DskipTests

# Run JAR
java -jar target/management-1.0.0.jar
```

### Frontend

```bash
# Build production
cd frontend
npm run build

# Output sẽ ở thư mục dist/
# Deploy dist/ lên web server (Nginx, Apache, etc.)
```

### Environment Variables

**Backend** (application-prod.properties):
```properties
spring.datasource.url=${DATABASE_URL}
spring.datasource.username=${DATABASE_USERNAME}
spring.datasource.password=${DATABASE_PASSWORD}
jwt.secret=${JWT_SECRET}
```

**Frontend** (.env.production):
```
VITE_API_URL=https://your-api-domain.com/api
```

## 📞 Cần trợ giúp?

- 📖 Đọc [README.md](./README.md) để hiểu tổng quan
- 📋 Xem [WORKFLOW.md](./WORKFLOW.md) để hiểu luồng hoạt động
- 🔍 Xem [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) để biết chi tiết API
- 🐛 Xem [FIXES_APPLIED.md](./FIXES_APPLIED.md) để biết các thay đổi gần đây

---

**Happy Coding! 🎉**
