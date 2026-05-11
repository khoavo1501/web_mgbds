# API Documentation - Real Estate Management System

## Base URL
```
http://localhost:8080/api
```

## Authentication
Hầu hết các endpoint yêu cầu JWT token trong header:
```
Authorization: Bearer {your_jwt_token}
```

---

## 1. Authentication APIs

### 1.1. Đăng ký tài khoản

**Endpoint**: `POST /api/auth/register`

**Public**: Yes

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "fullName": "Nguyễn Văn A",
  "phone": "0123456789",
  "role": "customer"
}
```

**Validation**:
- `email`: Required, valid email format, unique
- `password`: Required, min 6 characters
- `fullName`: Required
- `phone`: Optional
- `role`: Required, one of: `customer`, `broker`, `admin`

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Đăng ký thành công",
  "data": {
    "userId": 1,
    "email": "user@example.com",
    "fullName": "Nguyễn Văn A",
    "phone": "0123456789",
    "role": "customer"
  }
}
```

**Error Response** (400 Bad Request):
```json
{
  "success": false,
  "message": "Email đã tồn tại",
  "data": null
}
```

---

### 1.2. Đăng nhập

**Endpoint**: `POST /api/auth/login`

**Public**: Yes

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "userId": 1,
      "email": "user@example.com",
      "fullName": "Nguyễn Văn A",
      "phone": "0123456789",
      "role": "customer"
    }
  }
}
```

**Error Response** (401 Unauthorized):
```json
{
  "success": false,
  "message": "Email hoặc mật khẩu không đúng",
  "data": null
}
```

---

## 2. Property APIs

### 2.1. Lấy danh sách BĐS (có phân trang và tìm kiếm)

**Endpoint**: `GET /api/properties`

**Public**: Yes

**Query Parameters**:
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | Integer | No | 0 | Số trang (bắt đầu từ 0) |
| size | Integer | No | 10 | Số item mỗi trang |
| status | String | No | - | Trạng thái: `pending`, `published`, `sold`, `rented` |
| propertyType | String | No | - | Loại BĐS: `Căn hộ`, `Nhà riêng`, `Đất nền`, `Biệt thự` |
| province | String | No | - | Tỉnh/Thành phố |
| district | String | No | - | Quận/Huyện |
| minPrice | BigDecimal | No | - | Giá tối thiểu |
| maxPrice | BigDecimal | No | - | Giá tối đa |
| minArea | BigDecimal | No | - | Diện tích tối thiểu |
| maxArea | BigDecimal | No | - | Diện tích tối đa |
| keyword | String | No | - | Từ khóa tìm kiếm (title, description) |
| sortBy | String | No | createdAt | Sắp xếp theo: `createdAt`, `price`, `area` |
| sortDirection | String | No | DESC | Hướng sắp xếp: `ASC`, `DESC` |

**Example Request**:
```
GET /api/properties?page=0&size=10&status=published&province=Hà Nội&minPrice=1000000000&maxPrice=5000000000&sortBy=price&sortDirection=ASC
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Lấy danh sách BDS thành công",
  "data": {
    "content": [
      {
        "propertyId": 1,
        "propertyCode": "BDS-2026-0001",
        "title": "Căn hộ cao cấp Vinhomes",
        "description": "Căn hộ 3 phòng ngủ, view đẹp, nội thất cao cấp",
        "propertyType": "Căn hộ",
        "status": "published",
        "province": "Hà Nội",
        "district": "Quận Cầu Giấy",
        "area": 120.5,
        "price": 5000000000,
        "createdAt": "2026-05-10T10:00:00",
        "createdBy": {
          "userId": 2,
          "fullName": "Admin User",
          "email": "admin@example.com",
          "phone": null
        },
        "assignedTo": {
          "userId": 3,
          "fullName": "Broker User",
          "email": "broker@example.com",
          "phone": "0123456789"
        },
        "images": [
          {
            "imageId": 1,
            "url": "https://example.com/image1.jpg",
            "isPrimary": true
          },
          {
            "imageId": 2,
            "url": "https://example.com/image2.jpg",
            "isPrimary": false
          }
        ]
      }
    ],
    "pageable": {
      "sort": {
        "sorted": true,
        "unsorted": false,
        "empty": false
      },
      "pageNumber": 0,
      "pageSize": 10,
      "offset": 0,
      "paged": true,
      "unpaged": false
    },
    "totalPages": 5,
    "totalElements": 50,
    "last": false,
    "first": true,
    "size": 10,
    "number": 0,
    "sort": {
      "sorted": true,
      "unsorted": false,
      "empty": false
    },
    "numberOfElements": 10,
    "empty": false
  }
}
```

---

### 2.2. Lấy chi tiết BĐS

**Endpoint**: `GET /api/properties/{id}`

**Public**: Yes

**Path Parameters**:
- `id`: Property ID (Long)

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Lấy chi tiết BDS thành công",
  "data": {
    "propertyId": 1,
    "propertyCode": "BDS-2026-0001",
    "title": "Căn hộ cao cấp Vinhomes",
    "description": "Căn hộ 3 phòng ngủ, view đẹp, nội thất cao cấp",
    "propertyType": "Căn hộ",
    "status": "published",
    "province": "Hà Nội",
    "district": "Quận Cầu Giấy",
    "area": 120.5,
    "price": 5000000000,
    "createdAt": "2026-05-10T10:00:00",
    "createdBy": {
      "userId": 2,
      "fullName": "Admin User",
      "email": "admin@example.com",
      "phone": null
    },
    "assignedTo": {
      "userId": 3,
      "fullName": "Broker User",
      "email": "broker@example.com",
      "phone": "0123456789"
    },
    "images": [
      {
        "imageId": 1,
        "url": "https://example.com/image1.jpg",
        "isPrimary": true
      }
    ]
  }
}
```

