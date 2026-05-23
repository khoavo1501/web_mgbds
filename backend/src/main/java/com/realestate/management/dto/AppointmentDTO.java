package com.realestate.management.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentDTO {
    private Long appointmentId;
    private LocalDateTime scheduledAt;
    private String status;
    private String note;
    private Long propertyId;
    private String propertyTitle;
    private Long customerId;
    private String customerName;
    private String customerEmail;
    private String customerPhone;
    private Long brokerId;
    private String brokerName;
}
