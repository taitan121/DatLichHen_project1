import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:8080/api";
const BOOKING_TIMES = [
  { startTime: "09:00", endTime: "10:00" },
  { startTime: "10:30", endTime: "11:30" },
  { startTime: "14:00", endTime: "15:00" },
  { startTime: "15:30", endTime: "16:30" },
];
const HOME_SERVICE_STEPS = [
  {
    title: "Soi da & tư vấn",
    text: "Kỹ thuật viên kiểm tra tình trạng da, lắng nghe nhu cầu và gợi ý liệu trình phù hợp.",
    image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Làm sạch chuyên sâu",
    text: "Da được làm sạch nhẹ nhàng, hỗ trợ thông thoáng lỗ chân lông trước khi chăm sóc chuyên sâu.",
    image: "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Phục hồi & dưỡng da",
    text: "Hoàn thiện bằng bước cấp ẩm, phục hồi và hướng dẫn cách chăm sóc da tại nhà.",
    image: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=900&q=80",
  },
];
const PARTNER_LOGOS = ["COCOON", "GARNIER", "L'ORÉAL", "LA ROCHE-POSAY", "BIODERMA", "CETAPHIL"];
const PAGE_PATHS = {
  home: "/",
  services: "/services",
  booking: "/booking",
  customerLogin: "/login",
  customerRegister: "/register",
  history: "/history",
  adminLogin: "/admin-login",
  admin: "/dashboard",
};
const PATH_PAGES = Object.entries(PAGE_PATHS).reduce((pages, [pageName, path]) => {
  pages[path] = pageName;
  return pages;
}, {});

function getPageFromLocation() {
  return PATH_PAGES[window.location.pathname] || "home";
}

function normalizeTime(time) {
  return String(time || "").slice(0, 5);
}

function mergeTimeSlots(slots) {
  const byTime = new Map();

  slots.forEach((slot) => {
    const key = `${slot.slotDate}-${normalizeTime(slot.startTime)}`;
    const existing = byTime.get(key);
    if (!existing) {
      byTime.set(key, { ...slot, startTime: normalizeTime(slot.startTime), endTime: normalizeTime(slot.endTime) });
      return;
    }

    byTime.set(key, {
      ...existing,
      available: Boolean(existing.available && slot.available),
    });
  });

  return Array.from(byTime.values());
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.message || "Không thể kết nối backend");
  }

  return data;
}

