package com.realestate.management.service;

import com.realestate.management.dto.AppointmentDTO;
import com.realestate.management.dto.AppointmentRequest;
import com.realestate.management.entity.Appointment;
import com.realestate.management.entity.Property;
import com.realestate.management.entity.User;
import com.realestate.management.repository.AppointmentRepository;
import com.realestate.management.repository.PropertyRepository;
import com.realestate.management.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AppointmentService {

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private PropertyRepository propertyRepository;

    @Autowired
    private UserRepository userRepository;

    public List<AppointmentDTO> getMyAppointments() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        User currentUser = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));

        List<Appointment> appointments;
        if ("customer".equalsIgnoreCase(currentUser.getRole())) {
            appointments = appointmentRepository.findByCustomer(currentUser);
        } else if ("broker".equalsIgnoreCase(currentUser.getRole())) {
            appointments = appointmentRepository.findByBroker(currentUser);
        } else {
            appointments = appointmentRepository.findAll(); // admin can see all
        }

        return appointments.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    public List<AppointmentDTO> getPropertyAppointments(Long propertyId) {
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found"));

        return appointmentRepository.findByProperty(property).stream()
                .filter(appointment -> !"cancelled".equalsIgnoreCase(appointment.getStatus()))
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public AppointmentDTO createAppointment(AppointmentRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        User customer = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));

        Property property = propertyRepository.findById(request.getPropertyId())
                .orElseThrow(() -> new RuntimeException("Property not found"));

        User broker = property.getAssignedTo();
        if (broker == null) {
            throw new RuntimeException("Bất động sản này hiện chưa có broker phụ trách.");
        }

        boolean alreadyBooked = appointmentRepository.findByProperty(property).stream()
                .anyMatch(appointment ->
                        request.getScheduledAt().equals(appointment.getScheduledAt()) &&
                        !"cancelled".equalsIgnoreCase(appointment.getStatus())
                );

        if (alreadyBooked) {
            throw new RuntimeException("Khung giờ này đã có người đặt. Vui lòng chọn thời gian khác.");
        }

        Appointment appointment = new Appointment();
        appointment.setProperty(property);
        appointment.setCustomer(customer);
        appointment.setBroker(broker);
        appointment.setScheduledAt(request.getScheduledAt());
        appointment.setNote(request.getNote());
        appointment.setStatus("pending");

        return convertToDTO(appointmentRepository.save(appointment));
    }

    @Transactional
    public AppointmentDTO updateAppointment(Long id, AppointmentRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        User currentUser = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));

        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        // Only customer or broker of this appointment or admin can update
        if (!appointment.getCustomer().getUserId().equals(currentUser.getUserId()) &&
            !appointment.getBroker().getUserId().equals(currentUser.getUserId()) &&
            !"admin".equalsIgnoreCase(currentUser.getRole())) {
            throw new RuntimeException("Không có quyền thay đổi lịch hẹn này");
        }

        if (request.getScheduledAt() != null) {
            appointment.setScheduledAt(request.getScheduledAt());
            appointment.setStatus("pending"); // If date changed, reset to pending
        }

        if (request.getStatus() != null) {
            validateStatusTransition(appointment, currentUser, request.getStatus());
            appointment.setStatus(request.getStatus());
        }

        if (request.getNote() != null) {
            appointment.setNote(request.getNote());
        }

        return convertToDTO(appointmentRepository.save(appointment));
    }

    private void validateStatusTransition(Appointment appointment, User currentUser, String nextStatus) {
        if (!nextStatus.matches("pending|confirmed|viewed|cancelled")) {
            throw new RuntimeException("Trang thai lich hen khong hop le");
        }

        boolean isBroker = appointment.getBroker().getUserId().equals(currentUser.getUserId());
        boolean isAdmin = "admin".equalsIgnoreCase(currentUser.getRole());
        if (List.of("confirmed", "viewed").contains(nextStatus) && !isBroker && !isAdmin) {
            throw new RuntimeException("Chi moi gioi phu trach moi duoc xac nhan lich hen/xem nha");
        }

        if ("viewed".equals(nextStatus) && !"confirmed".equalsIgnoreCase(appointment.getStatus())) {
            throw new RuntimeException("Can xac nhan lich hen truoc khi danh dau da dan khach di xem nha");
        }
    }

    @Transactional
    public void cancelAppointment(Long id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        User currentUser = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));

        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        // Only customer or broker of this appointment or admin can cancel
        if (!appointment.getCustomer().getUserId().equals(currentUser.getUserId()) &&
            !appointment.getBroker().getUserId().equals(currentUser.getUserId()) &&
            !"admin".equalsIgnoreCase(currentUser.getRole())) {
            throw new RuntimeException("Không có quyền hủy lịch hẹn này");
        }

        appointment.setStatus("cancelled");
        appointmentRepository.save(appointment);
    }

    private AppointmentDTO convertToDTO(Appointment appointment) {
        AppointmentDTO dto = new AppointmentDTO();
        dto.setAppointmentId(appointment.getAppointmentId());
        dto.setScheduledAt(appointment.getScheduledAt());
        dto.setStatus(appointment.getStatus());
        dto.setNote(appointment.getNote());
        dto.setPropertyId(appointment.getProperty().getPropertyId());
        dto.setPropertyTitle(appointment.getProperty().getTitle());
        dto.setCustomerId(appointment.getCustomer().getUserId());
        dto.setCustomerName(appointment.getCustomer().getFullName());
        dto.setCustomerEmail(appointment.getCustomer().getEmail());
        dto.setCustomerPhone(appointment.getCustomer().getPhone());
        dto.setBrokerId(appointment.getBroker().getUserId());
        dto.setBrokerName(appointment.getBroker().getFullName());
        return dto;
    }
}
