package com.realestate.management.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LeadDTO {
    private Long leadId;
    private String customerName;
    private String customerPhone;
    private String status;
    private LocalDateTime createdAt;

    // Property info
    private Long propertyId;
    private String propertyTitle;

    // Assigned broker info
    private Long assignedToId;
    private String assignedToName;
}
