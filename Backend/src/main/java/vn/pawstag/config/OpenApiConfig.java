package vn.pawstag.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.Components;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Khai báo OpenAPI + Bearer JWT scheme để frontend sinh type và test API.
 */
@Configuration
public class OpenApiConfig {

    private static final String BEARER = "bearerAuth";

    @Bean
    public OpenAPI pawsTagOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("PawsTag API")
                        .description("Smart QR/NFC pet identification — backend for pawtag-web")
                        .version("v0.1.0")
                        .license(new License().name("Proprietary")))
                .components(new Components().addSecuritySchemes(BEARER,
                        new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")));
    }
}
