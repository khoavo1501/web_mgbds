package com.realestate.management.controller;

import com.realestate.management.dto.ApiResponse;
import com.realestate.management.entity.Notification;
import com.realestate.management.entity.User;
import com.realestate.management.repository.UserRepository;
import com.realestate.management.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(originPatterns = "*")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private UserRepository userRepository;

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) return null;
        return userRepository.findByEmail(auth.getName()).orElse(null);
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getNotifications() {
        User user = getCurrentUser();
        if (user == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Unauthorized"));
        }
        
        List<Notification> notifications = notificationService.getUserNotifications(user);
        long unreadCount = notificationService.getUnreadCount(user);
        
        Map<String, Object> data = new HashMap<>();
        data.put("notifications", notifications);
        data.put("unreadCount", unreadCount);
        
        return ResponseEntity.ok(ApiResponse.success("Lấy thông báo thành công", data));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(@PathVariable Long id) {
        User user = getCurrentUser();
        if (user == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Unauthorized"));
        }
        notificationService.markAsRead(id, user);
        return ResponseEntity.ok(ApiResponse.success("Đã đánh dấu đã đọc", null));
    }

    @PatchMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead() {
        User user = getCurrentUser();
        if (user == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Unauthorized"));
        }
        notificationService.markAllAsRead(user);
        return ResponseEntity.ok(ApiResponse.success("Đã đánh dấu tất cả đã đọc", null));
    }
}
