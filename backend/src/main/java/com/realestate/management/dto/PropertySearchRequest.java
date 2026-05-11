package com.realestate.management.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO cho tìm kiếm Property
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PropertySearchRequest {

    private String status; // 'pending', 'published', 'sold'
    private String propertyType; // 'apartment', 'house', 'land', 'villa'
    private String province;
    private String district;
    private BigDecimal minPrice;
    private BigDecimal maxPrice;
    private BigDecimal minArea;
    private BigDecimal maxArea;
    private String keyword; // Tìm kiếm theo title/description
    
    // Pagination
    private Integer page = 0;
    private Integer size = 10;
    private String sortBy = "createdAt";
    private String sortDirection = "DESC";
}