**Error Response** (404 Not Found):
```json
{
  "success": false,
  "message": "Không tìm thấy BDS với ID: 999",
  "data": null
}
```

---

### 2.3. Tạo BĐS mới

**Endpoint**: `POST /api/properties`

**Authentication**: Required

**Authorization**: `ADMIN` or `BROKER`

**Request Body**:
```json
{
  "title": "Căn hộ cao cấp Vinhomes",
  "description": "Căn hộ 3 phòng ngủ, view đẹp, nội thất cao cấp",
  "propertyType": "Căn hộ",
  "province": "Hà Nội",
  "district": "Quận Cầu Giấy",
  "area": 120.5,
  "price": 5000000000,
  "assignedToId": 3,
  "images": [
    {
      "url": "https://example.com/image1.jpg",
      "isPrimary": true
    },
    {
      "url": "https://example.com/image2.jpg",
      "isPrimary": false
    }
  ]
}
```

**Validation**:
- `title`: Required, max 255 characters
- `description`: Required
- `propertyType`: Required
- `province`: Required
- `district`: Required
- `area`: Required, > 0
- `price`: Required, > 0
- `assignedToId`: Optional (Admin only)
- `images`: Optional

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Tạo BDS thành công",
  "data": {
    "propertyId": 10,
    "propertyCode": "BDS-2026-0010",
    "title": "Căn hộ cao cấp Vinhomes",
    "status": "pending",
    ...
  }
}
```

**Notes**:
- Hệ thống tự động tạo `propertyCode` theo format: `BDS-{YEAR}-{NUMBER}`
- Trạng thái mặc định: `pending`
- `createdBy` tự động lấy từ user đang đăng nhập
- Nếu có `assignedToId`, phải là user có role `broker`

---

### 2.4. Cập nhật BĐS

**Endpoint**: `PUT /api/properties/{id}`

**Authentication**: Required

**Authorization**: `ADMIN` or `BROKER` (owner only)

**Path Parameters**:
- `id`: Property ID (Long)

**Request Body**: Same as Create

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Cập nhật BDS thành công",
  "data": {
    "propertyId": 1,
    "propertyCode": "BDS-2026-0001",
    ...
  }
}
```

