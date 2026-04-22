package com.curalink.config;

import com.curalink.security.RequireUserTypeInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

	private final RequireUserTypeInterceptor requireUserTypeInterceptor;

	public WebMvcConfig(
			RequireUserTypeInterceptor requireUserTypeInterceptor) {
		this.requireUserTypeInterceptor = requireUserTypeInterceptor;
	}

	@Override
	public void addInterceptors(InterceptorRegistry registry) {
		registry.addInterceptor(requireUserTypeInterceptor).addPathPatterns("/api/**");
	}
}
