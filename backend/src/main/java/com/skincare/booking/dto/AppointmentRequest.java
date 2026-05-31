package com.skincare.booking.dto;

public class AppointmentRequest {
    private String customerName;
    private String phone;
    private Long customerId;
    private String customerPassword;
    private Long serviceId;
    private Long timeSlotId;
    private String note;

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }
    public String getCustomerPassword() { return customerPassword; }
    public void setCustomerPassword(String customerPassword) { this.customerPassword = customerPassword; }
    public Long getServiceId() { return serviceId; }
    public void setServiceId(Long serviceId) { this.serviceId = serviceId; }
    public Long getTimeSlotId() { return timeSlotId; }
    public void setTimeSlotId(Long timeSlotId) { this.timeSlotId = timeSlotId; }
    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
}
