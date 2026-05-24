package com.realestate.management.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AppointmentRequest {
    private Long propertyId;
    
    @NotNull(message = "Thời gian không được để trống")
    @Future(message = "Thời gian phải trong tương lai")
    private LocalDateTime scheduledAt;
    
    private String note;
    private String status; // Dùng khi update status
}
