package com.realestate.management.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/test")
public class TestController {

    @GetMapping
    public String test() {
        return "API is working!";
    }
    
    @GetMapping("/hello")
    public String hello() {
        return "Hello from Real Estate API!";
    }

    @org.springframework.beans.factory.annotation.Autowired
    private com.realestate.management.repository.PropertyRepository propertyRepository;

    @GetMapping("/properties")
    public String getProperties() {
        java.util.List<com.realestate.management.entity.Property> props = propertyRepository.findAll();
        StringBuilder sb = new StringBuilder();
        for (com.realestate.management.entity.Property p : props) {
            sb.append("ID: ").append(p.getPropertyId())
              .append(", Code: ").append(p.getPropertyCode())
              .append(", AssignedTo: ").append(p.getAssignedTo() != null ? p.getAssignedTo().getUserId() : "null")
              .append(", CreatedBy: ").append(p.getCreatedBy() != null ? p.getCreatedBy().getUserId() : "null")
              .append("\n");
        }
        return sb.toString();
    }
}
