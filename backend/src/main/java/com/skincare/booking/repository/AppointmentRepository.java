package com.skincare.booking.repository;

import com.skincare.booking.entity.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    boolean existsByBookingCode(String bookingCode);
    List<Appointment> findByCustomerIdOrderByIdDesc(Long customerId);
}
