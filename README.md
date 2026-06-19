# Website đặt lịch chăm sóc da

Project đơn giản cho sinh viên mới bắt đầu.

## Công nghệ

- Frontend: React + Vite
- Backend: Java Spring Boot
- Database: SQLite file local
- Không dùng JWT
- Không dùng Spring Security
- Khách hàng cần đăng ký / đăng nhập bằng số điện thoại và mật khẩu

## Chạy backend

Mở terminal tại thư mục project:

```bash
cd backend
mvn spring-boot:run
```

Backend chạy tại:

```text
http://localhost:8080
```

Khi chạy lần đầu, database sẽ tự tạo tại:

```text
backend/data/booking_app.db
```

Dữ liệu mẫu:

- Admin: `admin` / `admin123`
- Một vài dịch vụ chăm sóc da
- Một vài khung giờ trống

## Chạy frontend

Mở terminal khác:

```bash
cd frontend
npm install
npm run dev
```

Frontend chạy tại:

```text
http://localhost:5173
```

## Mở database bằng SQLite Viewer trong VSCode

1. Cài extension `SQLite Viewer`
2. Chạy backend ít nhất 1 lần để tạo database
3. Mở file:

```text
backend/data/booking_app.db
```

4. Bạn sẽ thấy các bảng:

- admins
- customers
- services
- time_slots
- appointments

## API

Admin:

- `POST /api/admin/login`

Customers:

- `POST /api/customers/register`
- `POST /api/customers/login`

Services:

- `GET /api/services`

Time slots:

- `GET /api/time-slots/available`
- `GET /api/time-slots`
- `POST /api/time-slots`

Appointments:

- `POST /api/appointments`
- `GET /api/appointments` dành cho admin
- `GET /api/appointments/customer/{customerId}` dành cho khách hàng xem lịch sử của mình
- `PUT /api/appointments/{id}/status`

data customer
1.qwerty123
2.abcdefgh
