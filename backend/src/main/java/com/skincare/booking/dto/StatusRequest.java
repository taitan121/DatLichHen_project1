package com.skincare.booking.dto;

public class StatusRequest {
    private String status;
    private String adminUsername;
    private String adminPassword;

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getAdminUsername() { return adminUsername; }
    public void setAdminUsername(String adminUsername) { this.adminUsername = adminUsername; }
    public String getAdminPassword() { return adminPassword; }
    public void setAdminPassword(String adminPassword) { this.adminPassword = adminPassword; }
}
