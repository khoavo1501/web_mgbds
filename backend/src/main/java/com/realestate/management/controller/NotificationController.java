package com.realestate.management.controller;

import com.realestate.management.dto.ApiResponse;
import com.realestate.management.entity.Notification;
import com.realestate.management.entity.User;
import com.realestate.management.repository.NotificationRepository;
import com.realestate.management.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

/**
 * FIX LỖI 7: Controller để user xem và quản lý thông báo
 */
@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
@Tag(name = "Notification Management", description = "APIs quản lý thông báo")
public class NotificationController {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    /**
     * Lấy danh sách thông báo của user hiện tại
     */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Lấy danh sách thông báo", 
               description = "User xem tất cả thông báo của mình")
    public ResponseEntity<ApiResponse<Page<Notification>>> getMyNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String email = authentication.getName();
            User currentUser = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            Sort sort = Sort.by("createdAt").descending();
            Pageable pageable = PageRequest.of(page, size, sort);
            
            Page<Notification> notifications = notificationRepository.findByUser(currentUser, pageable);
            
            return ResponseEntity.ok(
                ApiResponse.success("Lấy danh sách thông báo thành công", notifications)
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Lỗi khi lấy thông báo: " + e.getMessage()));
        }
    }

    /**
     * Lấy số lượng thông báo chưa đọc
     */
    @GetMapping("/unread-count")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Đếm thông báo chưa đọc", 
               description = "Lấy số lượng thông báo chưa đọc của user")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String email = authentication.getName();
            User currentUser = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            long count = notificationRepository.countByUserAndIsRead(currentUser, false);
            
            return ResponseEntity.ok(
                ApiResponse.success("Lấy số lượng thông báo chưa đọc thành công", count)
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Lỗi khi đếm thông báo: " + e.getMessage()));
        }
    }

    /**
     * Đánh dấu 1 thông báo đã đọc
     */
    @PatchMapping("/{id}/read")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Đánh dấu đã đọc", 
               description = "Đánh dấu 1 thông báo đã đọc")
    public ResponseEntity<ApiResponse<Notification>> markAsRead(@PathVariable Long id) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String email = authentication.getName();
            User currentUser = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            Notification notification = notificationRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Notification not found"));

            // Kiểm tra quyền
            if (!notification.getUser().getUserId().equals(currentUser.getUserId())) {
                throw new RuntimeException("Không có quyền truy cập thông báo này");
            }

            notification.setIsRead(true);
            Notification updated = notificationRepository.save(notification);
            
            return ResponseEntity.ok(
                ApiResponse.success("Đánh dấu đã đọc thành công", updated)
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Lỗi khi đánh dấu đã đọc: " + e.getMessage()));
        }
    }

    /**
     * Đánh dấu tất cả thông báo đã đọc
     */
    @PatchMapping("/read-all")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Đánh dấu tất cả đã đọc", 
               description = "Đánh dấu tất cả thông báo đã đọc")
    public ResponseEntity<ApiResponse<String>> markAllAsRead() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String email = authentication.getName();
            User currentUser = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            notificationRepository.markAllAsReadByUser(currentUser.getUserId());
            
            return ResponseEntity.ok(
                ApiResponse.success("Đánh dấu tất cả đã đọc thành công")
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Lỗi khi đánh dấu tất cả đã đọc: " + e.getMessage()));
        }
    }

    /**
     * Xóa 1 thông báo
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Xóa thông báo", 
               description = "Xóa 1 thông báo")
    public ResponseEntity<ApiResponse<String>> deleteNotification(@PathVariable Long id) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String email = authentication.getName();
            User currentUser = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            Notification notification = notificationRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Notification not found"));

            // Kiểm tra quyền
            if (!notification.getUser().getUserId().equals(currentUser.getUserId())) {
                throw new RuntimeException("Không có quyền xóa thông báo này");
            }

            notificationRepository.delete(notification);
            
            return ResponseEntity.ok(
                ApiResponse.success("Xóa thông báo thành công")
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Lỗi khi xóa thông báo: " + e.getMessage()));
        }
    }
}
