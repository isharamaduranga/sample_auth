package com.example.auth.service;

import com.example.auth.dto.AuthResponse;
import com.example.auth.dto.ApiMessage;
import com.example.auth.dto.LoginRequest;
import com.example.auth.dto.SignupRequest;

public interface AuthService {
    ApiMessage signup(SignupRequest request);
    AuthResponse login(LoginRequest request);
    AuthResponse currentUser(String email);
}
