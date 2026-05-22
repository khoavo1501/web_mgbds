package com.realestate.management.controller;

import com.realestate.management.dto.ApiResponse;
import com.realestate.management.dto.AppointmentDTO;
import com.realestate.management.dto.AppointmentRequest;
import com.realestate.management.service.AppointmentService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/appointments")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class AppointmentController {

    @Autowired
    private AppointmentService appointmentService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<AppointmentDTO>>> getMyAppointments() {
        return ResponseEntity.ok(ApiResponse.success("Success", appointmentService.getMyAppointments()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<AppointmentDTO>> getAppointmentById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(ApiResponse.success("Success", appointmentService.getAppointmentById(id)));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/property/{propertyId}")
    public ResponseEntity<ApiResponse<List<AppointmentDTO>>> getPropertyAppointments(@PathVariable Long propertyId) {
        try {
            return ResponseEntity.ok(ApiResponse.success("Success", appointmentService.getPropertyAppointments(propertyId)));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<AppointmentDTO>> createAppointment(@Valid @RequestBody AppointmentRequest request) {
        try {
            return ResponseEntity.ok(ApiResponse.success("Đặt lịch thành công", appointmentService.createAppointment(request)));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<AppointmentDTO>> updateAppointment(
            @PathVariable Long id,
            @RequestBody AppointmentRequest request) {
        try {
            return ResponseEntity.ok(ApiResponse.success("Cập nhật lịch thành công", appointmentService.updateAppointment(id, request)));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<String>> cancelAppointment(@PathVariable Long id) {
        try {
            appointmentService.cancelAppointment(id);
            return ResponseEntity.ok(ApiResponse.success("Hủy lịch hẹn thành công"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}
