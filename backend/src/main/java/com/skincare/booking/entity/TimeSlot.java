package com.skincare.booking.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "time_slots")
public class TimeSlot {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, name = "slot_date")
    private String slotDate;

    @Column(nullable = false, name = "start_time")
    private String startTime;

    @Column(nullable = false, name = "end_time")
    private String endTime;

    private Boolean available = true;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getSlotDate() { return slotDate; }
    public void setSlotDate(String slotDate) { this.slotDate = slotDate; }
    public String getStartTime() { return startTime; }
    public void setStartTime(String startTime) { this.startTime = startTime; }
    public String getEndTime() { return endTime; }
    public void setEndTime(String endTime) { this.endTime = endTime; }
    public Boolean getAvailable() { return available; }
    public void setAvailable(Boolean available) { this.available = available; }
}
