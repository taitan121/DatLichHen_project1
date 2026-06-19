package com.skincare.booking;

import com.skincare.booking.entity.Admin;
import com.skincare.booking.entity.Customer;
import com.skincare.booking.entity.ServiceItem;
import com.skincare.booking.entity.TimeSlot;
import com.skincare.booking.repository.AdminRepository;
import com.skincare.booking.repository.CustomerRepository;
import com.skincare.booking.repository.ServiceItemRepository;
import com.skincare.booking.repository.TimeSlotRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import java.time.LocalDate;

@Component
public class DataSeeder implements CommandLineRunner {
    private final AdminRepository adminRepository;
    private final CustomerRepository customerRepository;
    private final ServiceItemRepository serviceRepository;
    private final TimeSlotRepository timeSlotRepository;
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public DataSeeder(AdminRepository adminRepository, CustomerRepository customerRepository, ServiceItemRepository serviceRepository,
                      TimeSlotRepository timeSlotRepository) {
        this.adminRepository = adminRepository;
        this.customerRepository = customerRepository;
        this.serviceRepository = serviceRepository;
        this.timeSlotRepository = timeSlotRepository;
    }

    @Override
    public void run(String... args) {
        seedAdmin();
        hashExistingPlainTextPasswords();
        seedServices();
        seedTimeSlots();
    }

    private void seedAdmin() {
        if (!adminRepository.existsByUsername("admin")) {
            Admin admin = new Admin();
            admin.setUsername("admin");
            admin.setPassword(passwordEncoder.encode("admin123"));
            adminRepository.save(admin);
        }
    }

    private void hashExistingPlainTextPasswords() {
        for (Admin admin : adminRepository.findAll()) {
            if (!isBcryptHash(admin.getPassword())) {
                admin.setPassword(passwordEncoder.encode(admin.getPassword()));
                adminRepository.save(admin);
            }
        }

        for (Customer customer : customerRepository.findAll()) {
            if (!isBcryptHash(customer.getPassword())) {
                customer.setPassword(passwordEncoder.encode(customer.getPassword()));
                customerRepository.save(customer);
            }
        }
    }

    private boolean isBcryptHash(String password) {
        return password != null
                && (password.startsWith("$2a$") || password.startsWith("$2b$") || password.startsWith("$2y$"));
    }

    private void seedServices() {
        if (serviceRepository.count() > 0) return;
        addService("Chăm sóc da cơ bản", "Làm sạch da, cấp ẩm và thư giãn.", 250000.0, 60);
        addService("Điều trị mụn", "Chăm sóc da mụn và tư vấn quy trình tại nhà.", 350000.0, 75);
        addService("Dưỡng trắng da", "Giúp da sáng và đều màu hơn.", 400000.0, 90);
        addService("Chăm sóc da chuyên sâu", "Liệu trình phục hồi và cấp ẩm chuyên sâu.", 500000.0, 90);
    }

    private void addService(String name, String description, Double price, Integer duration) {
        ServiceItem service = new ServiceItem();
        service.setName(name);
        service.setDescription(description);
        service.setPrice(price);
        service.setDurationMinutes(duration);
        serviceRepository.save(service);
    }

    private void seedTimeSlots() {
        if (timeSlotRepository.count() > 0) return;
        LocalDate date = LocalDate.now().plusDays(1);
        addSlot(date.toString(), "09:00", "10:00");
        addSlot(date.toString(), "10:30", "11:30");
        addSlot(date.toString(), "14:00", "15:00");
        addSlot(date.plusDays(1).toString(), "09:00", "10:00");
        addSlot(date.plusDays(1).toString(), "15:00", "16:00");
    }

    private void addSlot(String date, String start, String end) {
        TimeSlot slot = new TimeSlot();
        slot.setSlotDate(date);
        slot.setStartTime(start);
        slot.setEndTime(end);
        slot.setAvailable(true);
        timeSlotRepository.save(slot);
    }
}
