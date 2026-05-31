package com.skincare.booking.controller;

import com.skincare.booking.entity.TimeSlot;
import com.skincare.booking.repository.TimeSlotRepository;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/time-slots")
@CrossOrigin(origins = {
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176"
})
public class TimeSlotController {
    private final TimeSlotRepository repository;

    public TimeSlotController(TimeSlotRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<TimeSlot> getAll() {
        return repository.findAll();
    }

    @GetMapping("/available")
    public List<TimeSlot> getAvailable() {
        return repository.findByAvailableTrue();
    }

    @PostMapping
    public TimeSlot create(@RequestBody TimeSlot timeSlot) {
        String startTime = normalizeTime(timeSlot.getStartTime());
        return repository.findBySlotDate(timeSlot.getSlotDate()).stream()
                .filter(slot -> normalizeTime(slot.getStartTime()).equals(startTime))
                .findFirst()
                .orElseGet(() -> saveNewSlot(timeSlot));
    }

    private TimeSlot saveNewSlot(TimeSlot timeSlot) {
        timeSlot.setStartTime(normalizeTime(timeSlot.getStartTime()));
        timeSlot.setEndTime(normalizeTime(timeSlot.getEndTime()));
        timeSlot.setAvailable(true);
        return repository.save(timeSlot);
    }

    private String normalizeTime(String time) {
        if (time == null || time.length() <= 5) {
            return time;
        }
        return time.substring(0, 5);
    }
}
