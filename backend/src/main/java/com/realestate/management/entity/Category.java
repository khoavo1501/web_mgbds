package com.realestate.management.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Entity Category - Danh mục (Loại BDS, Tỉnh thành)
 * category_type: 'property_type', 'province'
 */
@Entity
@Table(name = "categories")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "category_id")
    private Long categoryId;

    @Column(name = "category_type", nullable = false, length = 50)
    private String categoryType; // 'property_type', 'province'

    @Column(name = "category_name", nullable = false, length = 255)
    private String categoryName;

    /**
     * Self-referencing relationship - Danh mục cha
     * Ví dụ: Tỉnh/Thành (parent) -> Phường/Xã/Đặc khu (child)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    @JsonIgnore // Tránh vòng lặp vô hạn
    private Category parent;

    /**
     * Danh sách danh mục con
     */
    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Category> children;

    // Constructor tiện ích
    public Category(String categoryType, String categoryName) {
        this.categoryType = categoryType;
        this.categoryName = categoryName;
    }

    public Category(String categoryType, String categoryName, Category parent) {
        this.categoryType = categoryType;
        this.categoryName = categoryName;
        this.parent = parent;
    }
}
