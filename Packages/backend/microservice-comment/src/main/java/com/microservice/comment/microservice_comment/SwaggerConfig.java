package com.microservice.comment.microservice_comment;

import io.swagger.v3.oas.models.OpenAPI;

import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class SwaggerConfig {
    @Bean
    public OpenAPI commentServiceAPI() {
        Server devServer = new Server();
        devServer.setUrl("http://localhost:8092");
        devServer.setDescription("Comment Service - Development");

        Info info = new Info()
                .title("Comment Service API")
                .version("1.0")
                .description("API para gestión de comentarios en eventos");

        return new OpenAPI()
                .info(info)
                .servers(List.of(devServer));
    }

}
