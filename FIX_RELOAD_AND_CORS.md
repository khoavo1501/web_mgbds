# Sửa Lỗi Reload và CORS PATCH

## Ngày: 11/05/2026

---

## Các lỗi đã sửa

### 1. ✅ CORS reject PATCH method

**Lỗi**: 
```
Reject: HTTP 'PATCH' is not allowed
```

**Nguyên nhân**: 
- CORS configuration chỉ cho phép: GET, POST, PUT, DELETE, OPTIONS
- Không có PATCH trong danh sách

**Giải pháp**:

**File**: `backend/src/main/java/com/realestate/management/config/SecurityConfig.java`

```java
// ❌ SAI - Code cũ
configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));

// ✅ ĐÚNG - Code mới
configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
```

**Kết quả**: 
- API `PATCH /api/properties/{id}/status` giờ hoạt động
- Admin có thể duyệt/từ chối BĐS

---

### 2. ✅ Reload trang bị logout

**Vấn đề**: 
- Đăng nhập Admin → Vào /admin/dashboard
- Reload (F5) → Bị redirect về /auth

**Nguyên nhân**:
- AuthContext load user từ localStorage bất đồng bộ
- ProtectedRoute check `user` trước khi AuthContext load xong
- `user` = null → Redirect về /auth

**Giải pháp**:

#### A. Thêm loading state vào AuthContext

**File**: `frontend/src/context/AuthContext.jsx`

```javascript
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // ← Thêm loading state

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log('Restored user from localStorage:', parsedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('user');
      }
    }
    setLoading(false); // ← Đánh dấu đã load xong
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
```

#### B. ProtectedRoute chờ loading

**File**: `frontend/src/components/ProtectedRoute.jsx`

```javascript
export default function ProtectedRoute({ allowedRoles }) {
  const { user, loading } = useAuth();

  // ✅ Đợi load user từ localStorage
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  // Sau khi load xong mới check user
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
```

---

## Luồng hoạt động mới

### Trước khi sửa (BUG)

```
1. User reload trang
2. React render ProtectedRoute
3. ProtectedRoute check: user = null (chưa load từ localStorage)
4. Redirect to /auth ❌
5. AuthContext load user từ localStorage (quá muộn)
```

### Sau khi sửa (FIXED)

```
1. User reload trang
2. React render ProtectedRoute
3. ProtectedRoute check: loading = true
4. Hiển thị spinner, chờ AuthContext load
5. AuthContext load user từ localStorage
6. AuthContext set loading = false
7. ProtectedRoute check lại: user = {...}
8. Cho phép truy cập ✅
```

---

## Debug logs

Để debug, tôi đã thêm console.log:

### AuthContext
```javascript
console.log('Restored user from localStorage:', parsedUser);
```

### ProtectedRoute
```javascript
console.log('ProtectedRoute - loading:', loading, 'user:', user, 'allowedRoles:', allowedRoles);
console.log('ProtectedRoute - No user, redirecting to /auth');
console.log('ProtectedRoute - Role mismatch, user.role:', user.role, 'allowedRoles:', allowedRoles);
console.log('ProtectedRoute - Access granted');
```

**Cách xem logs**:
1. Mở Chrome DevTools (F12)
2. Tab Console
3. Reload trang
4. Xem logs để debug

---

## Test Cases

### Test 1: Reload không bị logout

**Steps**:
1. Đăng nhập với tài khoản Admin
   ```
   Email: admin@realestate.com
   Password: admin123
   ```
2. Vào trang `/admin/dashboard`
3. Reload trang (F5)

**Expected**:
- ✅ Hiển thị spinner ngắn (loading)
- ✅ Vẫn ở trang `/admin/dashboard`
- ✅ Không redirect về `/auth`

**Console logs**:
```
Restored user from localStorage: {token: "...", userId: 1, email: "admin@...", role: "admin"}
ProtectedRoute - loading: false user: {...} allowedRoles: ['admin']
ProtectedRoute - Access granted
```

---

