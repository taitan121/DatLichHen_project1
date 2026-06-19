package com.skincare.booking.controller;

import com.skincare.booking.dto.LoginRequest;
import com.skincare.booking.entity.Admin;
import com.skincare.booking.repository.AdminRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
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
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public AdminController(AdminRepository adminRepository) {
        this.adminRepository = adminRepository;
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody LoginRequest request) {
        boolean success = adminRepository
                .findByUsername(request.getUsername())
                .filter(admin -> passwordMatches(request.getPassword(), admin.getPassword()))
                .map(admin -> upgradeLegacyPassword(admin, request.getPassword()))
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

    private boolean passwordMatches(String rawPassword, String storedPassword) {
        return rawPassword != null
                && (passwordEncoder.matches(rawPassword, storedPassword) || rawPassword.equals(storedPassword));
    }

    private Admin upgradeLegacyPassword(Admin admin, String rawPassword) {
        if (rawPassword.equals(admin.getPassword())) {
            admin.setPassword(passwordEncoder.encode(rawPassword));
            return adminRepository.save(admin);
        }

        return admin;
    }
}
