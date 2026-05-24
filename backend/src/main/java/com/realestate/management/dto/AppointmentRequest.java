package com.realestate.management.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AppointmentRequest {
    private Long propertyId;
    private LocalDateTime scheduledAt;
    
    private String note;
    private String status; // Dùng khi update status
}
