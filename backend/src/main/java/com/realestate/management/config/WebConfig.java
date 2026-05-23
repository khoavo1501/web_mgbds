package com.realestate.management.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${app.upload.image-dir:images}")
    private String imageDir;

    @Value("${app.upload.document-dir:documents}")
    private String documentDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path uploadPath = Paths.get(imageDir).toAbsolutePath().normalize();
        registry
                .addResourceHandler("/images/**")
                .addResourceLocations(uploadPath.toUri().toString());

        Path documentPath = Paths.get(documentDir).toAbsolutePath().normalize();
        registry
                .addResourceHandler("/documents/**")
                .addResourceLocations(documentPath.toUri().toString());
    }
}
