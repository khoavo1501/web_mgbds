package com.realestate.management.repository;

import com.realestate.management.entity.Property;
import com.realestate.management.entity.PropertyImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository cho PropertyImage Entity
 */
@Repository
public interface PropertyImageRepository extends JpaRepository<PropertyImage, Long> {

    /**
     * Tìm tất cả ảnh của một property
     */
    List<PropertyImage> findByProperty(Property property);

    /**
     * Tìm tất cả ảnh của một property theo property ID
     */
    List<PropertyImage> findByPropertyPropertyId(Long propertyId);

    /**
     * Tìm ảnh chính (primary) của một property
     */
    Optional<PropertyImage> findByPropertyAndIsPrimary(Property property, Boolean isPrimary);

    /**
     * Tìm ảnh chính theo property ID
     */
    Optional<PropertyImage> findByPropertyPropertyIdAndIsPrimary(Long propertyId, Boolean isPrimary);

    /**
     * Xóa tất cả ảnh của một property
     */
    void deleteByProperty(Property property);

    /**
     * Đếm số lượng ảnh của một property
     */
    long countByProperty(Property property);
}
