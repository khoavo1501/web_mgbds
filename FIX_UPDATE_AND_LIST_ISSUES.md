# Sửa Lỗi Cập Nhật và Hiển Thị BĐS

## Ngày: 11/05/2026

## Các Lỗi Đã Sửa

### 1. ❌ Lỗi: "a collection with cascade='all-delete-orphan' was no longer referenced"

**Nguyên nhân**: 
- Khi update property, code cũ xóa images bằng `propertyImageRepository.deleteAll()` rồi gán list mới `savedProperty.setImages(images)`
- Điều này vi phạm quy tắc của Hibernate với `orphanRemoval = true`
- Hibernate yêu cầu phải thao tác trực tiếp trên collection, không được gán collection mới

**Giải pháp**:
```java
// ❌ SAI - Code cũ
propertyImageRepository.deleteAll(property.getImages());
property.getImages().clear();
List<PropertyImage> images = new ArrayList<>();
// ... thêm images mới
propertyImageRepository.saveAll(images);
savedProperty.setImages(images); // ← Lỗi ở đây!

// ✅ ĐÚNG - Code mới
if (property.getImages() != null) {
    property.getImages().clear(); // Xóa trong collection
} else {
    property.setImages(new ArrayList<>());
}

// Thêm trực tiếp vào collection
for (PropertyCreateRequest.ImageRequest imgReq : request.getImages()) {
    PropertyImage image = new PropertyImage();
    image.setUrl(imgReq.getUrl());
    image.setIsPrimary(imgReq.getIsPrimary());
    image.setProperty(property);
    property.getImages().add(image); // ← Thêm vào collection hiện tại
}

// Cascade sẽ tự động lưu images
Property savedProperty = propertyRepository.save(property);
```

**File đã sửa**: `backend/src/main/java/com/realestate/management/service/PropertyService.java`

---

### 2. ❌ Lỗi: Thêm BĐS thành công nhưng không hiển thị trong danh sách

**Nguyên nhân**:
1. BĐS mới tạo có status = "pending" (mặc định)
2. Backend API `GET /properties` không có filter → Chỉ trả về BĐS có status = "published"
3. Admin/Broker cần xem TẤT CẢ BĐS (bao gồm pending, published, sold, rented)

**Giải pháp**:

#### Backend - PropertyService.java
```java
// ✅ Thêm logic: Nếu user đã đăng nhập → Lấy tất cả BĐS
// Nếu public user → Chỉ lấy published

try {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    if (authentication != null && authentication.isAuthenticated() 
        && !authentication.getPrincipal().equals("anonymousUser")) {
        // User đã đăng nhập (Admin/Broker/Customer) → Lấy tất cả
        propertyPage = propertyRepository.findAll(pageable);
    } else {
        // Public user → Chỉ lấy published
        propertyPage = propertyRepository.findByStatus("published", pageable);
    }
} catch (Exception e) {
    propertyPage = propertyRepository.findByStatus("published", pageable);
}
```

#### Frontend - PropertyManagement.jsx & BrokerProperties.jsx
```javascript
// ✅ Thêm size=100 để lấy nhiều BĐS hơn (mặc định là 10)
const response = await api.get('/properties?size=100');
```

#### Frontend - Reset form sau khi submit
```javascript
// ✅ Reset form và editingId sau khi thêm/sửa thành công
setIsModalOpen(false);
setEditingId(null);
setFormData({ 
  title: "", 
  description: "", 
  propertyType: "Căn hộ", 
  province: "Hà Nội", 
  district: "Quận Hoàn Kiếm", 
  area: "", 
  price: "", 
  images: [{ url: "...", isPrimary: true }] 
});
fetchProperties(); // Refresh danh sách
```

**Files đã sửa**:
- `backend/src/main/java/com/realestate/management/service/PropertyService.java`
- `frontend/src/pages/admin/PropertyManagement.jsx`
- `frontend/src/pages/broker/BrokerProperties.jsx`

---

## Chi Tiết Thay Đổi

### Backend Changes

**File**: `backend/src/main/java/com/realestate/management/service/PropertyService.java`

#### 1. Method `updateProperty()` - Sửa lỗi cascade

**Trước**:
```java
Property savedProperty = propertyRepository.save(property);

if (request.getImages() != null && !request.getImages().isEmpty()) {
    propertyImageRepository.deleteAll(property.getImages());
    property.getImages().clear();
    
    List<PropertyImage> images = new ArrayList<>();
    for (PropertyCreateRequest.ImageRequest imgReq : request.getImages()) {
        PropertyImage image = new PropertyImage();
        image.setUrl(imgReq.getUrl());
        image.setIsPrimary(imgReq.getIsPrimary());
        image.setProperty(savedProperty);
        images.add(image);
    }
    propertyImageRepository.saveAll(images);
    savedProperty.setImages(images); // ← LỖI
}
```

**Sau**:
```java
// Xử lý images - Xóa ảnh cũ và thêm ảnh mới
if (request.getImages() != null && !request.getImages().isEmpty()) {
    // Xóa tất cả ảnh cũ bằng cách clear collection
    // orphanRemoval = true sẽ tự động xóa các entity bị remove khỏi collection
    if (property.getImages() != null) {
        property.getImages().clear();
    } else {
        property.setImages(new ArrayList<>());
    }
    
    // Thêm ảnh mới vào collection
    for (PropertyCreateRequest.ImageRequest imgReq : request.getImages()) {
        PropertyImage image = new PropertyImage();
        image.setUrl(imgReq.getUrl());
        image.setIsPrimary(imgReq.getIsPrimary());
        image.setProperty(property);
        property.getImages().add(image); // ← Thêm vào collection
    }
}

// Lưu property (cascade sẽ tự động lưu images)
Property savedProperty = propertyRepository.save(property);
```

