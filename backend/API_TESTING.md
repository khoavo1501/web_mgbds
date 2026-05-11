# Hướng dẫn Test API

## Base URL
```
http://localhost:8080/api
```

## 1. Authentication APIs

### 1.1. Đăng ký User mới
**Endpoint:** `POST /api/auth/register`

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "123456",
  "fullName": "Admin User",
  "phone": "0123456789",
  "role": "admin"
}
```

**Response Success (201):**
```json
{
  "success": true,
  "message": "Đăng ký thành công",
  "data": {
    "userId": 1,
    "email": "admin@example.com",
    "fullName": "Admin User",
    "phone": "0123456789",
    "role": "admin",
    "isActive": true,
    "createdAt": "2024-01-01T10:00:00"
  },
  "timestamp": "2024-01-01T10:00:00"
}
```

### 1.2. Đăng nhập
**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "123456"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "type": "Bearer",
    "userId": 1,
    "email": "admin@example.com",
    "fullName": "Admin User",
    "role": "admin"
  },
  "timestamp": "2024-01-01T10:00:00"
}
```

**Lưu token để sử dụng cho các API khác!**

---

## 2. Property APIs

### 2.1. Lấy danh sách BDS (Public - Không cần token)
**Endpoint:** `GET /api/properties`

**Query Parameters:**
- `page` (optional): Số trang (default: 0)
- `size` (optional): Số items/trang (default: 10)
- `sortBy` (optional): Sắp xếp theo field (default: createdAt)
- `sortDirection` (optional): ASC hoặc DESC (default: DESC)
- `status` (optional): pending, published, sold
- `propertyType` (optional): apartment, house, land, villa
- `province` (optional): Tỉnh/Thành phố
- `district` (optional): Quận/Huyện
- `minPrice` (optional): Giá tối thiểu
- `maxPrice` (optional): Giá tối đa
- `minArea` (optional): Diện tích tối thiểu
- `maxArea` (optional): Diện tích tối đa
- `keyword` (optional): Tìm kiếm theo title/description

**Example:**
```
GET /api/properties?page=0&size=10&status=published
GET /api/properties?province=Hà Nội&minPrice=1000000000&maxPrice=5000000000
GET /api/properties?keyword=căn hộ cao cấp
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Lấy danh sách BDS thành công",
  "data": {
    "content": [
      {
        "propertyId": 1,
        "propertyCode": "BDS-2024-0001",
        "title": "Căn hộ cao cấp 2PN",
        "description": "Căn hộ đẹp, view đẹp",
        "propertyType": "apartment",
        "status": "published",
        "province": "Hà Nội",
        "district": "Cầu Giấy",
        "area": 75.5,
        "price": 3500000000,
        "createdAt": "2024-01-01T10:00:00",
        "createdBy": {
          "userId": 1,
          "fullName": "Admin User",
          "email": "admin@example.com",
          "phone": "0123456789"
        },
        "assignedTo": null,
        "images": [
          {
            "imageId": 1,
            "url": "https://example.com/image1.jpg",
            "isPrimary": true
          }
        ]
      }
    ],
    "pageable": {
      "pageNumber": 0,
      "pageSize": 10
    },
    "totalElements": 1,
    "totalPages": 1,
    "last": true
  },
  "timestamp": "2024-01-01T10:00:00"
}
```

### 2.2. Lấy chi tiết 1 BDS (Public - Không cần token)
**Endpoint:** `GET /api/properties/{id}`

**Example:**
```
GET /api/properties/1
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Lấy chi tiết BDS thành công",
  "data": {
    "propertyId": 1,
    "propertyCode": "BDS-2024-0001",
    "title": "Căn hộ cao cấp 2PN",
    "description": "Căn hộ đẹp, view đẹp, nội thất đầy đủ",
    "propertyType": "apartment",
    "status": "published",
    "province": "Hà Nội",
    "district": "Cầu Giấy",
    "area": 75.5,
    "price": 3500000000,
    "createdAt": "2024-01-01T10:00:00",
    "createdBy": {
      "userId": 1,
      "fullName": "Admin User",
      "email": "admin@example.com",
      "phone": "0123456789"
    },
    "assignedTo": null,
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
  },
  "timestamp": "2024-01-01T10:00:00"
}
```

**Response Error (404):**
```json
{
  "success": false,
  "message": "Không tìm thấy BDS với ID: 999",
  "data": null,
  "timestamp": "2024-01-01T10:00:00"
}
```

### 2.3. Tạo mới BDS (Cần token - Admin/Broker)
**Endpoint:** `POST /api/properties`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Căn hộ cao cấp 2PN tại Cầu Giấy",
  "description": "Căn hộ đẹp, view đẹp, nội thất đầy đủ, gần trường học",
  "propertyType": "apartment",
  "province": "Hà Nội",
  "district": "Cầu Giấy",
  "area": 75.5,
  "price": 3500000000,
  "assignedToId": 2,
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

