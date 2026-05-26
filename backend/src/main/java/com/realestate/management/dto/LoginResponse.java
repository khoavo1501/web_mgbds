package com.realestate.management.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO cho Login Response
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {

    private String token;
    private String type = "Bearer";
    private Long userId;
    private String email;
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
    private String role;

    public LoginResponse(String token, Long userId, String email, String fullName, String phone, String role) {
        this.token = token;
        this.userId = userId;
        this.email = email;
        this.fullName = fullName;
        this.phone = phone;
        this.role = role;
    }

    public LoginResponse(String token, Long userId, String email, String fullName, String phone,
            String bankName, String bankAccountNumber, String bankAccountHolder, String identityVerificationStatus,
            String cccdFrontUrl, String cccdBackUrl, String residenceUrl, String identityRejectReason, String role) {
        this.token = token;
        this.userId = userId;
        this.email = email;
        this.fullName = fullName;
        this.phone = phone;
        this.bankName = bankName;
        this.bankAccountNumber = bankAccountNumber;
        this.bankAccountHolder = bankAccountHolder;
        this.identityVerificationStatus = identityVerificationStatus;
        this.cccdFrontUrl = cccdFrontUrl;
        this.cccdBackUrl = cccdBackUrl;
        this.residenceUrl = residenceUrl;
        this.identityRejectReason = identityRejectReason;
        this.role = role;
    }
}