function App() {
  const [page, setPageState] = useState(getPageFromLocation);
  const [admin, setAdmin] = useState(() => localStorage.getItem("admin"));
  const [adminPassword, setAdminPassword] = useState(() => localStorage.getItem("adminPassword"));
  const [customerPassword, setCustomerPassword] = useState(() => localStorage.getItem("customerPassword"));
  const [customer, setCustomer] = useState(() => {
    const savedCustomer = localStorage.getItem("customer");
    try {
      return savedCustomer ? JSON.parse(savedCustomer) : null;
    } catch {
      localStorage.removeItem("customer");
      return null;
    }
  });

  useEffect(() => {
    function handlePopState() {
      setPageState(getPageFromLocation());
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  function setPage(nextPage) {
    const nextPath = PAGE_PATHS[nextPage] || PAGE_PATHS.home;
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, "", nextPath);
    }
    setPageState(nextPage);
  }

  function loginAdmin(username, password) {
    setAdmin(username);
    setAdminPassword(password);
    localStorage.setItem("admin", username);
    localStorage.setItem("adminPassword", password);
    setPage("admin");
  }

  function logoutAdmin() {
    setAdmin(null);
    setAdminPassword(null);
    localStorage.removeItem("admin");
    localStorage.removeItem("adminPassword");
    setPage("home");
  }

  function loginCustomer(customerData, password) {
    setCustomer(customerData);
    setCustomerPassword(password);
    localStorage.setItem("customer", JSON.stringify(customerData));
    localStorage.setItem("customerPassword", password);
    setPage("history");
  }

  function logoutCustomer() {
    setCustomer(null);
    setCustomerPassword(null);
    localStorage.removeItem("customer");
    localStorage.removeItem("customerPassword");
    setPage("home");
  }

  useEffect(() => {
    if (admin && page === "booking") {
      setPage("admin");
    }
  }, [admin, page]);

  return (
    <div className="app">
      <header className="navbar">
        <div className="logo" onClick={() => setPage("home")}>SkinCare Booking</div>
        <nav>
          <button onClick={() => setPage("home")}>Trang chủ</button>
          <button onClick={() => setPage("services")}>Dịch vụ</button>
          {!admin && <button onClick={() => setPage("booking")}>Đặt lịch</button>}
          {!customer && !admin && <button onClick={() => setPage("customerLogin")}>Tài khoản</button>}
          {customer && <span className="customer-name">Khách: {customer.phone}</span>}
          {customer && <button onClick={() => setPage("history")}>Lịch sử của tôi</button>}
          {customer && <button className="register-nav" onClick={logoutCustomer}>Đăng xuất</button>}
          {admin && <button onClick={() => setPage("admin")}>Dashboard</button>}
          {admin && <span className="customer-name">Admin: {admin}</span>}
          {admin && <button className="register-nav" onClick={logoutAdmin}>Đăng xuất</button>}
        </nav>
      </header>

      {page === "home" && <Home setPage={setPage} admin={admin} />}
      {page === "services" && <Services />}
      {page === "booking" && !admin && <Booking customer={customer} customerPassword={customerPassword} setPage={setPage} />}
      {page === "customerLogin" && <CustomerAuth mode="login" onLogin={loginCustomer} onAdminLogin={loginAdmin} setPage={setPage} />}
      {page === "customerRegister" && <CustomerAuth mode="register" onLogin={loginCustomer} setPage={setPage} />}
      {page === "history" && <CustomerHistory customer={customer} customerPassword={customerPassword} setPage={setPage} />}
      {page === "adminLogin" && <CustomerAuth mode="login" onLogin={loginCustomer} onAdminLogin={loginAdmin} setPage={setPage} />}
      {page === "admin" && <AdminDashboard admin={admin} adminPassword={adminPassword} setPage={setPage} />}

      <footer>© 2026 SkinCare Booking</footer>
    </div>
  );
}

function Home({ setPage, admin }) {
  return (
    <>
      <section className="hero">
        <div className="hero-content">
          <h1>SkinCare Beauty Center</h1>
          <p>
            Thành lập năm 2020, SkinCare Beauty Center mang đến các liệu trình
            chăm sóc da an toàn, cá nhân hóa và phù hợp với từng tình trạng da.
          </p>
          <div className="hero-buttons">
            <button className="primary-btn" onClick={() => setPage(admin ? "admin" : "booking")}>
              {admin ? "Vào Dashboard" : "Đặt lịch ngay"}
            </button>
            <button className="secondary-btn" onClick={() => setPage("services")}>Xem dịch vụ</button>
          </div>
        </div>

        <div className="hero-card">
          <h3>Sản phẩm & dịch vụ nổi bật</h3>
          <p>Liệu trình chăm sóc da cơ bản</p>
          <p>Điều trị mụn chuyên sâu</p>
          <p>Dưỡng trắng và phục hồi da</p>
          <p>Tư vấn routine chăm sóc da tại nhà</p>
        </div>
      </section>

      <section className="features">
        <div className="feature-card">
          <h3>Về chúng tôi</h3>
          <p>Đội ngũ kỹ thuật viên được đào tạo bài bản, luôn tư vấn theo tình trạng da thật của khách hàng.</p>
        </div>
        <div className="feature-card">
          <h3>Sản phẩm nổi bật</h3>
          <p>Mặt nạ phục hồi, serum cấp ẩm và liệu trình làm sạch sâu được nhiều khách hàng lựa chọn.</p>
        </div>
        <div className="feature-card">
          <h3>Feedback khách hàng</h3>
          <p>"Da mình dịu hơn sau buổi đầu, nhân viên tư vấn kỹ và không ép mua thêm liệu trình."</p>
        </div>
      </section>

      <section className="home-services">
        <div className="section-intro">
          <h2>Quy trình chăm sóc da</h2>
          <p>Mỗi buổi hẹn được thiết kế theo nhu cầu thực tế, giúp khách dễ chọn dịch vụ và yên tâm trước khi đặt lịch.</p>
        </div>
        <div className="home-service-grid">
          {HOME_SERVICE_STEPS.map((step, index) => (
            <article className="home-service-item" key={step.title}>
              <img src={step.image} alt={step.title} />
              <div>
                <span>Bước {index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="partners">
        <div className="section-intro">
          <h2>Đối tác sản phẩm</h2>
          <p>Trung tâm ưu tiên các thương hiệu chăm sóc da quen thuộc, dễ tìm và phù hợp nhiều tình trạng da.</p>
        </div>
        <div className="partner-strip">
          {PARTNER_LOGOS.map((name) => (
            <div className="partner-logo" key={name}>{name}</div>
          ))}
        </div>
      </section>

      <AgentChatWidget />
    </>
  );
}

function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadServices() {
      try {
        setLoading(true);
        setError("");
        const data = await fetchJson(`${API_URL}/services`);
        setServices(data || []);
      } catch (err) {
        setError(err.message);
        setServices([]);
      } finally {
        setLoading(false);
      }
    }

    loadServices();
  }, []);

  return (
    <section className="page-section">
      <h2>Danh sách dịch vụ</h2>
      {loading && <p className="form-note">Đang tải dịch vụ...</p>}
      {error && <p className="form-note error">{error}</p>}
      <div className="service-grid">
        {services.map((item) => (
          <div className="service-card" key={item.id}>
            <h3>{item.name}</h3>
            <p>{item.description}</p>
            <strong>{Number(item.price).toLocaleString("vi-VN")} đ</strong>
            <span>{item.durationMinutes} phút</span>
          </div>
        ))}
      </div>
      {!loading && !error && services.length === 0 && <p className="form-note">Chưa có dữ liệu dịch vụ.</p>}
    </section>
  );
}

function AgentChatWidget() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([
    { role: "agent", text: "Xin chào, mình có thể tư vấn dịch vụ, xem giá và kiểm tra lịch trống cho bạn." },
  ]);
  const [loading, setLoading] = useState(false);

  async function sendMessage(event) {
    event.preventDefault();
    const userMessage = message.trim();
    if (!userMessage) return;

    setMessage("");
    setLoading(true);
    setChatHistory((history) => [...history, { role: "user", text: userMessage }]);

    try {
      const data = await fetchJson(`${API_URL}/agent/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });

      setChatHistory((history) => [...history, { role: "agent", text: data.reply }]);
    } catch {
      setChatHistory((history) => [...history, { role: "agent", text: "Không thể kết nối chatbot" }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="chat-widget">
      {open && (
        <section className="chat-popup">
          <div className="chat-popup-head">
            <h2>Tư vấn AI</h2>
            <button type="button" onClick={() => setOpen(false)}>Đóng</button>
          </div>
          <div className="chat-box">
            {chatHistory.map((item, index) => (
              <div className={`chat-message ${item.role}`} key={`${item.role}-${index}`}>
                <span>{item.role === "user" ? "Bạn" : "Chatbot"}</span>
                <p>{item.text}</p>
              </div>
            ))}
            {loading && (
              <div className="chat-message agent">
                <span>Chatbot</span>
                <p>Đang trả lời...</p>
              </div>
            )}
          </div>
          <form onSubmit={sendMessage} className="chat-form">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ví dụ: Da mụn nên chọn dịch vụ nào?"
              disabled={loading}
            />
            <button type="submit" disabled={loading}>{loading ? "..." : "Gửi"}</button>
          </form>
        </section>
      )}
      <button type="button" className="chat-toggle" onClick={() => setOpen(!open)}>
        {open ? "Ẩn chat" : "Tư vấn AI"}
      </button>
    </div>
  );
}

function Booking({ customer, customerPassword, setPage }) {
  const [services, setServices] = useState([]);
  const [slots, setSlots] = useState([]);
  const [form, setForm] = useState({ customerName: "", serviceId: "", slotDate: "", startTime: "", note: "" });
  const [message, setMessage] = useState("");
  const [bookingResult, setBookingResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function loadData() {
    try {
      setLoading(true);
      setError("");
      const [serviceData, slotData] = await Promise.all([
        fetchJson(`${API_URL}/services`),
        fetchJson(`${API_URL}/time-slots`),
      ]);
      setServices(serviceData || []);
      setSlots(slotData || []);
    } catch (err) {
      setError(err.message);
      setServices([]);
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(loadData);
  }, []);

  function updateField(name, value) {
    setForm({ ...form, [name]: value });
  }

  function findSelectedSlot() {
    return slots.find((slot) => slot.slotDate === form.slotDate && normalizeTime(slot.startTime) === normalizeTime(form.startTime));
  }

  async function submitForm(event) {
    event.preventDefault();
    setMessage("");
    setBookingResult(null);

    if (!customer) {
      setMessage("Vui lòng đăng nhập khách hàng trước khi đặt lịch.");
      setPage("customerLogin");
      return;
    }

    setSubmitting(true);

    try {
      const selectedTime = BOOKING_TIMES.find((time) => time.startTime === form.startTime);
      if (!selectedTime) {
        throw new Error("Vui lòng chọn giờ hẹn");
      }

      let timeSlot = findSelectedSlot();
      if (timeSlot && !timeSlot.available) {
        throw new Error("Khung giờ này đã có khách đặt. Vui lòng chọn giờ khác.");
      }

      if (!timeSlot) {
        timeSlot = await fetchJson(`${API_URL}/time-slots`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slotDate: form.slotDate,
            startTime: selectedTime.startTime,
            endTime: selectedTime.endTime,
          }),
        });
      }

      const appointment = await fetchJson(`${API_URL}/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: form.customerName,
          customerId: Number(customer.id),
          customerPassword,
          note: form.note,
          serviceId: Number(form.serviceId),
          timeSlotId: Number(timeSlot.id),
        }),
      });
      setBookingResult(appointment);
      setMessage("Đặt lịch thành công. Vui lòng lưu mã hẹn để đưa cho trung tâm khi đến.");
      setForm({ customerName: "", serviceId: "", slotDate: "", startTime: "", note: "" });
      loadData();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="form-section">
      <h2>Đặt lịch hẹn</h2>
      {!customer && (
        <div className="auth-required">
          <p>Khách hàng cần đăng nhập hoặc đăng ký bằng số điện thoại trước khi đặt lịch.</p>
          <button className="secondary-btn" onClick={() => setPage("customerLogin")}>Tài khoản</button>
        </div>
      )}
      {customer && <p className="form-note">Đang đặt lịch bằng SĐT: <strong>{customer.phone}</strong></p>}
      {loading && <p className="form-note">Đang tải dữ liệu đặt lịch...</p>}
      {error && <p className="form-note error">{error}</p>}
      <form onSubmit={submitForm}>
        <label>Họ tên</label>
        <input value={form.customerName} onChange={(e) => updateField("customerName", e.target.value)} required />

        <label>Dịch vụ</label>
        <select value={form.serviceId} onChange={(e) => updateField("serviceId", e.target.value)} required disabled={loading}>
          <option value="">Chọn dịch vụ</option>
          {services.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>

        <label>Ngày hẹn</label>
        <input type="date" value={form.slotDate} onChange={(e) => updateField("slotDate", e.target.value)} required disabled={loading} />

        <label>Giờ hẹn</label>
        <select value={form.startTime} onChange={(e) => updateField("startTime", e.target.value)} required disabled={loading || !form.slotDate}>
          <option value="">Chọn giờ</option>
          {BOOKING_TIMES.map((time) => {
            const existingSlot = slots.find((slot) => slot.slotDate === form.slotDate && normalizeTime(slot.startTime) === normalizeTime(time.startTime));
            const isBusy = existingSlot && !existingSlot.available;
            return (
              <option key={time.startTime} value={time.startTime} disabled={isBusy}>
                {time.startTime} đến {time.endTime}{isBusy ? " - đã có lịch" : ""}
              </option>
            );
          })}
        </select>

        <label>Ghi chú</label>
        <textarea value={form.note} onChange={(e) => updateField("note", e.target.value)} placeholder="Nếu có" />

        <button type="submit" disabled={loading || submitting}>{submitting ? "Đang gửi..." : "Gửi lịch hẹn"}</button>
        {message && <p className="form-note">{message}</p>}
        {bookingResult && (
          <div className="booking-code-box">
            <span>Mã lịch hẹn của bạn</span>
            <strong>{getBookingCode(bookingResult)}</strong>
          </div>
        )}
      </form>
    </section>
  );
}