**Authorization Rules**:
- **Admin**: Có thể cập nhật tất cả BĐS
- **Broker**: Chỉ cập nhật được BĐS do mình phụ trách (`assignedTo`)

**Error Response** (403 Forbidden):
```json
{
  "success": false,
  "message": "Bạn không có quyền cập nhật BDS này",
  "data": null
}
```

---

### 2.5. Xóa BĐS

**Endpoint**: `DELETE /api/properties/{id}`

**Authentication**: Required

**Authorization**: `ADMIN` only

**Path Parameters**:
- `id`: Property ID (Long)

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Xóa BDS thành công",
  "data": null
}
```

**Notes**:
- Xóa cả property và tất cả images liên quan
- Chỉ Admin mới có quyền xóa

---

### 2.6. Cập nhật trạng thái BĐS

**Endpoint**: `PATCH /api/properties/{id}/status`

**Authentication**: Required

**Authorization**: `ADMIN` only

**Path Parameters**:
- `id`: Property ID (Long)

**Query Parameters**:
- `status`: New status (String) - Required
  - Valid values: `pending`, `published`, `sold`, `rented`

**Example Request**:
```
PATCH /api/properties/1/status?status=published
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Cập nhật trạng thái BDS thành công",
  "data": {
    "propertyId": 1,
    "status": "published",
    ...
  }
}
```

**Error Response** (400 Bad Request):
```json
{
  "success": false,
  "message": "Trạng thái không hợp lệ. Chỉ chấp nhận: pending, published, sold, rented",
  "data": null
}
```

---

## 3. Appointment APIs

### 3.1. Lấy danh sách lịch hẹn

**Endpoint**: `GET /api/appointments`

**Authentication**: Required

**Authorization**: All authenticated users

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Success",
  "data": [
    {
      "appointmentId": 1,
      "propertyId": 1,
      "propertyTitle": "Căn hộ cao cấp Vinhomes",
      "customerId": 5,
      "customerName": "Nguyễn Văn A",
      "brokerId": 3,
      "brokerName": "Trần Thị B",
      "scheduledAt": "2026-05-15T14:00:00",
      "status": "pending",
      "note": "Khách hàng hẹn xem qua portal"
    }
  ]
}
```

**Authorization Rules**:
- **Customer**: Chỉ xem lịch hẹn của mình
- **Broker**: Xem lịch hẹn của khách hàng đặt với mình
- **Admin**: Xem tất cả lịch hẹn

---

### 3.2. Đặt lịch hẹn

**Endpoint**: `POST /api/appointments`

**Authentication**: Required

**Authorization**: `CUSTOMER` only

**Request Body**:
```json
{
  "propertyId": 1,
  "scheduledAt": "2026-05-15T14:00:00",
  "note": "Khách hàng hẹn xem qua portal"
}
```

**Validation**:
- `propertyId`: Required, must exist
- `scheduledAt`: Required, ISO 8601 format, must be future date
- `note`: Optional

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Đặt lịch thành công",
  "data": {
    "appointmentId": 1,
    "propertyId": 1,
    "propertyTitle": "Căn hộ cao cấp Vinhomes",
    "customerId": 5,
    "customerName": "Nguyễn Văn A",
    "brokerId": 3,
    "brokerName": "Trần Thị B",
    "scheduledAt": "2026-05-15T14:00:00",
    "status": "pending",
    "note": "Khách hàng hẹn xem qua portal"
  }
}
```

**Error Response** (400 Bad Request):
```json
{
  "success": false,
  "message": "Bất động sản này hiện chưa có broker phụ trách.",
  "data": null
}
```

**Notes**:
- Hệ thống tự động lấy broker từ `property.assignedTo`
- Nếu property chưa có broker → Báo lỗi
- Trạng thái mặc định: `pending`

---

### 3.3. Cập nhật lịch hẹn (Dời lịch / Xác nhận)

**Endpoint**: `PUT /api/appointments/{id}`

**Authentication**: Required

**Authorization**: Customer (owner), Broker (assigned), Admin

**Path Parameters**:
- `id`: Appointment ID (Long)

**Request Body**:
```json
{
  "scheduledAt": "2026-05-16T15:00:00",
  "status": "confirmed",
  "note": "Khách hàng dời lịch"
}
```

**Fields** (All optional):
- `scheduledAt`: New date/time (ISO 8601)
- `status`: New status (`pending`, `confirmed`, `rejected`, `cancelled`, `completed`)
- `note`: Updated note

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Cập nhật lịch thành công",
  "data": {
    "appointmentId": 1,
    "scheduledAt": "2026-05-16T15:00:00",
    "status": "pending",
    ...
  }
}
```

