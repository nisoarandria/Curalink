package com.curalink;

import com.curalink.config.AdminAccountProperties;
import com.curalink.config.GeminiProperties;
import com.curalink.config.JwtProperties;
import com.curalink.config.ServiceItemStorageProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties({
		JwtProperties.class,
		AdminAccountProperties.class,
		ServiceItemStorageProperties.class,
		GeminiProperties.class
})
public class CuralinkApplication {

	public static void main(String[] args) {
		SpringApplication.run(CuralinkApplication.class, args);
	}

}
