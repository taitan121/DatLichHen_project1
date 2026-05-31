package com.skincare.booking.repository;

import com.skincare.booking.entity.TimeSlot;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TimeSlotRepository extends JpaRepository<TimeSlot, Long> {
    List<TimeSlot> findByAvailableTrue();
    List<TimeSlot> findBySlotDate(String slotDate);
}
