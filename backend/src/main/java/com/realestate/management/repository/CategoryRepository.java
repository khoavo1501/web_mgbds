package com.realestate.management.repository;

import com.realestate.management.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository cho Category Entity
 */
@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {

    /**
     * Tìm category theo type
     */
    List<Category> findByCategoryType(String categoryType);

    /**
     * Tìm category theo type và name
     */
    Optional<Category> findByCategoryTypeAndCategoryName(String categoryType, String categoryName);

    /**
     * Tìm các category con của một category cha
     */
    List<Category> findByParent(Category parent);

    /**
     * Tìm các category gốc (không có parent)
     */
    List<Category> findByParentIsNull();

    /**
     * Tìm category theo type và parent null (danh mục gốc)
     */
    List<Category> findByCategoryTypeAndParentIsNull(String categoryType);
}
