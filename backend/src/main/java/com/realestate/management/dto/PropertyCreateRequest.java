package com.realestate.management.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * DTO cho tạo mới Property
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PropertyCreateRequest {

    @NotBlank(message = "Tiêu đề không được để trống")
    @Size(max = 500, message = "Tiêu đề không được vượt quá 500 ký tự")
    private String title;

    @Size(max = 5000, message = "Mô tả không được vượt quá 5000 ký tự")
    private String description;

    @NotBlank(message = "Loại BDS không được để trống")
    private String propertyType; // 'apartment', 'house', 'land', 'villa'

    @NotBlank(message = "Tỉnh/Thành phố không được để trống")
    private String province;

    @NotBlank(message = "Quận/Huyện không được để trống")
    private String district;

    @NotNull(message = "Diện tích không được để trống")
    @DecimalMin(value = "0.01", message = "Diện tích phải lớn hơn 0")
    private BigDecimal area;

    @NotNull(message = "Giá không được để trống")
    @DecimalMin(value = "0.01", message = "Giá phải lớn hơn 0")
    private BigDecimal price;

    // ID của broker được gán phụ trách (optional)
    private Long assignedToId;

    // Danh sách URL hình ảnh
    private List<ImageRequest> images;

    // Exclusive Contract Fields
    private Boolean isExclusive;
    private String ownerName;
    private String ownerPhone;
    private String exclusiveDuration;
    private BigDecimal brokerageFee;
    private BigDecimal ownerDesiredPrice;
    private String commissionTerms;
    private String brokerageContractUrl;

    // Legal Documents
    private String redBookUrl;
    private String householdRegistrationUrl;
    private String ownerIdUrl;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ImageRequest {
        @NotBlank(message = "URL hình ảnh không được để trống")
        private String url;
        
        private Boolean isPrimary = false;
    }
}
