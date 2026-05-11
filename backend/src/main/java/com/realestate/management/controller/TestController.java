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
}
