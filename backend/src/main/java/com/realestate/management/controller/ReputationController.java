package com.realestate.management.controller;

import com.realestate.management.dto.ApiResponse;
import com.realestate.management.dto.ReputationHistoryDTO;
import com.realestate.management.dto.ReputationScoreDTO;
import com.realestate.management.service.ReputationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reputation")
@CrossOrigin(originPatterns = "*")
public class ReputationController {

    @Autowired
    private ReputationService reputationService;

    @GetMapping("/my-score")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ReputationScoreDTO>> getMyScore() {
        try {
            return ResponseEntity.ok(ApiResponse.success("Success", reputationService.getMyReputationScore()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/history")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<ReputationHistoryDTO>>> getMyHistory() {
        try {
            return ResponseEntity.ok(ApiResponse.success("Success", reputationService.getMyReputationHistory()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/recent-history")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<ReputationHistoryDTO>>> getRecentHistory() {
        try {
            return ResponseEntity.ok(ApiResponse.success("Success", reputationService.getRecentHistory()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}