**Response Success (201):**
```json
{
  "success": true,
  "message": "Tạo BDS thành công",
  "data": {
    "propertyId": 1,
    "propertyCode": "BDS-2024-0001",
    "title": "Căn hộ cao cấp 2PN tại Cầu Giấy",
    "status": "pending",
    ...
  },
  "timestamp": "2024-01-01T10:00:00"
}
```

**Response Error (401 - Không có token):**
```json
{
  "success": false,
  "message": "Unauthorized",
  "data": null,
  "timestamp": "2024-01-01T10:00:00"
}
```

**Response Error (403 - Không có quyền):**
```json
{
  "success": false,
  "message": "Bạn không có quyền truy cập tài nguyên này",
  "data": null,
  "timestamp": "2024-01-01T10:00:00"
}
```

**Response Error (400 - Validation):**
```json
{
  "success": false,
  "message": "Lỗi validation",
  "data": {
    "title": "Tiêu đề không được để trống",
    "price": "Giá phải lớn hơn 0"
  },
  "timestamp": "2024-01-01T10:00:00"
}
```

---

## 3. Test Flow với Postman/Thunder Client

### Bước 1: Đăng ký users
```bash
# 1. Đăng ký Admin
POST /api/auth/register
{
  "email": "admin@example.com",
  "password": "123456",
  "fullName": "Admin User",
  "phone": "0123456789",
  "role": "admin"
}

# 2. Đăng ký Broker
POST /api/auth/register
{
  "email": "broker@example.com",
  "password": "123456",
  "fullName": "Broker User",
  "phone": "0987654321",
  "role": "broker"
}

# 3. Đăng ký Customer
POST /api/auth/register
{
  "email": "customer@example.com",
  "password": "123456",
  "fullName": "Customer User",
  "phone": "0111222333",
  "role": "customer"
}
```

### Bước 2: Đăng nhập và lấy token
```bash
POST /api/auth/login
{
  "email": "admin@example.com",
  "password": "123456"
}

# Copy token từ response
```

### Bước 3: Tạo BDS (với token Admin/Broker)
```bash
POST /api/properties
Headers: Authorization: Bearer {token}
{
  "title": "Căn hộ cao cấp 2PN",
  "description": "Căn hộ đẹp",
  "propertyType": "apartment",
  "province": "Hà Nội",
  "district": "Cầu Giấy",
  "area": 75.5,
  "price": 3500000000,
  "images": [
    {
      "url": "https://picsum.photos/800/600",
      "isPrimary": true
    }
  ]
}
```

### Bước 4: Lấy danh sách BDS (không cần token)
```bash
GET /api/properties?page=0&size=10
```

### Bước 5: Lấy chi tiết BDS (không cần token)
```bash
GET /api/properties/1
```

---

## 4. Roles và Permissions

| Endpoint | Public | Customer | Broker | Admin |
|----------|--------|----------|--------|-------|
| GET /api/properties | ✅ | ✅ | ✅ | ✅ |
| GET /api/properties/{id} | ✅ | ✅ | ✅ | ✅ |
| POST /api/properties | ❌ | ❌ | ✅ | ✅ |
| PUT /api/properties/{id} | ❌ | ❌ | ✅ | ✅ |
| DELETE /api/properties/{id} | ❌ | ❌ | ❌ | ✅ |

---

## 5. Lưu ý

1. **JWT Token**: Token có thời gian hết hạn (default: 24h). Sau khi hết hạn cần đăng nhập lại.

2. **Pagination**: Mặc định page=0, size=10. Có thể thay đổi theo nhu cầu.

3. **Status của Property**:
   - `pending`: Chờ duyệt (mặc định khi tạo mới)
   - `published`: Đã duyệt, hiển thị công khai
   - `sold`: Đã bán

4. **Property Type**:
   - `apartment`: Căn hộ
   - `house`: Nhà riêng
   - `land`: Đất
   - `villa`: Biệt thự

5. **Validation**: Tất cả các trường bắt buộc đều được validate. Nếu thiếu hoặc sai format sẽ trả về lỗi 400.

---

## 6. Troubleshooting

### Lỗi 401 Unauthorized
- Kiểm tra token có đúng không
- Kiểm tra header Authorization: Bearer {token}
- Token có thể đã hết hạn, cần đăng nhập lại

### Lỗi 403 Forbidden
- User không có quyền truy cập endpoint này
- Kiểm tra role của user (admin, broker, customer)

### Lỗi 400 Bad Request
- Kiểm tra request body có đúng format không
- Kiểm tra validation errors trong response

### Lỗi 500 Internal Server Error
- Kiểm tra database có chạy không
- Kiểm tra logs trong console
