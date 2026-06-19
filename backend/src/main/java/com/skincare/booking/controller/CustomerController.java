package com.skincare.booking.controller;

import com.skincare.booking.dto.CustomerAuthRequest;
import com.skincare.booking.entity.Customer;
import com.skincare.booking.repository.CustomerRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/customers")
@CrossOrigin(origins = {
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176"
})
public class CustomerController {
    private final CustomerRepository customerRepository;
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public CustomerController(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@RequestBody CustomerAuthRequest request) {
        String phone = normalizePhone(request.getPhone());
        if (phone.isBlank() || request.getPassword() == null || request.getPassword().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Vui lòng nhập số điện thoại và mật khẩu"
            ));
        }

        if (!isValidPhone(phone)) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Số điện thoại phải gồm đúng 10 chữ số"
            ));
        }

        if (customerRepository.existsByPhone(phone)) {
            return ResponseEntity.status(409).body(Map.of(
                    "success", false,
                    "message", "Số điện thoại đã được đăng ký"
            ));
        }

        Customer customer = new Customer();
        customer.setPhone(phone);
        customer.setPassword(passwordEncoder.encode(request.getPassword()));
        Customer savedCustomer = customerRepository.save(customer);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "customer", savedCustomer
        ));
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody CustomerAuthRequest request) {
        String phone = normalizePhone(request.getPhone());
        String password = request.getPassword();

        if (phone.isBlank() || password == null || password.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Vui lòng nhập số điện thoại và mật khẩu"
            ));
        }

        return customerRepository
                .findByPhone(phone)
                .filter(customer -> passwordMatches(password, customer.getPassword()))
                .<ResponseEntity<Map<String, Object>>>map(customer -> ResponseEntity.ok(Map.of(
                        "success", true,
                        "customer", upgradeLegacyPassword(customer, password)
                )))
                .orElseGet(() -> ResponseEntity.status(401).body(Map.of(
                        "success", false,
                        "message", "Sai số điện thoại hoặc mật khẩu"
                )));
    }

    private String normalizePhone(String phone) {
        return phone == null ? "" : phone.trim();
    }

    private boolean isValidPhone(String phone) {
        return phone.matches("\\d{10}");
    }

    private boolean passwordMatches(String rawPassword, String storedPassword) {
        return passwordEncoder.matches(rawPassword, storedPassword) || rawPassword.equals(storedPassword);
    }

    private Customer upgradeLegacyPassword(Customer customer, String rawPassword) {
        if (rawPassword.equals(customer.getPassword())) {
            customer.setPassword(passwordEncoder.encode(rawPassword));
            return customerRepository.save(customer);
        }

        return customer;
    }
}
