package com.realestate.management.service;

import com.realestate.management.dto.PropertyCreateRequest;
import com.realestate.management.dto.PropertyDTO;
import com.realestate.management.dto.PropertySearchRequest;
import com.realestate.management.entity.Property;
import com.realestate.management.entity.PropertyImage;
import com.realestate.management.entity.User;
import com.realestate.management.repository.PropertyImageRepository;
import com.realestate.management.repository.PropertyRepository;
import com.realestate.management.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service xử lý business logic cho Property
 */
@Service
public class PropertyService {

    @Autowired
    private PropertyRepository propertyRepository;

    @Autowired
    private PropertyImageRepository propertyImageRepository;

    @Autowired
    private UserRepository userRepository;

    /**
     * Lấy danh sách BDS với phân trang và tìm kiếm
     */
    public Page<PropertyDTO> getProperties(PropertySearchRequest searchRequest) {
        // Tạo Pageable
        Sort sort = searchRequest.getSortDirection().equalsIgnoreCase("ASC") 
            ? Sort.by(searchRequest.getSortBy()).ascending()
            : Sort.by(searchRequest.getSortBy()).descending();
        
        Pageable pageable = PageRequest.of(
            searchRequest.getPage(), 
            searchRequest.getSize(), 
            sort
        );

        Page<Property> propertyPage;
        if (!canViewAllProperties() && searchRequest.getStatus() == null) {
            searchRequest.setStatus("published");
        }

        // Nếu có keyword, tìm kiếm theo keyword
        // Nếu có các filter khác, tìm kiếm theo nhiều tiêu chí
        if (hasSearchCriteria(searchRequest)) {
            String keyword = normalizeKeyword(searchRequest.getKeyword());
            if (keyword != null) {
                propertyPage = propertyRepository.searchProperties(
                    searchRequest.getStatus(),
                    searchRequest.getPropertyType(),
                    searchRequest.getProvince(),
                    searchRequest.getDistrict(),
                    searchRequest.getMinPrice(),
                    searchRequest.getMaxPrice(),
                    searchRequest.getMinArea(),
                    searchRequest.getMaxArea(),
                    keyword,
                    pageable
                );
            } else {
                propertyPage = propertyRepository.filterProperties(
                    searchRequest.getStatus(),
                    searchRequest.getPropertyType(),
                    searchRequest.getProvince(),
                    searchRequest.getDistrict(),
                    searchRequest.getMinPrice(),
                    searchRequest.getMaxPrice(),
                    searchRequest.getMinArea(),
                    searchRequest.getMaxArea(),
                    pageable
                );
            }
        } 
        // Mặc định: Nếu không có filter gì, lấy tất cả (cho Admin) hoặc chỉ published (cho public)
        else {
            // Kiểm tra xem có authenticated user không
            try {
                if (canViewAllProperties()) {
                    // User đã đăng nhập -> Lấy tất cả BĐS
                    propertyPage = propertyRepository.findAll(pageable);
                } else {
                    // Public user -> Chỉ lấy published
                    propertyPage = propertyRepository.findByStatus("published", pageable);
                }
            } catch (Exception e) {
                // Nếu có lỗi, mặc định lấy published
                propertyPage = propertyRepository.findByStatus("published", pageable);
            }
        }

        // Convert Entity sang DTO
        return propertyPage.map(this::convertToDTO);
    }

    /**
     * Kiểm tra có tiêu chí tìm kiếm không
     */
    private boolean hasSearchCriteria(PropertySearchRequest request) {
        return request.getStatus() != null 
            || request.getPropertyType() != null
            || request.getProvince() != null
            || request.getDistrict() != null
            || request.getMinPrice() != null
            || request.getMaxPrice() != null
            || request.getMinArea() != null
            || request.getMaxArea() != null
            || (request.getKeyword() != null && !request.getKeyword().trim().isEmpty());
    }

