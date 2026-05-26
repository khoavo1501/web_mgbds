package com.realestate.management.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ProfileUpdateRequest {

    @NotBlank(message = "Họ tên không được để trống")
    @Size(max = 255, message = "Họ tên không được vượt quá 255 ký tự")
    private String fullName;

    @Size(max = 20, message = "Số điện thoại không được vượt quá 20 ký tự")
    private String phone;

    @Size(max = 100)
    private String bankName;

    @Size(max = 50)
    private String bankAccountNumber;

    @Size(max = 255)
    private String bankAccountHolder;

    @Size(max = 500)
    private String cccdFrontUrl;

    @Size(max = 500)
    private String cccdBackUrl;

    @Size(max = 500)
    private String residenceUrl;
}
