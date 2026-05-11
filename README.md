# 🏠 Hệ Thống Quản Lý Bất Động Sản

Hệ thống quản lý bất động sản toàn diện với các chức năng quản lý property, appointment, transaction, lead và commission.

## 📋 Mục lục

- [Tính năng](#-tính-năng)
- [Công nghệ sử dụng](#-công-nghệ-sử-dụng)
- [Cài đặt](#-cài-đặt)
- [Cấu trúc dự án](#-cấu-trúc-dự-án)
- [Tài liệu](#-tài-liệu)
- [Demo Accounts](#-demo-accounts)

## ✨ Tính năng

### 🔐 Authentication & Authorization
- Đăng ký/Đăng nhập với JWT
- Phân quyền theo role: Admin, Broker, Customer
- Session management

### 🏢 Quản lý Bất động sản (Property Management)
- ✅ Xem danh sách BĐS với phân trang và tìm kiếm
- ✅ Xem chi tiết BĐS
- ✅ Thêm BĐS mới (Admin/Broker)
- ✅ Cập nhật thông tin BĐS (Admin/Broker)
- ✅ Xóa BĐS (Admin only)
- ✅ Cập nhật trạng thái BĐS (Admin only)
- Upload và quản lý hình ảnh BĐS
- Gán broker phụ trách

### 📅 Quản lý Lịch hẹn (Appointment Management)
- ✅ Khách hàng đặt lịch hẹn xem BĐS
- ✅ Xem danh sách lịch hẹn theo role
- ✅ Dời lịch hẹn
- ✅ Hủy lịch hẹn
- ✅ Broker xác nhận/từ chối lịch hẹn
- Tự động gán broker từ property

### 💼 Quản lý Giao dịch (Transaction Management)
- Tạo giao dịch mua/bán/cho thuê
- Theo dõi thanh toán từng đợt
- Quản lý hợp đồng
- Tính toán hoa hồng tự động

### 👥 Quản lý Khách hàng tiềm năng (Lead Management)
- Thu thập lead từ website
- Gán lead cho broker
- Theo dõi trạng thái lead
- Chuyển đổi lead thành customer

### 💰 Quản lý Hoa hồng (Commission Management)
- Tính toán hoa hồng tự động
- Theo dõi hoa hồng theo broker
- Báo cáo doanh thu

### 📊 Dashboard & Reports
- Dashboard theo role (Admin/Broker/Customer)
- Thống kê BĐS, giao dịch, doanh thu
- Biểu đồ trực quan

## 🛠 Công nghệ sử dụng

### Backend
- **Framework**: Spring Boot 3.x
- **Language**: Java 17
- **Security**: Spring Security + JWT
- **Database**: PostgreSQL
- **ORM**: Spring Data JPA
- **Build Tool**: Maven
- **Validation**: Jakarta Validation

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Routing**: React Router v6
- **State Management**: Context API
- **HTTP Client**: Axios
- **UI Framework**: Tailwind CSS
- **Icons**: Lucide React

### Database
- **RDBMS**: PostgreSQL 14+
- **Schema**: See `backend/sql/index.sql`

## 🚀 Cài đặt

### Prerequisites
- Java 17+
- Node.js 18+
- PostgreSQL 14+
- Maven 3.8+

### 1. Clone repository
```bash
git clone <repository-url>
cd real-estate-management
```

### 2. Setup Database

```bash
# Tạo database
createdb real_estate_db

# Import schema
psql -U postgres -d real_estate_db -f backend/sql/index.sql

# Import sample data (optional)
psql -U postgres -d real_estate_db -f backend/sql/sample_data.sql
```

### 3. Setup Backend

```bash
cd backend

# Cấu hình database trong application.properties
# backend/src/main/resources/application.properties

# Build và chạy
mvn clean install
mvn spring-boot:run
```

Backend sẽ chạy tại: `http://localhost:8080`

### 4. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Chạy development server
npm run dev
```

Frontend sẽ chạy tại: `http://localhost:5173`

## 📁 Cấu trúc dự án

```
real-estate-management/
├── backend/                    # Spring Boot Backend
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/realestate/management/
│   │   │   │   ├── config/           # Security, CORS config
│   │   │   │   ├── controller/       # REST Controllers
│   │   │   │   ├── dto/              # Data Transfer Objects
│   │   │   │   ├── entity/           # JPA Entities
│   │   │   │   ├── repository/       # JPA Repositories
│   │   │   │   ├── security/         # JWT, UserDetails
│   │   │   │   ├── service/          # Business Logic
│   │   │   │   └── exception/        # Exception Handlers
│   │   │   └── resources/
│   │   │       └── application.properties
│   │   └── test/
│   ├── sql/
│   │   ├── index.sql              # Database schema
│   │   └── sample_data.sql        # Sample data
│   ├── pom.xml
│   └── README.md
│
├── frontend/                   # React Frontend
│   ├── src/
│   │   ├── assets/              # Images, icons
│   │   ├── components/          # Reusable components
│   │   ├── context/             # React Context (Auth, Favorites)
│   │   ├── layouts/             # Layout components
│   │   ├── pages/               # Page components
│   │   │   ├── admin/           # Admin pages
│   │   │   ├── broker/          # Broker pages
│   │   │   ├── customer/        # Customer pages
│   │   │   └── public/          # Public pages
│   │   ├── services/            # API services
│   │   ├── utils/               # Utility functions
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── WORKFLOW.md                 # Tài liệu luồng hoạt động
├── API_DOCUMENTATION.md        # Tài liệu API chi tiết
└── README.md                   # File này
```

## 📚 Tài liệu

### Tài liệu chi tiết
- [WORKFLOW.md](./WORKFLOW.md) - Luồng hoạt động của hệ thống
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - Tài liệu API đầy đủ
- [backend/README.md](./backend/README.md) - Hướng dẫn Backend
- [backend/API_TESTING.md](./backend/API_TESTING.md) - Hướng dẫn test API

### Quick Links
- Backend API: `http://localhost:8080/api`
- Frontend: `http://localhost:5173`
- Database: `postgresql://localhost:5432/real_estate_db`

## 👤 Demo Accounts

### Admin Account
```
Email: admin@realestate.com
Password: admin123
Role: Admin
```

### Broker Account
```
Email: broker@realestate.com
Password: broker123
Role: Broker
```

### Customer Account
```
Email: customer@realestate.com
Password: customer123
Role: Customer
```

## 🔑 API Endpoints Overview

### Authentication
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập

### Properties
- `GET /api/properties` - Danh sách BĐS (Public)
- `GET /api/properties/{id}` - Chi tiết BĐS (Public)
- `POST /api/properties` - Tạo BĐS (Admin/Broker)
- `PUT /api/properties/{id}` - Cập nhật BĐS (Admin/Broker)
- `DELETE /api/properties/{id}` - Xóa BĐS (Admin)
- `PATCH /api/properties/{id}/status` - Cập nhật trạng thái (Admin)

### Appointments
- `GET /api/appointments` - Danh sách lịch hẹn
- `POST /api/appointments` - Đặt lịch hẹn (Customer)
- `PUT /api/appointments/{id}` - Cập nhật lịch hẹn
- `DELETE /api/appointments/{id}` - Hủy lịch hẹn

Xem chi tiết tại [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

## 🧪 Testing

### Backend Testing
```bash
cd backend
mvn test
```

### API Testing với cURL
Xem file [backend/API_TESTING.md](./backend/API_TESTING.md)

### Frontend Testing
```bash
cd frontend
npm run test
```

## 🐛 Troubleshooting

### Backend không khởi động được
- Kiểm tra PostgreSQL đã chạy chưa
- Kiểm tra cấu hình database trong `application.properties`
- Kiểm tra port 8080 có bị chiếm không

### Frontend không kết nối được Backend
- Kiểm tra Backend đã chạy tại `http://localhost:8080`
- Kiểm tra CORS configuration trong `SecurityConfig.java`
- Kiểm tra baseURL trong `frontend/src/services/api.js`

### Database connection error
```bash
# Kiểm tra PostgreSQL service
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql
```

## 📝 Changelog

### Version 1.0.0 (11/05/2026)
- ✅ Hoàn thiện chức năng CRUD Property
- ✅ Hoàn thiện chức năng Appointment
- ✅ Thêm chức năng xóa Property (Admin)
- ✅ Thêm chức năng cập nhật trạng thái Property
- ✅ Sửa lỗi hủy lịch hẹn
- ✅ Thêm tài liệu WORKFLOW.md
- ✅ Thêm tài liệu API_DOCUMENTATION.md

### Upcoming Features
- [ ] Transaction Management
- [ ] Lead Management
- [ ] Commission Calculation
- [ ] Advanced Search & Filters
- [ ] Email Notifications
- [ ] File Upload for Images
- [ ] Export Reports (PDF/Excel)

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Team

- **Backend Developer**: [Your Name]
- **Frontend Developer**: [Your Name]
- **Database Designer**: [Your Name]

## 📞 Contact

- Email: support@realestate.com
- Website: https://realestate.com
- GitHub: https://github.com/yourusername/real-estate-management

---

**Made with ❤️ by Real Estate Team**
