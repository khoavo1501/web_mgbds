package com.realestate.management.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * Enable Async để gửi email không đồng bộ
 */
@Configuration
@EnableAsync
public class AsyncConfig {
}