function CustomerAuth({ mode, onLogin, onAdminLogin, setPage }) {
  const [form, setForm] = useState({ phone: "", password: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const isRegister = mode === "register";

  async function submitForm(event) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      if (!isRegister && onAdminLogin) {
        try {
          const adminData = await fetchJson(`${API_URL}/admin/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: form.phone, password: form.password }),
          });

          if (adminData?.success) {
            onAdminLogin(form.phone, form.password);
            return;
          }
        } catch {
          // If this is not an admin account, continue with customer login.
        }
      }

      const data = await fetchJson(`${API_URL}/customers/${isRegister ? "register" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!data?.success || !data?.customer) {
        throw new Error(data?.message || "Không thể đăng nhập khách hàng");
      }

      onLogin(data.customer, form.password);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="form-section small-form">
      <h2>{isRegister ? "Đăng ký khách hàng" : "Đăng nhập tài khoản"}</h2>
      <form onSubmit={submitForm}>
        <label>{isRegister ? "Số điện thoại" : "Tài khoản / Số điện thoại"}</label>
        <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
        <label>Mật khẩu</label>
        <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        <button type="submit" disabled={loading}>{loading ? "Đang xử lý..." : isRegister ? "Đăng ký" : "Đăng nhập"}</button>
        <p className="form-note">
          {isRegister ? "Đã có tài khoản? " : "Chưa có tài khoản? "}
          <button type="button" className="text-btn" onClick={() => setPage(isRegister ? "customerLogin" : "customerRegister")}>
            {isRegister ? "Đăng nhập" : "Đăng ký"}
          </button>
        </p>
        {message && <p className="form-note error">{message}</p>}
      </form>
    </section>
  );
}

function CustomerHistory({ customer, customerPassword, setPage }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(Boolean(customer));
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadHistory() {
      if (!customer) {
        return;
      }

      try {
        setLoading(true);
        setError("");
        const params = new URLSearchParams({ customerPassword: customerPassword || "" });
        const data = await fetchJson(`${API_URL}/appointments/customer/${customer.id}?${params.toString()}`);
        setAppointments(data || []);
      } catch (err) {
        setError(err.message);
        setAppointments([]);
      } finally {
        setLoading(false);
      }
    }

    queueMicrotask(loadHistory);
  }, [customer, customerPassword]);

  if (!customer) {
    return (
      <section className="page-section">
        <p>Bạn cần đăng nhập khách hàng để xem lịch sử đặt lịch.</p>
        <button onClick={() => setPage("customerLogin")}>Đăng nhập khách hàng</button>
      </section>
    );
  }

  return (
    <section className="page-section">
      <h2>Lịch sử đặt lịch của tôi</h2>
      <p className="form-note">SĐT tài khoản: <strong>{customer.phone}</strong></p>
      {loading && <p className="form-note">Đang tải lịch sử...</p>}
      {error && <p className="form-note error">{error}</p>}
      <div className="table-wrap customer-history">
        <table>
          <thead>
            <tr><th>Mã hẹn</th><th>Khách</th><th>SĐT</th><th>Dịch vụ</th><th>Ngày</th><th>Giờ</th><th>Trạng thái</th><th>Ghi chú</th></tr>
          </thead>
          <tbody>
            {appointments.map((item) => (
              <tr key={item.id}>
                <td><strong>{getBookingCode(item)}</strong></td>
                <td>{item.customerName}</td>
                <td>{item.phone}</td>
                <td>{item.service?.name}</td>
                <td>{item.timeSlot?.slotDate}</td>
                <td>{normalizeTime(item.timeSlot?.startTime)}</td>
                <td><span className={`status-pill ${item.status?.toLowerCase()}`}>{STATUS_LABELS[item.status] || item.status}</span></td>
                <td>{item.note || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && appointments.length === 0 && <p className="form-note">Bạn chưa có lịch hẹn nào.</p>}
      </div>
    </section>
  );
}

const STATUS_LABELS = {
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  CANCELLED: "Đã hủy",
};

function formatLegacyBookingCode(id) {
  return String(id || 0).padStart(6, "0").slice(-6);
}

function toMonthValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function buildMonthDays(monthValue, slots, appointments) {
  if (!monthValue) {
    return [];
  }

  const [year, month] = monthValue.split("-").map(Number);
  const firstDate = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const startOffset = firstDate.getDay();
  const cells = Array.from({ length: startOffset }, () => null);

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const daySlots = mergeTimeSlots(slots.filter((slot) => slot.slotDate === date));
    const dayAppointments = appointments.filter((item) => item.timeSlot?.slotDate === date);

    cells.push({
      date,
      day,
      totalSlots: daySlots.length,
      availableSlots: daySlots.filter((slot) => slot.available).length,
      pending: dayAppointments.filter((item) => item.status === "PENDING").length,
      confirmed: dayAppointments.filter((item) => item.status === "CONFIRMED").length,
    });
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

function getBookingCode(appointment) {
  return appointment.bookingCode || formatLegacyBookingCode(appointment.id);
}

function AdminDashboard({ admin, adminPassword, setPage }) {
  const [appointments, setAppointments] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedDate, setSelectedDate] = useState("");
  const [calendarMonth, setCalendarMonth] = useState(toMonthValue());

  async function loadData() {
    try {
      setLoading(true);
      setError("");
      const adminParams = new URLSearchParams({
        adminUsername: admin || "",
        adminPassword: adminPassword || "",
      });
      const [appointmentData, slotData] = await Promise.all([
        fetchJson(`${API_URL}/appointments?${adminParams.toString()}`),
        fetchJson(`${API_URL}/time-slots`),
      ]);
      setAppointments(appointmentData || []);
      setSlots(slotData || []);
    } catch (err) {
      setError(err.message);
      setAppointments([]);
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (admin) {
      queueMicrotask(loadData);
    }
  }, [admin]);

  async function updateStatus(id, status) {
    try {
      setUpdatingId(id);
      setError("");
      setMessage("");
      await fetchJson(`${API_URL}/appointments/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminUsername: admin, adminPassword }),
      });
      await loadData();
      setMessage(status === "CONFIRMED" ? "Đã xác nhận lịch hẹn." : "Đã hủy lịch hẹn và mở lại khung giờ trống.");
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingId(null);
    }
  }

  if (!admin) {
    return <section className="page-section"><p>Bạn cần đăng nhập tài khoản admin.</p><button onClick={() => setPage("customerLogin")}>Đăng nhập</button></section>;
  }

  const filteredAppointments = appointments.filter((item) => {
    const matchStatus = statusFilter === "ALL" || item.status === statusFilter;
    const matchDate = !selectedDate || item.timeSlot?.slotDate === selectedDate;
    return matchStatus && matchDate;
  });
  const totalPending = appointments.filter((item) => item.status === "PENDING").length;
  const totalConfirmed = appointments.filter((item) => item.status === "CONFIRMED").length;
  const totalAvailable = slots.filter((slot) => slot.available).length;
  const monthDays = buildMonthDays(calendarMonth, slots, appointments);
  const selectedDateSlots = selectedDate ? mergeTimeSlots(slots.filter((slot) => slot.slotDate === selectedDate)) : [];

  return (
    <section className="page-section admin-page">
      <div className="admin-header">
        <div>
          <h2>Admin dashboard</h2>
          <p>Quản lý lịch hẹn và xem nhanh ngày còn trống để tư vấn khách.</p>
        </div>
        <button className="secondary-btn" onClick={loadData} disabled={loading}>Tải lại</button>
      </div>

      {loading && <p className="form-note">Đang tải lịch hẹn...</p>}
      {error && <p className="form-note error">{error}</p>}
      {message && <p className="form-note success">{message}</p>}

      <div className="summary-grid">
        <div className="summary-card">
          <span>Chờ xác nhận</span>
          <strong>{totalPending}</strong>
        </div>
        <div className="summary-card">
          <span>Đã xác nhận</span>
          <strong>{totalConfirmed}</strong>
        </div>
        <div className="summary-card">
          <span>Slot còn trống</span>
          <strong>{totalAvailable}</strong>
        </div>
      </div>

      <div className="admin-grid">
        <div>
          <div className="section-heading">
            <h3>Danh sách lịch hẹn</h3>
            <div className="admin-filters">
              {["ALL", "PENDING", "CONFIRMED", "CANCELLED"].map((status) => (
                <button
                  key={status}
                  className={statusFilter === status ? "active" : ""}
                  onClick={() => setStatusFilter(status)}
                >
                  {status === "ALL" ? "Tất cả" : STATUS_LABELS[status]}
                </button>
              ))}
            </div>
          </div>
          {selectedDate && (
            <div className="date-filter">
              Đang xem ngày <strong>{selectedDate}</strong>
              <button onClick={() => setSelectedDate("")}>Bỏ lọc</button>
            </div>
          )}
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Mã hẹn</th><th>Khách</th><th>SĐT</th><th>Dịch vụ</th><th>Ngày</th><th>Giờ</th><th>Trạng thái</th><th>Thao tác</th></tr>
              </thead>
              <tbody>
                {filteredAppointments.map((item) => (
                  <tr key={item.id}>
                    <td><strong>{getBookingCode(item)}</strong></td>
                    <td>{item.customerName}</td>
                    <td>{item.phone}</td>
                    <td>{item.service?.name}</td>
                    <td>{item.timeSlot?.slotDate}</td>
                    <td>{normalizeTime(item.timeSlot?.startTime)}</td>
                    <td><span className={`status-pill ${item.status?.toLowerCase()}`}>{STATUS_LABELS[item.status] || item.status}</span></td>
                    <td className="action-cell">
                      {item.status === "PENDING" ? (
                        <>
                          <button className="mini-btn" disabled={updatingId === item.id} onClick={() => updateStatus(item.id, "CONFIRMED")}>Xác nhận</button>
                          <button className="mini-btn cancel" disabled={updatingId === item.id} onClick={() => updateStatus(item.id, "CANCELLED")}>Hủy</button>
                        </>
                      ) : (
                        <span className="no-action">Đã xử lý</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && filteredAppointments.length === 0 && <p className="form-note">Không có lịch hẹn phù hợp.</p>}
          </div>
        </div>

        <aside className="side-panel">
          <div className="calendar-head">
            <h3>Lịch tháng</h3>
            <input type="month" value={calendarMonth} onChange={(event) => setCalendarMonth(event.target.value)} />
          </div>
          <div className="calendar-grid">
            {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((day) => <span className="weekday" key={day}>{day}</span>)}
            {monthDays.map((day, index) => (
              day ? (
                <button
                  key={day.date}
                  className={`calendar-day ${selectedDate === day.date ? "selected" : ""} ${day.availableSlots > 0 ? "has-free" : ""}`}
                  onClick={() => setSelectedDate(day.date)}
                >
                  <strong>{day.day}</strong>
                  <span>{day.availableSlots}/{day.totalSlots} trống</span>
                  {(day.pending > 0 || day.confirmed > 0) && <small>{day.pending} chờ · {day.confirmed} nhận</small>}
                </button>
              ) : (
                <span className="calendar-empty" key={`empty-${index}`} />
              )
            ))}
          </div>

          <h3 className="slot-title">{selectedDate ? `Khung giờ ${selectedDate}` : "Chọn một ngày để xem giờ"}</h3>
          {selectedDateSlots.map((slot) => (
            <div className={`slot-item ${slot.available ? "free" : "busy"}`} key={slot.id}>
              <span>{normalizeTime(slot.startTime)} - {normalizeTime(slot.endTime)}</span>
              <strong>{slot.available ? "Còn trống" : "Đã có lịch"}</strong>
            </div>
          ))}
          {selectedDate && selectedDateSlots.length === 0 && <p className="form-note">Ngày này chưa có khung giờ.</p>}
        </aside>
      </div>
    </section>
  );
}

export default App;
