package com.microservice.user.microservice_user.controller;

import com.microservice.user.microservice_user.dto.Auth;
import com.microservice.user.microservice_user.dto.LoginRequest;
import com.microservice.user.microservice_user.dto.RegisterRequest;
import com.microservice.user.microservice_user.service.AuthService;
import jakarta.validation.Valid;
import lombok.Data;
import org.springframework.http.HttpStatus;

import org.springframework.http.ResponseEntity;

import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Data
@RestController
@RequestMapping("api/auth")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<String> register(@Valid @RequestBody RegisterRequest registerRequest, BindingResult bindingResult){

        authService.registerUser(registerRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body("Registrado");
    }

    @PostMapping("/login")
    public ResponseEntity<Auth> login(@RequestBody LoginRequest loginRequest){
        Auth auth = authService.login(loginRequest);
        return ResponseEntity.ok(auth);
    }

    @PostMapping("ValidateToken")
    public ResponseEntity<String> validateToken(@RequestBody Auth auth){
        String token = auth.getToken();
        if (token == null || token.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Token is missing");
        }
        return ResponseEntity.ok("Token is valid");
    }
}