### Test 2: PATCH request hoạt động

**Steps**:
1. Đăng nhập Admin
2. Vào trang `/admin/approval`
3. Click "Duyệt BĐS" trên một BĐS pending

**Expected**:
- ✅ Request thành công
- ✅ BĐS chuyển sang "published"
- ✅ Không có lỗi CORS

**Network tab**:
```
Request URL: http://localhost:8080/api/properties/1/status?status=published
Request Method: PATCH
Status Code: 200 OK
```

**Backend logs**:
```
✅ Không còn: "Reject: HTTP 'PATCH' is not allowed"
```

---

### Test 3: Logout và login lại

**Steps**:
1. Đăng nhập Admin
2. Click "Logout"
3. Đăng nhập lại

**Expected**:
- ✅ Logout xóa user khỏi localStorage
- ✅ Login lưu user mới vào localStorage
- ✅ Redirect đúng dashboard theo role

---

## Files đã thay đổi

### Backend
1. `backend/src/main/java/com/realestate/management/config/SecurityConfig.java`
   - Thêm "PATCH" vào allowedMethods

### Frontend
1. `frontend/src/context/AuthContext.jsx`
   - Thêm `loading` state
   - Thêm console.log để debug
   - Try-catch khi parse JSON

2. `frontend/src/components/ProtectedRoute.jsx`
   - Check `loading` trước khi check `user`
   - Hiển thị spinner khi loading
   - Thêm console.log để debug

---

## Lưu ý quan trọng

### 1. Loading State Pattern

Khi làm việc với async data (localStorage, API), luôn cần loading state:

```javascript
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true); // ← Quan trọng!

useEffect(() => {
  // Load data
  const loadData = async () => {
    const result = await fetchData();
    setData(result);
    setLoading(false); // ← Đánh dấu xong
  };
  loadData();
}, []);

// Component check loading trước
if (loading) return <Spinner />;
if (!data) return <Error />;
return <Content data={data} />;
```

### 2. localStorage Best Practices

```javascript
// ✅ ĐÚNG - Try-catch khi parse
try {
  const user = JSON.parse(localStorage.getItem('user'));
  setUser(user);
} catch (error) {
  console.error('Parse error:', error);
  localStorage.removeItem('user'); // Xóa data lỗi
}

// ❌ SAI - Không try-catch
const user = JSON.parse(localStorage.getItem('user')); // Có thể crash
```

### 3. CORS Configuration

Khi thêm HTTP method mới, nhớ update CORS:

```java
// Backend
configuration.setAllowedMethods(Arrays.asList(
  "GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"
));

// Frontend - Axios tự động gửi OPTIONS preflight
// Không cần config gì thêm
```

---

## Nếu vẫn còn lỗi

### Lỗi: Vẫn bị logout khi reload

**Debug steps**:
1. Mở Console (F12)
2. Reload trang
3. Xem logs:
   - Có log "Restored user from localStorage" không?
   - `user` object có đúng không?
   - `user.role` có match với `allowedRoles` không?

**Possible issues**:
- localStorage bị xóa → Check Application tab
- Role không match → Check case sensitivity (admin vs Admin)
- Token expired → Check JWT expiration

### Lỗi: PATCH vẫn bị reject

**Debug steps**:
1. Restart backend server
2. Clear browser cache
3. Check Network tab:
   - Có OPTIONS preflight request không?
   - Response headers có `Access-Control-Allow-Methods` không?

**Possible issues**:
- Backend chưa restart
- Browser cache cũ
- Proxy/firewall block PATCH

---

## Checklist

- [x] Thêm PATCH vào CORS allowedMethods
- [x] Thêm loading state vào AuthContext
- [x] ProtectedRoute check loading trước user
- [x] Thêm console.log để debug
- [x] Test reload không bị logout
- [x] Test PATCH request hoạt động
- [x] Tài liệu hóa

---

**Cập nhật lần cuối**: 11/05/2026

**Lưu ý**: Nhớ restart backend server sau khi sửa SecurityConfig!