**Notes**:
- Nếu thay đổi `scheduledAt`, status tự động reset về `pending`
- Customer chỉ được dời lịch của mình
- Broker có thể xác nhận/từ chối lịch hẹn với khách của mình

---

### 3.4. Hủy lịch hẹn

**Endpoint**: `DELETE /api/appointments/{id}`

**Authentication**: Required

**Authorization**: Customer (owner), Broker (assigned), Admin

**Path Parameters**:
- `id`: Appointment ID (Long)

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Hủy lịch hẹn thành công",
  "data": null
}
```

**Notes**:
- Không xóa hẳn appointment, chỉ đổi status thành `cancelled`

---

## 4. Error Handling

### Standard Error Response Format
```json
{
  "success": false,
  "message": "Error message here",
  "data": null
}
```

### HTTP Status Codes

| Code | Meaning | When to use |
|------|---------|-------------|
| 200 | OK | Request thành công |
| 201 | Created | Tạo resource thành công |
| 400 | Bad Request | Dữ liệu không hợp lệ |
| 401 | Unauthorized | Chưa đăng nhập hoặc token không hợp lệ |
| 403 | Forbidden | Không có quyền truy cập |
| 404 | Not Found | Resource không tồn tại |
| 500 | Internal Server Error | Lỗi server |

---

## 5. Common Validation Errors

### Email already exists
```json
{
  "success": false,
  "message": "Email đã tồn tại",
  "data": null
}
```

### Invalid credentials
```json
{
  "success": false,
  "message": "Email hoặc mật khẩu không đúng",
  "data": null
}
```

### Unauthorized access
```json
{
  "success": false,
  "message": "Bạn không có quyền truy cập",
  "data": null
}
```

### Resource not found
```json
{
  "success": false,
  "message": "Không tìm thấy BDS với ID: 999",
  "data": null
}
```

### Validation failed
```json
{
  "success": false,
  "message": "Giá phải lớn hơn 0",
  "data": null
}
```

---

## 6. Testing với cURL

### Register
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "fullName": "Test User",
    "phone": "0123456789",
    "role": "customer"
  }'
```

### Login
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Get Properties (Public)
```bash
curl -X GET "http://localhost:8080/api/properties?page=0&size=10&status=published"
```

### Create Property (with JWT)
```bash
curl -X POST http://localhost:8080/api/properties \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Test Property",
    "description": "Test Description",
    "propertyType": "Căn hộ",
    "province": "Hà Nội",
    "district": "Quận Hoàn Kiếm",
    "area": 100,
    "price": 3000000000,
    "images": [
      {
        "url": "https://example.com/image.jpg",
        "isPrimary": true
      }
    ]
  }'
```

### Create Appointment
```bash
curl -X POST http://localhost:8080/api/appointments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "propertyId": 1,
    "scheduledAt": "2026-05-15T14:00:00",
    "note": "Test appointment"
  }'
```

---

## 7. Postman Collection

Bạn có thể import file `backend/API_TESTING.md` vào Postman để test API dễ dàng hơn.

---

**Cập nhật lần cuối**: 11/05/2026
