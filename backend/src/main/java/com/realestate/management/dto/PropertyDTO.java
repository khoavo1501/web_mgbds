package com.realestate.management.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO cho Property Response
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PropertyDTO {
    
    private Long propertyId;
    private String propertyCode;
    private String title;
    private String description;
    private String propertyType;
    private String status;
    private String rejectReason;
    private String province;
    private String district;
    private BigDecimal area;
    private BigDecimal price;
    private LocalDateTime createdAt;
    
    // Exclusive Contract Fields
    private Boolean isExclusive;
    private String contractStatus;
    private String ownerName;
    private String ownerPhone;
    private String exclusiveDuration;
    private BigDecimal brokerageFee;
    private BigDecimal ownerDesiredPrice;
    private String commissionTerms;
    private String brokerageContractUrl;
    private Boolean isLocked;
    
    // Legal Documents
    private String redBookUrl;
    private String householdRegistrationUrl;
    private String ownerIdUrl;
    
    // Thông tin người tạo và người phụ trách
    private UserSimpleDTO createdBy;
    private UserSimpleDTO assignedTo;
    
    // Danh sách hình ảnh
    private List<PropertyImageDTO> images;
    
    /**
     * DTO đơn giản cho User (tránh vòng lặp)
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserSimpleDTO {
        private Long userId;
        private String fullName;
        private String email;
        private String phone;
    }
    
    /**
     * DTO cho PropertyImage
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PropertyImageDTO {
        private Long imageId;
        private String url;
        private Boolean isPrimary;
    }
}
