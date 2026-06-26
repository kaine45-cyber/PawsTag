package vn.pawstag.security;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import vn.pawstag.entity.Owner;
import vn.pawstag.repository.OwnerRepository;

import java.util.List;

/**
 * Nạp UserDetails theo email cho Spring Security.
 * Mật khẩu rỗng nếu là tài khoản OAuth (không đăng nhập bằng password).
 */
@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final OwnerRepository ownerRepository;

    public CustomUserDetailsService(OwnerRepository ownerRepository) {
        this.ownerRepository = ownerRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Owner owner = ownerRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Owner not found: " + email));

        return new User(
                owner.getEmail(),
                owner.getPasswordHash() != null ? owner.getPasswordHash() : "",
                List.of(new SimpleGrantedAuthority("ROLE_" + owner.getRole()))
        );
    }
}
