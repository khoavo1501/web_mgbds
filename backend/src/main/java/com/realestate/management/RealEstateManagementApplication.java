package com.realestate.management;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Main Application Class
 * Hệ thống quản lý trung tâm môi giới bất động sản
 */
@SpringBootApplication
@EnableScheduling
public class RealEstateManagementApplication {

    public static void main(String[] args) {
        SpringApplication.run(RealEstateManagementApplication.class, args);
        System.out.println("=================================================");
        System.out.println("Real Estate Management System Started!");
        System.out.println("API Base URL: http://localhost:8080/api");
        System.out.println("=================================================");
    }
}