    private String normalizeKeyword(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return null;
        }
        return keyword.trim();
    }

    private boolean canViewAllProperties() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()
                    || authentication.getPrincipal().equals("anonymousUser")) {
                return false;
            }
            return userRepository.findByEmail(authentication.getName())
                    .map(user -> "admin".equalsIgnoreCase(user.getRole()) || "broker".equalsIgnoreCase(user.getRole()))
                    .orElse(false);
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Lấy chi tiết 1 BDS theo ID
     */
    public PropertyDTO getPropertyById(Long id) {
        Property property = propertyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy BDS với ID: " + id));
        
        return convertToDTO(property);
    }

    /**
     * Tạo mới BDS (Admin/Broker)
     */
    @Transactional
    public PropertyDTO createProperty(PropertyCreateRequest request) {
        // Lấy thông tin user đang đăng nhập
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        
        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User không tồn tại"));

        // Tạo property code tự động
        String propertyCode = generatePropertyCode();

        // Tạo Property entity
        Property property = new Property();
        property.setPropertyCode(propertyCode);
        property.setTitle(request.getTitle());
        property.setDescription(request.getDescription());
        property.setPropertyType(request.getPropertyType());
        property.setProvince(request.getProvince());
        property.setDistrict(request.getDistrict());
        property.setArea(request.getArea());
        property.setPrice(request.getPrice());
        property.setStatus("pending"); // Mặc định là pending
        property.setCreatedBy(currentUser);

        // Nếu có assignedToId, gán broker phụ trách
        if (request.getAssignedToId() != null) {
            User assignedUser = userRepository.findById(request.getAssignedToId())
                    .orElseThrow(() -> new RuntimeException("Broker không tồn tại"));
            
            // Kiểm tra role phải là broker
            if (!"broker".equalsIgnoreCase(assignedUser.getRole())) {
                throw new RuntimeException("User được gán phải có role là Broker");
            }
            
            property.setAssignedTo(assignedUser);
        }

        // Lưu property
        Property savedProperty = propertyRepository.save(property);

        // Lưu hình ảnh nếu có
        if (request.getImages() != null && !request.getImages().isEmpty()) {
            List<PropertyImage> images = new ArrayList<>();
            for (PropertyCreateRequest.ImageRequest imgReq : request.getImages()) {
                PropertyImage image = new PropertyImage();
                image.setUrl(imgReq.getUrl());
                image.setIsPrimary(imgReq.getIsPrimary());
                image.setProperty(savedProperty);
                images.add(image);
            }
            propertyImageRepository.saveAll(images);
            savedProperty.setImages(images);
        }

        return convertToDTO(savedProperty);
    }

    /**
     * Cập nhật BDS
     */
    @Transactional
    public PropertyDTO updateProperty(Long id, PropertyCreateRequest request) {
        // Lấy thông tin user đang đăng nhập
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        
        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User không tồn tại"));

        Property property = propertyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy BDS với ID: " + id));

        // Nếu là Broker, chỉ được sửa BDS do mình phụ trách hoặc do mình tạo
        if ("broker".equalsIgnoreCase(currentUser.getRole())) {
            boolean isCreator = property.getCreatedBy() != null && property.getCreatedBy().getUserId().equals(currentUser.getUserId());
            boolean isAssigned = property.getAssignedTo() != null && property.getAssignedTo().getUserId().equals(currentUser.getUserId());
            if (!isCreator && !isAssigned) {
                throw new RuntimeException("Bạn không có quyền cập nhật BDS này");
            }
        }

        // Cập nhật thông tin cơ bản
        property.setTitle(request.getTitle());
        property.setDescription(request.getDescription());
        property.setPropertyType(request.getPropertyType());
        property.setProvince(request.getProvince());
        property.setDistrict(request.getDistrict());
        property.setArea(request.getArea());
        property.setPrice(request.getPrice());

        // Admin có thể gán broker
        if ("admin".equalsIgnoreCase(currentUser.getRole()) && request.getAssignedToId() != null) {
            User assignedUser = userRepository.findById(request.getAssignedToId())
                    .orElseThrow(() -> new RuntimeException("Broker không tồn tại"));
            property.setAssignedTo(assignedUser);
        }

        // Xử lý images - Xóa ảnh cũ và thêm ảnh mới
        if (request.getImages() != null && !request.getImages().isEmpty()) {
            // Xóa tất cả ảnh cũ bằng cách clear collection
            // orphanRemoval = true sẽ tự động xóa các entity bị remove khỏi collection
            if (property.getImages() != null) {
                property.getImages().clear();
            } else {
                property.setImages(new ArrayList<>());
            }
            
            // Thêm ảnh mới vào collection
            for (PropertyCreateRequest.ImageRequest imgReq : request.getImages()) {
                PropertyImage image = new PropertyImage();
                image.setUrl(imgReq.getUrl());
                image.setIsPrimary(imgReq.getIsPrimary());
                image.setProperty(property);
                property.getImages().add(image);
            }
        }

        // Lưu property (cascade sẽ tự động lưu images)
        Property savedProperty = propertyRepository.save(property);

        return convertToDTO(savedProperty);
    }

    /**
     * Xóa BDS
     */
    @Transactional
    public void deleteProperty(Long id) {
        // Lấy thông tin user đang đăng nhập
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        
        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User không tồn tại"));

        Property property = propertyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy BDS với ID: " + id));

        // Admin hoặc Broker (nếu là người tạo và đang ở trạng thái pending) mới được xóa
        if ("broker".equalsIgnoreCase(currentUser.getRole())) {
            boolean isCreator = property.getCreatedBy() != null && property.getCreatedBy().getUserId().equals(currentUser.getUserId());
            if (!isCreator || !"pending".equals(property.getStatus())) {
                throw new RuntimeException("Bạn không có quyền xóa BDS này, hoặc BDS đã được duyệt");
            }
        } else if (!"admin".equalsIgnoreCase(currentUser.getRole())) {
            throw new RuntimeException("Bạn không có quyền xóa BDS này");
        }

        // Xóa tất cả hình ảnh trước
        if (property.getImages() != null && !property.getImages().isEmpty()) {
            propertyImageRepository.deleteAll(property.getImages());
        }

        // Xóa property
        propertyRepository.delete(property);
    }

    /**
     * Cập nhật trạng thái BDS
     */
    @Transactional
    public PropertyDTO updatePropertyStatus(Long id, String status) {
        // Validate status
        if (!status.matches("pending|published|in_transaction|sold|rented|rejected")) {
            throw new RuntimeException("Trạng thái không hợp lệ. Chỉ chấp nhận: pending, published, sold, rented, rejected");
        }

        // Lấy thông tin user đang đăng nhập
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        
        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User không tồn tại"));

        Property property = propertyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy BDS với ID: " + id));

        // Nếu là Broker, chỉ được chuyển status của BDS do mình phụ trách
        if ("broker".equalsIgnoreCase(currentUser.getRole())) {
            if (property.getAssignedTo() == null || !property.getAssignedTo().getUserId().equals(currentUser.getUserId())) {
                throw new RuntimeException("Bạn không có quyền chuyển trạng thái BDS này");
            }
            // Broker không được chuyển sang "published" (chỉ Admin mới duyệt được)
            if ("published".equals(status)) {
                throw new RuntimeException("Chỉ Admin mới có quyền duyệt BDS");
            }
        }

        property.setStatus(status);
        Property savedProperty = propertyRepository.save(property);

        return convertToDTO(savedProperty);
    }

    /**
     * Generate mã BDS tự động (BDS-YYYY-XXXX)
     * Synchronized để tránh race condition khi nhiều user tạo đồng thời
     */
    private synchronized String generatePropertyCode() {
        int year = LocalDateTime.now().getYear();
        
        // Tìm property code lớn nhất trong năm hiện tại
        String prefix = String.format("BDS-%d-", year);
        
        // Query để tìm số lớn nhất
        List<Property> allProperties = propertyRepository.findAll();
        int maxNumber = 0;
        
        for (Property p : allProperties) {
            if (p.getPropertyCode() != null && p.getPropertyCode().startsWith(prefix)) {
                try {
                    String numberPart = p.getPropertyCode().substring(prefix.length());
                    int number = Integer.parseInt(numberPart);
                    if (number > maxNumber) {
                        maxNumber = number;
                    }
                } catch (Exception e) {
                    // Ignore invalid codes
                }
            }
        }
        
        return String.format("BDS-%d-%04d", year, maxNumber + 1);
    }

    /**
     * Convert Property Entity sang DTO
     */
    private PropertyDTO convertToDTO(Property property) {
        PropertyDTO dto = new PropertyDTO();
        dto.setPropertyId(property.getPropertyId());
        dto.setPropertyCode(property.getPropertyCode());
        dto.setTitle(property.getTitle());
        dto.setDescription(property.getDescription());
        dto.setPropertyType(property.getPropertyType());
        dto.setStatus(property.getStatus());
        dto.setProvince(property.getProvince());
        dto.setDistrict(property.getDistrict());
        dto.setArea(property.getArea());
        dto.setPrice(property.getPrice());
        dto.setCreatedAt(property.getCreatedAt());

        // Convert createdBy
        if (property.getCreatedBy() != null) {
            User creator = property.getCreatedBy();
            dto.setCreatedBy(new PropertyDTO.UserSimpleDTO(
                creator.getUserId(),
                creator.getFullName(),
                creator.getEmail(),
                creator.getPhone()
            ));
        }

        // Convert assignedTo
        if (property.getAssignedTo() != null) {
            User assigned = property.getAssignedTo();
            dto.setAssignedTo(new PropertyDTO.UserSimpleDTO(
                assigned.getUserId(),
                assigned.getFullName(),
                assigned.getEmail(),
                assigned.getPhone()
            ));
        }

        // Convert images
        if (property.getImages() != null && !property.getImages().isEmpty()) {
            List<PropertyDTO.PropertyImageDTO> imageDTOs = property.getImages().stream()
                .map(img -> new PropertyDTO.PropertyImageDTO(
                    img.getImageId(),
                    img.getUrl(),
                    img.getIsPrimary()
                ))
                .collect(Collectors.toList());
            dto.setImages(imageDTOs);
        }

        return dto;
    }
}
