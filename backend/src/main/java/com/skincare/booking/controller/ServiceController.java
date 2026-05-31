package com.skincare.booking.controller;

import com.skincare.booking.entity.ServiceItem;
import com.skincare.booking.repository.ServiceItemRepository;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/services")
@CrossOrigin(origins = {
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176"
})
public class ServiceController {
    private final ServiceItemRepository repository;

    public ServiceController(ServiceItemRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<ServiceItem> getAll() {
        return repository.findAll();
    }
}
