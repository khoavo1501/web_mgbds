package com.realestate.management.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AppointmentRequest {
    private Long propertyId;
    
    // Không dùng @NotNull vì field này optional khi chỉ update status
    // Validation sẽ được xử lý trong service layer
    @Future(message = "Thời gian phải trong tương lai")
    private LocalDateTime scheduledAt;
    
    private String note;
    private String status; // Dùng khi update status
}
