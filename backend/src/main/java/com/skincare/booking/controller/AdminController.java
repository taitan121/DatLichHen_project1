package com.skincare.booking.controller;

import com.skincare.booking.dto.LoginRequest;
import com.skincare.booking.repository.AdminRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = {
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176"
})
public class AdminController {
    private final AdminRepository adminRepository;

    public AdminController(AdminRepository adminRepository) {
        this.adminRepository = adminRepository;
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody LoginRequest request) {
        boolean success = adminRepository
                .findByUsernameAndPassword(request.getUsername(), request.getPassword())
                .isPresent();

        if (success) {
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Login success"
            ));
        }

        return ResponseEntity.status(401).body(Map.of(
                "success", false,
                "message", "Invalid username or password"
        ));
    }
}
