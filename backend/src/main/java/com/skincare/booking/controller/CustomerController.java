package com.skincare.booking.controller;

import com.skincare.booking.dto.CustomerAuthRequest;
import com.skincare.booking.entity.Customer;
import com.skincare.booking.repository.CustomerRepository;
import org.springframework.http.ResponseEntity;
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

        if (customerRepository.existsByPhone(phone)) {
            return ResponseEntity.status(409).body(Map.of(
                    "success", false,
                    "message", "Số điện thoại đã được đăng ký"
            ));
        }

        Customer customer = new Customer();
        customer.setPhone(phone);
        customer.setPassword(request.getPassword());
        Customer savedCustomer = customerRepository.save(customer);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "customer", savedCustomer
        ));
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody CustomerAuthRequest request) {
        return customerRepository
                .findByPhoneAndPassword(normalizePhone(request.getPhone()), request.getPassword())
                .<ResponseEntity<Map<String, Object>>>map(customer -> ResponseEntity.ok(Map.of(
                        "success", true,
                        "customer", customer
                )))
                .orElseGet(() -> ResponseEntity.status(401).body(Map.of(
                        "success", false,
                        "message", "Sai số điện thoại hoặc mật khẩu"
                )));
    }

    private String normalizePhone(String phone) {
        return phone == null ? "" : phone.trim();
    }
}
