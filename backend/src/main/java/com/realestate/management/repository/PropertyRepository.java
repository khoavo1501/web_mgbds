package com.realestate.management.repository;

import com.realestate.management.entity.Property;
import com.realestate.management.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

/**
 * Repository cho Property Entity
 */
@Repository
public interface PropertyRepository extends JpaRepository<Property, Long> {

    /**
     * Tìm property theo mã code
     */
    Optional<Property> findByPropertyCode(String propertyCode);

    /**
     * Kiểm tra property code đã tồn tại chưa
     */
    boolean existsByPropertyCode(String propertyCode);

    /**
     * Tìm property theo status
     */
    List<Property> findByStatus(String status);

    /**
     * Tìm property theo status với phân trang
     */
    Page<Property> findByStatus(String status, Pageable pageable);

    /**
     * Tìm property theo property type
     */
    List<Property> findByPropertyType(String propertyType);

    /**
     * Tìm property theo tỉnh
     */
    List<Property> findByProvince(String province);

    /**
     * Tìm property theo tỉnh và quận
     */
    List<Property> findByProvinceAndDistrict(String province, String district);

    /**
     * Tìm property được tạo bởi user
     */
    List<Property> findByCreatedBy(User createdBy);

    /**
     * Tìm property được gán cho user
     */
    List<Property> findByAssignedTo(User assignedTo);

    /**
     * Tìm property theo khoảng giá
     */
    List<Property> findByPriceBetween(BigDecimal minPrice, BigDecimal maxPrice);

    /**
     * Tìm property theo khoảng diện tích
     */
    List<Property> findByAreaBetween(BigDecimal minArea, BigDecimal maxArea);

    /**
     * Tìm kiếm property theo nhiều tiêu chí (Custom Query)
     */
    @Query("SELECT p FROM Property p WHERE " +
           "(:status IS NULL OR p.status = :status) AND " +
           "(:propertyType IS NULL OR p.propertyType = :propertyType) AND " +
           "(:province IS NULL OR p.province = :province) AND " +
           "(:district IS NULL OR p.district = :district) AND " +
           "(:minPrice IS NULL OR p.price >= :minPrice) AND " +
           "(:maxPrice IS NULL OR p.price <= :maxPrice) AND " +
           "(:minArea IS NULL OR p.area >= :minArea) AND " +
           "(:maxArea IS NULL OR p.area <= :maxArea)")
    Page<Property> searchProperties(
        @Param("status") String status,
        @Param("propertyType") String propertyType,
        @Param("province") String province,
        @Param("district") String district,
        @Param("minPrice") BigDecimal minPrice,
        @Param("maxPrice") BigDecimal maxPrice,
        @Param("minArea") BigDecimal minArea,
        @Param("maxArea") BigDecimal maxArea,
        Pageable pageable
    );

    /**
     * Tìm kiếm property theo title hoặc description
     */
    @Query("SELECT p FROM Property p WHERE " +
           "LOWER(p.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(p.description) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    Page<Property> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);
}
