# Hệ thống Quản lý Trung tâm Môi giới Bất động sản - Backend

## Tech Stack
- **Java 17**
- **Spring Boot 3.2.0**
- **Spring Data JPA**
- **Spring Security + JWT**
- **PostgreSQL**
- **Lombok**

## Cấu trúc dự án

```
backend/
├── src/main/java/com/realestate/management/
│   ├── entity/              # Các Entity (14 bảng)
│   │   ├── User.java
│   │   ├── Category.java
│   │   ├── Property.java
│   │   ├── PropertyImage.java
│   │   ├── Customer.java
│   │   ├── Lead.java
│   │   ├── Transaction.java
│   │   ├── TransactionPayment.java
│   │   ├── Contract.java
│   │   ├── Appointment.java
│   │   ├── Commission.java
│   │   ├── Notification.java
│   │   ├── AuditLog.java
│   │   └── Session.java
│   │
│   ├── repository/          # JPA Repositories
│   │   ├── UserRepository.java
│   │   ├── CategoryRepository.java
│   │   ├── PropertyRepository.java
│   │   ├── PropertyImageRepository.java
│   │   └── ... (10 repositories khác)
│   │
│   ├── dto/                 # Data Transfer Objects
│   │   └── ApiResponse.java
│   │
│   ├── service/             # Business Logic (sẽ tạo tiếp)
│   ├── controller/          # REST Controllers (sẽ tạo tiếp)
│   ├── config/              # Configuration classes (sẽ tạo tiếp)
│   ├── security/            # JWT & Security (sẽ tạo tiếp)
│   └── exception/           # Exception Handlers (sẽ tạo tiếp)
│
├── src/main/resources/
│   └── application.properties
│
└── pom.xml
```

## Các Entity đã tạo

### 1. **User** - Quản lý người dùng
- Roles: `admin`, `broker`, `customer`
- Quan hệ: OneToMany với Property, Appointment, Notification

### 2. **Category** - Danh mục
- Types: `property_type`, `province`
- Self-referencing relationship (parent-child)

### 3. **Property** - Bất động sản
- Status: `pending`, `published`, `sold`
- Quan hệ: ManyToOne với User, OneToMany với PropertyImage, Appointment, Lead, Transaction

### 4. **PropertyImage** - Hình ảnh BDS
- Quan hệ: ManyToOne với Property

### 5-14. **Các Entity khác**
- Customer, Lead, Transaction, TransactionPayment, Contract
- Appointment, Commission, Notification, AuditLog, Session

## Repositories đã tạo

Tất cả 14 repositories đã được tạo với các query methods:
- Basic CRUD operations (từ JpaRepository)
- Custom finder methods
- Custom queries với @Query annotation

### Ví dụ PropertyRepository:
```java
- findByPropertyCode()
- findByStatus()
- searchProperties() // Tìm kiếm theo nhiều tiêu chí
- searchByKeyword() // Tìm theo title/description
```

## Setup và Chạy dự án

### 1. Cài đặt PostgreSQL
```bash
# Tạo database
createdb realestate_db

# Hoặc dùng psql
psql -U postgres
CREATE DATABASE realestate_db;
```

### 2. Cấu hình Database
Chỉnh sửa `application.properties`:
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/realestate_db
spring.datasource.username=your_username
spring.datasource.password=your_password
```

### 3. Build và Run
```bash
# Build project
mvn clean install

# Run application
mvn spring-boot:run
```

### 4. Kiểm tra
- API Base URL: `http://localhost:8080/api`
- Hibernate sẽ tự động tạo các bảng (ddl-auto=update)

## ApiResponse Wrapper

Tất cả API responses sử dụng cấu trúc chuẩn:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "timestamp": "2024-01-01T10:00:00"
}
```

### Sử dụng trong Controller:
```java
// Success with data
return ResponseEntity.ok(ApiResponse.success("Lấy dữ liệu thành công", data));

// Success without data
return ResponseEntity.ok(ApiResponse.success("Xóa thành công"));

// Error
return ResponseEntity.badRequest().body(ApiResponse.error("Lỗi validation"));
```

## Lưu ý quan trọng

### 1. Tránh vòng lặp vô hạn JSON
- Sử dụng `@JsonIgnore` trên các quan hệ ngược (inverse relationships)
- Ví dụ: Property có `@JsonIgnore` trên `createdBy`, `assignedTo`

### 2. Lazy Loading
- Tất cả relationships sử dụng `FetchType.LAZY`
- Tránh N+1 query problem

### 3. Lombok
- `@Data`: Tự động tạo getter/setter/toString/equals/hashCode
- `@NoArgsConstructor`: Constructor không tham số
- `@AllArgsConstructor`: Constructor đầy đủ tham số

### 4. Timestamps
- Sử dụng `@CreationTimestamp` cho các trường created_at
- Tự động set giá trị khi insert

## Bước tiếp theo

1. ✅ Entities & Repositories (HOÀN THÀNH)
2. ✅ Security Configuration (JWT) (HOÀN THÀNH)
3. ✅ Service Layer - PropertyService, AuthService (HOÀN THÀNH)
4. ✅ Controllers - PropertyController, AuthController (HOÀN THÀNH)
5. ✅ Exception Handling (HOÀN THÀNH)
6. ✅ Validation (HOÀN THÀNH)
7. ⏳ Các Service/Controller khác (Appointment, Transaction, Lead, etc.)
8. ⏳ File Upload (Hình ảnh BDS)
9. ⏳ Email Notification
10. ⏳ Unit Tests

## APIs đã implement

### Authentication APIs
- ✅ POST /api/auth/register - Đăng ký user
- ✅ POST /api/auth/login - Đăng nhập (trả về JWT token)

### Property APIs
- ✅ GET /api/properties - Lấy danh sách BDS (có phân trang, tìm kiếm)
- ✅ GET /api/properties/{id} - Lấy chi tiết 1 BDS
- ✅ POST /api/properties - Tạo mới BDS (Admin/Broker)

## Security

### JWT Authentication
- Token expiration: 24 giờ (có thể config trong application.properties)
- Token format: Bearer {token}
- Roles: admin, broker, customer

### Endpoints Protection
- Public: GET /api/properties, GET /api/properties/{id}, /api/auth/**
- Admin only: DELETE /api/properties/{id}
- Admin + Broker: POST /api/properties, PUT /api/properties/{id}

## Testing

Xem file `API_TESTING.md` để biết chi tiết cách test các API endpoints.

Quick test:
```bash
# 1. Đăng ký admin
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"123456","fullName":"Admin","phone":"0123456789","role":"admin"}'

# 2. Đăng nhập
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"123456"}'

# 3. Lấy danh sách BDS
curl http://localhost:8080/api/properties
```

---

**Tác giả:** Senior Fullstack Developer  
**Ngày tạo:** 2024
