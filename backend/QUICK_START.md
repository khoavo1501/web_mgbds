# Quick Start Guide

## Yêu cầu hệ thống
- Java 17 hoặc cao hơn
- Maven 3.6+
- PostgreSQL 12+

## Bước 1: Setup Database

### Tạo database
```bash
# Sử dụng psql
psql -U postgres
CREATE DATABASE realestate_db;
\q
```

Hoặc sử dụng pgAdmin để tạo database với tên `realestate_db`.

### Cấu hình kết nối
Mở file `src/main/resources/application.properties` và cập nhật:
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/realestate_db
spring.datasource.username=postgres
spring.datasource.password=your_password_here
```

## Bước 2: Build và Run

### Build project
```bash
cd backend
mvn clean install -DskipTests
```

### Run application
```bash
mvn spring-boot:run
```

Hoặc:
```bash
java -jar target/management-1.0.0.jar
```

Application sẽ chạy tại: **http://localhost:8080/api**

## Bước 3: Insert dữ liệu mẫu (Optional)

Sau khi application chạy lần đầu (Hibernate sẽ tạo tables), insert dữ liệu mẫu:

```bash
psql -U postgres -d realestate_db -f sql/sample_data.sql
```

## Bước 4: Test API

### Test với curl

#### 1. Đăng ký user
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "123456",
    "fullName": "Admin Test",
    "phone": "0123456789",
    "role": "admin"
  }'
```

#### 2. Đăng nhập
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "123456"
  }'
```

**Lưu token từ response!**

#### 3. Lấy danh sách BDS (Public)
```bash
curl http://localhost:8080/api/properties
```

#### 4. Tạo BDS mới (cần token)
```bash
curl -X POST http://localhost:8080/api/properties \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Căn hộ test",
    "description": "Mô tả test",
    "propertyType": "apartment",
    "province": "Hà Nội",
    "district": "Cầu Giấy",
    "area": 75,
    "price": 3500000000,
    "images": [
      {
        "url": "https://picsum.photos/800/600",
        "isPrimary": true
      }
    ]
  }'
```

### Test với Postman/Thunder Client

Import collection hoặc test thủ công theo hướng dẫn trong file `API_TESTING.md`.

## Troubleshooting

### Lỗi: "Failed to configure a DataSource"
- Kiểm tra PostgreSQL đã chạy chưa
- Kiểm tra database `realestate_db` đã được tạo chưa
- Kiểm tra username/password trong `application.properties`

### Lỗi: "Port 8080 already in use"
- Thay đổi port trong `application.properties`:
  ```properties
  server.port=8081
  ```

### Lỗi: "Lombok not working"
- Đảm bảo đã cài Lombok plugin trong IDE
- Restart IDE sau khi cài plugin
- Enable annotation processing trong IDE settings

### Lỗi biên dịch
```bash
# Clean và rebuild
mvn clean install -DskipTests -U
```

## Các endpoints có sẵn

### Public (không cần authentication)
- `GET /api/properties` - Danh sách BDS
- `GET /api/properties/{id}` - Chi tiết BDS
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập

### Protected (cần authentication)
- `POST /api/properties` - Tạo BDS (Admin/Broker)
- `PUT /api/properties/{id}` - Cập nhật BDS (Admin/Broker)
- `DELETE /api/properties/{id}` - Xóa BDS (Admin)

## Logs

Xem logs trong console hoặc file `logs/spring-boot-logger.log` (nếu được cấu hình).

## Dừng application

Nhấn `Ctrl + C` trong terminal đang chạy application.

---

**Xem thêm:**
- `README.md` - Tài liệu chi tiết
- `API_TESTING.md` - Hướng dẫn test API đầy đủ
