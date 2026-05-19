package com.realestate.management.service;

import com.realestate.management.dto.LeadDTO;
import com.realestate.management.dto.LeadRequest;
import com.realestate.management.entity.Lead;
import com.realestate.management.entity.Property;
import com.realestate.management.entity.User;
import com.realestate.management.repository.LeadRepository;
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
public class LeadService {

    @Autowired private LeadRepository leadRepository;
    @Autowired private PropertyRepository propertyRepository;
    @Autowired private UserRepository userRepository;

    /** Lấy danh sách lead theo role */
    public List<LeadDTO> getMyLeads() {
        User currentUser = getCurrentUser();
        List<Lead> leads;

        if ("broker".equalsIgnoreCase(currentUser.getRole())) {
            leads = leadRepository.findByAssignedTo(currentUser);
        } else {
            leads = leadRepository.findAll(); // admin
        }

        return leads.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    /** Tạo lead mới */
    @Transactional
    public LeadDTO createLead(LeadRequest request) {
        User broker = getCurrentUser();

        Lead lead = new Lead();
        lead.setCustomerName(request.getCustomerName());
        lead.setCustomerPhone(request.getCustomerPhone());
        lead.setStatus("new");
        lead.setAssignedTo(broker);

        if (request.getPropertyId() != null) {
            Property property = propertyRepository.findById(request.getPropertyId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy BĐS ID: " + request.getPropertyId()));
            lead.setProperty(property);
        }

        return convertToDTO(leadRepository.save(lead));
    }

    /** Cập nhật trạng thái lead */
    @Transactional
    public LeadDTO updateLeadStatus(Long id, String status) {
        if (!status.matches("new|contacted")) {
            throw new RuntimeException("Trạng thái không hợp lệ: " + status);
        }
        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lead ID: " + id));
        lead.setStatus(status);
        return convertToDTO(leadRepository.save(lead));
    }

    /** Xóa lead */
    @Transactional
    public void deleteLead(Long id) {
        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lead ID: " + id));
        leadRepository.delete(lead);
    }

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User không tồn tại"));
    }

    private LeadDTO convertToDTO(Lead lead) {
        LeadDTO dto = new LeadDTO();
        dto.setLeadId(lead.getLeadId());
        dto.setCustomerName(lead.getCustomerName());
        dto.setCustomerPhone(lead.getCustomerPhone());
        dto.setStatus(lead.getStatus());
        dto.setCreatedAt(lead.getCreatedAt());

        if (lead.getProperty() != null) {
            dto.setPropertyId(lead.getProperty().getPropertyId());
            dto.setPropertyTitle(lead.getProperty().getTitle());
        }
        if (lead.getAssignedTo() != null) {
            dto.setAssignedToId(lead.getAssignedTo().getUserId());
            dto.setAssignedToName(lead.getAssignedTo().getFullName());
        }
        return dto;
    }
}
