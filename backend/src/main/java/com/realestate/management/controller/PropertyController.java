package com.realestate.management.controller;

import com.realestate.management.dto.ApiResponse;
import com.realestate.management.dto.PropertyCreateRequest;
import com.realestate.management.dto.PropertyDTO;
import com.realestate.management.dto.PropertySearchRequest;
import com.realestate.management.service.PropertyService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller cho Property
 * Base URL: /api/properties
 */
@RestController
@RequestMapping("/api/properties")
@CrossOrigin(originPatterns = "*")
public class PropertyController {

    @Autowired
    private PropertyService propertyService;

    /**
     * GET /api/properties
     * Lấy danh sách BDS với phân trang và tìm kiếm
     * Public API - Không cần authentication
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<PropertyDTO>>> getProperties(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String propertyType,
            @RequestParam(required = false) String province,
            @RequestParam(required = false) String district,
            @RequestParam(required = false) String minPrice,
            @RequestParam(required = false) String maxPrice,
            @RequestParam(required = false) String minArea,
            @RequestParam(required = false) String maxArea,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection
    ) {
        try {
            // Tạo search request
            PropertySearchRequest searchRequest = new PropertySearchRequest();
            searchRequest.setStatus(status);
            searchRequest.setPropertyType(propertyType);
            searchRequest.setProvince(province);
            searchRequest.setDistrict(district);
            searchRequest.setKeyword(keyword);
            searchRequest.setPage(page);
            searchRequest.setSize(size);
            searchRequest.setSortBy(sortBy);
            searchRequest.setSortDirection(sortDirection);

            // Parse price và area nếu có
            if (minPrice != null && !minPrice.isEmpty()) {
                searchRequest.setMinPrice(new java.math.BigDecimal(minPrice));
            }
            if (maxPrice != null && !maxPrice.isEmpty()) {
                searchRequest.setMaxPrice(new java.math.BigDecimal(maxPrice));
            }
            if (minArea != null && !minArea.isEmpty()) {
                searchRequest.setMinArea(new java.math.BigDecimal(minArea));
            }
            if (maxArea != null && !maxArea.isEmpty()) {
                searchRequest.setMaxArea(new java.math.BigDecimal(maxArea));
            }

            Page<PropertyDTO> properties = propertyService.getProperties(searchRequest);
            
            return ResponseEntity.ok(
                ApiResponse.success("Lấy danh sách BDS thành công", properties)
            );
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Lỗi khi lấy danh sách BDS: " + e.getMessage()));
        }
    }

    /**
     * GET /api/properties/{id}
     * Lấy chi tiết 1 BDS
     * Public API - Không cần authentication
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PropertyDTO>> getPropertyById(@PathVariable Long id) {
        try {
            PropertyDTO property = propertyService.getPropertyById(id);
            return ResponseEntity.ok(
                ApiResponse.success("Lấy chi tiết BDS thành công", property)
            );
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Lỗi khi lấy chi tiết BDS: " + e.getMessage()));
        }
    }

    /**
     * POST /api/properties
     * Tạo mới BDS
     * Yêu cầu quyền: ADMIN hoặc BROKER
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'BROKER')")
    public ResponseEntity<ApiResponse<PropertyDTO>> createProperty(
            @Valid @RequestBody PropertyCreateRequest request
    ) {
        try {
            PropertyDTO createdProperty = propertyService.createProperty(request);
            return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo BDS thành công", createdProperty));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Lỗi khi tạo BDS: " + e.getMessage()));
        }
    }

    /**
     * PUT /api/properties/{id}
     * Cập nhật BDS
     * Yêu cầu quyền: ADMIN hoặc BROKER (chủ sở hữu)
     * TODO: Implement trong phase tiếp theo
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'BROKER')")
    public ResponseEntity<ApiResponse<PropertyDTO>> updateProperty(
            @PathVariable Long id,
            @Valid @RequestBody PropertyCreateRequest request
    ) {
        try {
            PropertyDTO updatedProperty = propertyService.updateProperty(id, request);
            return ResponseEntity.ok(
                ApiResponse.success("Cập nhật BDS thành công", updatedProperty)
            );
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Lỗi khi cập nhật BDS: " + e.getMessage()));
        }
    }

    /**
     * DELETE /api/properties/{id}
     * Xóa BDS
     * Yêu cầu quyền: ADMIN
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'BROKER')")
    public ResponseEntity<ApiResponse<String>> deleteProperty(@PathVariable Long id) {
        try {
            propertyService.deleteProperty(id);
            return ResponseEntity.ok(
                ApiResponse.success("Xóa BDS thành công")
            );
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Lỗi khi xóa BDS: " + e.getMessage()));
        }
    }

    /**
     * PATCH /api/properties/{id}/status
     * Cập nhật trạng thái BDS (pending -> published -> sold)
     * Yêu cầu quyền: ADMIN hoặc BROKER (chủ sở hữu)
     */
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'BROKER')")
    public ResponseEntity<ApiResponse<PropertyDTO>> updatePropertyStatus(
            @PathVariable Long id,
            @RequestParam String status,
            @RequestParam(required = false) String reason
    ) {
        try {
            PropertyDTO updatedProperty = propertyService.updatePropertyStatus(id, status, reason);
            return ResponseEntity.ok(
                ApiResponse.success("Cập nhật trạng thái BDS thành công", updatedProperty)
            );
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Lỗi khi cập nhật trạng thái BDS: " + e.getMessage()));
        }
    }
}
