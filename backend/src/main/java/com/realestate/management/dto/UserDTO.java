package com.realestate.management.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {
    private Long userId;
    private String email;
    private String role;
    private String fullName;
    private String phone;
    private String bankName;
    private String bankAccountNumber;
    private String bankAccountHolder;
    private String identityVerificationStatus;
    private String cccdFrontUrl;
    private String cccdBackUrl;
    private String residenceUrl;
    private String identityRejectReason;
    private Boolean isActive;
    private LocalDateTime createdAt;
}
