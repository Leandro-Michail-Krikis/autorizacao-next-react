package com.exemplo.solicitacoes.controller;

import com.exemplo.solicitacoes.dto.LoginRequest;
import com.exemplo.solicitacoes.dto.LoginResponse;
import com.exemplo.solicitacoes.entity.Usuario;
import com.exemplo.solicitacoes.repository.UsuarioRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UsuarioRepository usuarioRepo;
    private final PasswordEncoder encoder;

    public AuthController(UsuarioRepository usuarioRepo, PasswordEncoder encoder) {
        this.usuarioRepo = usuarioRepo;
        this.encoder = encoder;
    }

    /** Só confirma se as credenciais são válidas. Não gera token. */
    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest req) {
        Usuario u = usuarioRepo.findByLogin(req.login())
                .filter(x -> encoder.matches(req.senha(), x.getSenha()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Login ou senha inválidos"));
        return new LoginResponse(u.getId(), u.getLogin(), u.getNome());
    }
}
