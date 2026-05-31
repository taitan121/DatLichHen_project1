package com.skincare.booking.dto;

public class AgentResponse {
    private String reply;

    public AgentResponse(String reply) {
        this.reply = reply;
    }

    public String getReply() { return reply; }
    public void setReply(String reply) { this.reply = reply; }
}