#### 2. Method `getProperties()` - Sửa logic lấy danh sách

**Trước**:
```java
// Mặc định lấy tất cả BDS published
else {
    propertyPage = propertyRepository.findByStatus("published", pageable);
}
```

**Sau**:
```java
// Mặc định: Nếu không có filter gì, lấy tất cả (cho Admin) hoặc chỉ published (cho public)
else {
    // Kiểm tra xem có authenticated user không
    try {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated() 
            && !authentication.getPrincipal().equals("anonymousUser")) {
            // User đã đăng nhập → Lấy tất cả BĐS
            propertyPage = propertyRepository.findAll(pageable);
        } else {
            // Public user → Chỉ lấy published
            propertyPage = propertyRepository.findByStatus("published", pageable);
        }
    } catch (Exception e) {
        // Nếu có lỗi, mặc định lấy published
        propertyPage = propertyRepository.findByStatus("published", pageable);
    }
}
```

---

### Frontend Changes

#### 1. PropertyManagement.jsx (Admin)

**Thay đổi 1**: Fetch tất cả BĐS
```javascript
// Trước
const response = await api.get('/properties');

// Sau
const response = await api.get('/properties?size=100');
```

**Thay đổi 2**: Reset form sau submit
```javascript
// Trước
setIsModalOpen(false);
fetchProperties();

// Sau
setIsModalOpen(false);
setEditingId(null);
setFormData({ 
  title: "", 
  description: "", 
  propertyType: "Căn hộ", 
  province: "Hà Nội", 
  district: "Quận Hoàn Kiếm", 
  area: "", 
  price: "", 
  images: [{ url: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=800", isPrimary: true }] 
});
fetchProperties();
```

#### 2. BrokerProperties.jsx

Tương tự như PropertyManagement.jsx

---

## Cách Test

### Test 1: Cập nhật BĐS

1. Đăng nhập với tài khoản Admin hoặc Broker
2. Vào trang quản lý BĐS
3. Click "Edit" trên một BĐS
4. Thay đổi thông tin (title, description, price, etc.)
5. Click "Lưu thông tin"
6. ✅ Kết quả mong đợi: Cập nhật thành công, không có lỗi cascade

### Test 2: Thêm BĐS mới

1. Đăng nhập với tài khoản Admin hoặc Broker
2. Vào trang quản lý BĐS
3. Click "Thêm BĐS"
4. Điền đầy đủ thông tin
5. Click "Lưu thông tin"
6. ✅ Kết quả mong đợi: 
   - Hiển thị "Thêm thành công!"
   - BĐS mới xuất hiện trong danh sách với status "pending"
   - Form được reset về trạng thái ban đầu

### Test 3: Xem danh sách BĐS

**Admin/Broker (đã đăng nhập)**:
```bash
curl -X GET "http://localhost:8080/api/properties" \
  -H "Authorization: Bearer YOUR_TOKEN"
```
✅ Kết quả: Trả về TẤT CẢ BĐS (pending, published, sold, rented)

**Public user (chưa đăng nhập)**:
```bash
curl -X GET "http://localhost:8080/api/properties"
```
✅ Kết quả: Chỉ trả về BĐS có status "published"

---

## Lưu Ý Quan Trọng

### 1. Hibernate Cascade và OrphanRemoval

Khi sử dụng `cascade = CascadeType.ALL, orphanRemoval = true`:

✅ **ĐÚNG**:
```java
// Xóa bằng cách clear collection
property.getImages().clear();

// Thêm bằng cách add vào collection
property.getImages().add(newImage);
```

❌ **SAI**:
```java
// Không được gán collection mới
property.setImages(newImageList);
```

### 2. Status của BĐS

- **pending**: BĐS mới tạo, chờ duyệt
- **published**: BĐS đã được duyệt, hiển thị công khai
- **sold**: BĐS đã bán
- **rented**: BĐS đã cho thuê

Admin cần thấy tất cả status để quản lý.

### 3. Phân quyền xem BĐS

| User Type | Xem được gì |
|-----------|-------------|
| Public (chưa đăng nhập) | Chỉ BĐS "published" |
| Customer (đã đăng nhập) | Tất cả BĐS |
| Broker (đã đăng nhập) | Tất cả BĐS |
| Admin (đã đăng nhập) | Tất cả BĐS |

---

## Checklist

- [x] Sửa lỗi cascade khi update property
- [x] Sửa logic lấy danh sách BĐS theo authentication
- [x] Frontend fetch với size=100
- [x] Reset form sau khi submit thành công
- [x] Test update property - Không lỗi
- [x] Test thêm property - Hiển thị trong danh sách
- [x] Tài liệu hóa các thay đổi

---

## Kết Luận

Tất cả các lỗi đã được sửa:
1. ✅ Lỗi cascade khi cập nhật BĐS → Đã sửa bằng cách thao tác trực tiếp trên collection
2. ✅ BĐS mới không hiển thị → Đã sửa bằng cách cho phép user đã đăng nhập xem tất cả BĐS

Hệ thống đã sẵn sàng để test và sử dụng!

---

**Cập nhật lần cuối**: 11/05/2026
