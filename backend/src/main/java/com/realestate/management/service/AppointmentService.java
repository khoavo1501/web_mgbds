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

    @Autowired
    private ReputationService reputationService;

    @Autowired
    private NotificationService notificationService;

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

    public AppointmentDTO getAppointmentById(Long id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        User currentUser = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));

        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        // Check permission: only customer, broker of this appointment, or admin can view
        if (!appointment.getCustomer().getUserId().equals(currentUser.getUserId()) &&
            !appointment.getBroker().getUserId().equals(currentUser.getUserId()) &&
            !"admin".equalsIgnoreCase(currentUser.getRole())) {
            throw new RuntimeException("Không có quyền xem lịch hẹn này");
        }

        return convertToDTO(appointment);
    }

    public List<AppointmentDTO> getPropertyAppointments(Long propertyId) {
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found"));

        return appointmentRepository.findByProperty(property).stream()
                .filter(appointment -> !"cancelled".equalsIgnoreCase(appointment.getStatus()))
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public boolean canBookAppointment(Long propertyId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        User customer = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));

        // Kiểm tra xem customer đã có lịch hẹn chưa hoàn thành cho BĐS này chưa
        boolean hasActiveAppointmentForProperty = appointmentRepository.findByCustomer(customer).stream()
                .anyMatch(appointment ->
                        appointment.getProperty().getPropertyId().equals(propertyId) &&
                        ("pending".equalsIgnoreCase(appointment.getStatus()) ||
                         "confirmed".equalsIgnoreCase(appointment.getStatus()) ||
                         "scheduled".equalsIgnoreCase(appointment.getStatus()) ||
                         "viewed".equalsIgnoreCase(appointment.getStatus()))
                );

        return !hasActiveAppointmentForProperty;
    }

    @Transactional
    public AppointmentDTO createAppointment(AppointmentRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        User customer = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));

        // Validate scheduledAt is required for creating appointment
        if (request.getScheduledAt() == null) {
            throw new RuntimeException("Thời gian không được để trống");
        }

        Property property = propertyRepository.findById(request.getPropertyId())
                .orElseThrow(() -> new RuntimeException("Property not found"));

        User broker = property.getAssignedTo();
        if (broker == null) {
            throw new RuntimeException("Bất động sản này hiện chưa có broker phụ trách.");
        }

        // VALIDATION 0: Kiểm tra điểm uy tín
        if (!reputationService.canBookAppointment(customer)) {
            throw new RuntimeException("Bạn không thể đặt lịch do điểm uy tín quá thấp hoặc đã đạt giới hạn số lịch hẹn.");
        }

        // VALIDATION 1: Kiểm tra xem customer đã có lịch hẹn chưa hoàn thành cho BĐS này chưa
        boolean hasActiveAppointmentForProperty = appointmentRepository.findByCustomer(customer).stream()
                .anyMatch(appointment ->
                        appointment.getProperty().getPropertyId().equals(property.getPropertyId()) &&
                        ("pending".equalsIgnoreCase(appointment.getStatus()) ||
                         "confirmed".equalsIgnoreCase(appointment.getStatus()) ||
                         "scheduled".equalsIgnoreCase(appointment.getStatus()) ||
                         "viewed".equalsIgnoreCase(appointment.getStatus()))
                );

        if (hasActiveAppointmentForProperty) {
            throw new RuntimeException("Bạn đã có lịch hẹn chưa hoàn thành cho bất động sản này. Vui lòng hoàn thành hoặc hủy lịch cũ trước khi đặt lịch mới.");
        }

        // VALIDATION 2: Kiểm tra xem customer đã đặt lịch trùng giờ ở BĐS khác chưa
        boolean hasConflictingAppointment = appointmentRepository.findByCustomer(customer).stream()
                .anyMatch(appointment ->
                        request.getScheduledAt().equals(appointment.getScheduledAt()) &&
                        ("pending".equalsIgnoreCase(appointment.getStatus()) ||
                         "confirmed".equalsIgnoreCase(appointment.getStatus()) ||
                         "scheduled".equalsIgnoreCase(appointment.getStatus()) ||
                         "viewed".equalsIgnoreCase(appointment.getStatus()))
                );

        if (hasConflictingAppointment) {
            throw new RuntimeException("Bạn đã có lịch hẹn khác vào thời gian này. Vui lòng chọn thời gian khác hoặc hủy lịch hẹn cũ.");
        }

        // VALIDATION 3: Kiểm tra xem khung giờ này đã có người khác đặt chưa
        boolean alreadyBooked = appointmentRepository.findByProperty(property).stream()
                .anyMatch(appointment ->
                        request.getScheduledAt().equals(appointment.getScheduledAt()) &&
                        ("pending".equalsIgnoreCase(appointment.getStatus()) ||
                         "confirmed".equalsIgnoreCase(appointment.getStatus()) ||
                         "scheduled".equalsIgnoreCase(appointment.getStatus()) ||
                         "viewed".equalsIgnoreCase(appointment.getStatus()))
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

        // Log for debugging
        System.out.println("=== UPDATE APPOINTMENT DEBUG ===");
        System.out.println("Current User ID: " + currentUser.getUserId());
        System.out.println("Current User Email: " + currentUser.getEmail());
        System.out.println("Current User Role: " + currentUser.getRole());
        System.out.println("Appointment Customer ID: " + appointment.getCustomer().getUserId());
        System.out.println("Appointment Broker ID: " + appointment.getBroker().getUserId());
        System.out.println("Request Status: " + request.getStatus());
        System.out.println("Request ScheduledAt: " + request.getScheduledAt());
        System.out.println("================================");

        // Only customer or broker of this appointment or admin can update
        if (!appointment.getCustomer().getUserId().equals(currentUser.getUserId()) &&
            !appointment.getBroker().getUserId().equals(currentUser.getUserId()) &&
            !"admin".equalsIgnoreCase(currentUser.getRole())) {
            System.out.println("PERMISSION DENIED: User " + currentUser.getUserId() + " cannot update appointment " + id);
            throw new RuntimeException("Không có quyền thay đổi lịch hẹn này");
        }

        // Update status first (if provided)
        if (request.getStatus() != null) {
            appointment.setStatus(request.getStatus());
        }

        // Update note (if provided)
        if (request.getNote() != null) {
            appointment.setNote(request.getNote());
        }

        // Only run reschedule logic if scheduledAt is actually being changed
        if (request.getScheduledAt() != null && !request.getScheduledAt().equals(appointment.getScheduledAt())) {
            // Lưu trạng thái cũ để kiểm tra
            String oldStatus = appointment.getStatus();
            boolean isBrokerRescheduling = "broker".equalsIgnoreCase(currentUser.getRole());
            
            // VALIDATION: Kiểm tra xem customer có lịch hẹn trùng giờ ở BĐS khác không
            boolean hasConflictingAppointment = appointmentRepository.findByCustomer(appointment.getCustomer()).stream()
                    .anyMatch(apt ->
                            !apt.getAppointmentId().equals(id) && // Không tính lịch hẹn hiện tại
                            request.getScheduledAt().equals(apt.getScheduledAt()) &&
                            ("pending".equalsIgnoreCase(apt.getStatus()) ||
                             "confirmed".equalsIgnoreCase(apt.getStatus()) ||
                             "scheduled".equalsIgnoreCase(apt.getStatus()) ||
                             "viewed".equalsIgnoreCase(apt.getStatus()))
                    );

            if (hasConflictingAppointment) {
                throw new RuntimeException("Khách hàng đã có lịch hẹn khác vào thời gian này. Vui lòng chọn thời gian khác.");
            }

            // VALIDATION: Kiểm tra xem khung giờ mới đã có người khác đặt chưa
            boolean alreadyBooked = appointmentRepository.findByProperty(appointment.getProperty()).stream()
                    .anyMatch(apt ->
                            !apt.getAppointmentId().equals(id) && // Không tính lịch hẹn hiện tại
                            request.getScheduledAt().equals(apt.getScheduledAt()) &&
                            ("pending".equalsIgnoreCase(apt.getStatus()) ||
                             "confirmed".equalsIgnoreCase(apt.getStatus()) ||
                             "scheduled".equalsIgnoreCase(apt.getStatus()) ||
                             "viewed".equalsIgnoreCase(apt.getStatus()))
                    );

            if (alreadyBooked) {
                throw new RuntimeException("Khung giờ này đã có người đặt. Vui lòng chọn thời gian khác.");
            }

            // Xử lý điểm uy tín nếu là customer dời lịch đã confirmed
            if (appointment.getCustomer().getUserId().equals(currentUser.getUserId()) &&
                ("confirmed".equalsIgnoreCase(oldStatus) || 
                 "scheduled".equalsIgnoreCase(oldStatus) || 
                 "viewed".equalsIgnoreCase(oldStatus))) {
                // Dời lịch đã confirmed cũng trừ điểm (nhưng ít hơn hủy)
                reputationService.handleRescheduleAppointment(appointment, request.getNote());
            }

            // Nếu môi giới dời lịch, gửi thông báo cho khách hàng
            if (isBrokerRescheduling) {
                String newDateTime = request.getScheduledAt().toString();
                String notificationMessage = String.format(
                    "Môi giới %s đã đề xuất dời lịch hẹn xem '%s' sang %s. Vui lòng xác nhận lại lịch hẹn mới.",
                    appointment.getBroker().getFullName(),
                    appointment.getProperty().getTitle(),
                    newDateTime
                );
                
                notificationService.createNotification(
                    appointment.getCustomer(),
                    "appointment_rescheduled",
                    "Lịch hẹn được đề xuất dời",
                    notificationMessage,
                    "customer"
                );
            }

            appointment.setScheduledAt(request.getScheduledAt());
            appointment.setStatus("pending"); // Reset to pending - customer needs to confirm
        }

        return convertToDTO(appointmentRepository.save(appointment));
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

        // Check if appointment is already completed or cancelled
        if ("completed".equalsIgnoreCase(appointment.getStatus())) {
            throw new RuntimeException("Không thể hủy lịch hẹn đã hoàn thành");
        }

        if ("cancelled".equalsIgnoreCase(appointment.getStatus())) {
            throw new RuntimeException("Lịch hẹn này đã được hủy trước đó");
        }

        // Xử lý điểm uy tín nếu là customer hủy
        if (appointment.getCustomer().getUserId().equals(currentUser.getUserId())) {
            reputationService.handleCancelAppointment(appointment, appointment.getNote());
        }

        appointment.setStatus("cancelled");
        appointmentRepository.save(appointment);
    }

    public AppointmentDTO getCancellationInfo(Long id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        User currentUser = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));

        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        // Check permission
        if (!appointment.getCustomer().getUserId().equals(currentUser.getUserId()) &&
            !appointment.getBroker().getUserId().equals(currentUser.getUserId()) &&
            !"admin".equalsIgnoreCase(currentUser.getRole())) {
            throw new RuntimeException("Không có quyền xem thông tin lịch hẹn này");
        }

        AppointmentDTO dto = convertToDTO(appointment);
        
        // Calculate hours until appointment
        long hoursUntilAppointment = java.time.Duration.between(
            java.time.LocalDateTime.now(),
            appointment.getScheduledAt()
        ).toHours();
        
        dto.setHoursUntilAppointment(hoursUntilAppointment);
        dto.setIsWithin24Hours(hoursUntilAppointment < 24 && hoursUntilAppointment > 0);
        
        return dto;
    }

    private AppointmentDTO convertToDTO(Appointment appointment) {
        AppointmentDTO dto = new AppointmentDTO();
        dto.setAppointmentId(appointment.getAppointmentId());
        dto.setScheduledAt(appointment.getScheduledAt());
        dto.setStatus(appointment.getStatus());
        dto.setNote(appointment.getNote());
        
        // Property info
        dto.setPropertyId(appointment.getProperty().getPropertyId());
        dto.setPropertyTitle(appointment.getProperty().getTitle());
        dto.setPropertyAddress(appointment.getProperty().getDistrict() + ", " + appointment.getProperty().getProvince());
        
        // Get primary image
        if (appointment.getProperty().getImages() != null && !appointment.getProperty().getImages().isEmpty()) {
            dto.setPropertyImage(appointment.getProperty().getImages().stream()
                .filter(img -> img.getIsPrimary() != null && img.getIsPrimary())
                .findFirst()
                .map(img -> img.getUrl())
                .orElse(appointment.getProperty().getImages().get(0).getUrl()));
        }
        
        // Customer info
        dto.setCustomerId(appointment.getCustomer().getUserId());
        dto.setCustomerName(appointment.getCustomer().getFullName());
        dto.setCustomerPhone(appointment.getCustomer().getPhone());
        dto.setCustomerEmail(appointment.getCustomer().getEmail());
        
        // Broker info
        dto.setBrokerId(appointment.getBroker().getUserId());
        dto.setBrokerName(appointment.getBroker().getFullName());
        dto.setBrokerEmail(appointment.getBroker().getEmail());
        
        // Contact info (nếu có, nếu không dùng customer info)
        dto.setContactName(appointment.getCustomer().getFullName());
        dto.setContactPhone(appointment.getCustomer().getPhone());
        dto.setContactEmail(appointment.getCustomer().getEmail());
        
        return dto;
    }
}
