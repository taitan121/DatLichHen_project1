package com.skincare.booking.controller;

import com.skincare.booking.dto.AppointmentRequest;
import com.skincare.booking.dto.StatusRequest;
import com.skincare.booking.entity.Appointment;
import com.skincare.booking.entity.Customer;
import com.skincare.booking.entity.ServiceItem;
import com.skincare.booking.entity.TimeSlot;
import com.skincare.booking.repository.AdminRepository;
import com.skincare.booking.repository.AppointmentRepository;
import com.skincare.booking.repository.CustomerRepository;
import com.skincare.booking.repository.ServiceItemRepository;
import com.skincare.booking.repository.TimeSlotRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.ThreadLocalRandom;

@RestController
@RequestMapping("/api/appointments")
@CrossOrigin(origins = {
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176"
})
public class AppointmentController {
    private final AppointmentRepository appointmentRepository;
    private final AdminRepository adminRepository;
    private final CustomerRepository customerRepository;
    private final ServiceItemRepository serviceRepository;
    private final TimeSlotRepository timeSlotRepository;

    public AppointmentController(AppointmentRepository appointmentRepository, AdminRepository adminRepository,
                                 CustomerRepository customerRepository, ServiceItemRepository serviceRepository,
                                 TimeSlotRepository timeSlotRepository) {
        this.appointmentRepository = appointmentRepository;
        this.adminRepository = adminRepository;
        this.customerRepository = customerRepository;
        this.serviceRepository = serviceRepository;
        this.timeSlotRepository = timeSlotRepository;
    }

    @PostMapping
    public Appointment create(@RequestBody AppointmentRequest request) {
        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Vui lòng đăng nhập khách hàng"));
        requireCustomer(customer, request.getCustomerPassword());
        ServiceItem service = serviceRepository.findById(request.getServiceId()).orElseThrow();
        TimeSlot timeSlot = timeSlotRepository.findById(request.getTimeSlotId()).orElseThrow();

        if (Boolean.FALSE.equals(timeSlot.getAvailable())) {
            throw new IllegalStateException("Khung giờ này đã có lịch hẹn");
        }

        Appointment appointment = new Appointment();
        appointment.setCustomerName(request.getCustomerName());
        appointment.setPhone(customer.getPhone());
        appointment.setCustomer(customer);
        appointment.setService(service);
        appointment.setTimeSlot(timeSlot);
        appointment.setNote(request.getNote());
        appointment.setBookingCode(generateBookingCode());
        appointment.setStatus("PENDING");

        timeSlot.setAvailable(false);
        timeSlotRepository.save(timeSlot);
        return appointmentRepository.save(appointment);
    }

    @GetMapping
    public List<Appointment> getAll(@RequestParam String adminUsername, @RequestParam String adminPassword) {
        requireAdmin(adminUsername, adminPassword);
        List<Appointment> appointments = appointmentRepository.findAll();
        appointments.forEach(this::ensureBookingCode);
        return appointments;
    }

    @GetMapping("/customer/{customerId}")
    public List<Appointment> getByCustomer(@PathVariable Long customerId, @RequestParam String customerPassword) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Vui lòng đăng nhập khách hàng"));
        requireCustomer(customer, customerPassword);
        List<Appointment> appointments = appointmentRepository.findByCustomerIdOrderByIdDesc(customerId);
        appointments.forEach(this::ensureBookingCode);
        return appointments;
    }

    @PutMapping("/{id}/status")
    public Appointment updateStatus(@PathVariable Long id, @RequestBody StatusRequest request) {
        requireAdmin(request.getAdminUsername(), request.getAdminPassword());
        Appointment appointment = appointmentRepository.findById(id).orElseThrow();
        String status = request.getStatus().toUpperCase(Locale.ROOT);
        if (!status.equals("PENDING") && !status.equals("CONFIRMED") && !status.equals("CANCELLED")) {
            throw new IllegalArgumentException("Trạng thái không hợp lệ");
        }

        TimeSlot timeSlot = appointment.getTimeSlot();
        if (status.equals("CANCELLED")) {
            timeSlot.setAvailable(true);
        } else {
            timeSlot.setAvailable(false);
        }
        timeSlotRepository.save(timeSlot);

        appointment.setStatus(status);
        return appointmentRepository.save(appointment);
    }

    private String generateBookingCode() {
        String bookingCode;
        do {
            bookingCode = String.valueOf(ThreadLocalRandom.current().nextInt(100000, 1000000));
        } while (appointmentRepository.existsByBookingCode(bookingCode));

        return bookingCode;
    }

    private void ensureBookingCode(Appointment appointment) {
        if (appointment.getBookingCode() == null || appointment.getBookingCode().isBlank()) {
            appointment.setBookingCode(generateBookingCode());
            appointmentRepository.save(appointment);
        }
    }

    private void requireAdmin(String username, String password) {
        boolean isAdmin = adminRepository.findByUsernameAndPassword(username, password).isPresent();
        if (!isAdmin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Chỉ admin mới được xem hoặc xử lý tất cả lịch hẹn");
        }
    }

    private void requireCustomer(Customer customer, String password) {
        if (password == null || !password.equals(customer.getPassword())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn chỉ được xem hoặc tạo lịch hẹn của tài khoản đang đăng nhập");
        }
    }
}
