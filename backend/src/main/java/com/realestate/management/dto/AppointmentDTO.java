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
    
    // Property info
    private Long propertyId;
    private String propertyTitle;
    private String propertyAddress;
    private String propertyImage;
    
    // Customer info
    private Long customerId;
    private String customerName;
    private String customerPhone;
    private String customerEmail;
    
    // Broker info
    private Long brokerId;
    private String brokerName;
    private String brokerEmail;
    
    // Contact info (có thể khác với customer info)
    private String contactName;
    private String contactPhone;
    private String contactEmail;
    
    // Cancellation info
    private Long hoursUntilAppointment;
    private Boolean isWithin24Hours;
}
