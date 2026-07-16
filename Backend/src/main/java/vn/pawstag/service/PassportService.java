package vn.pawstag.service;

import vn.pawstag.dto.response.PassportResponse;

public interface PassportService {
    PassportResponse getPassport(String ownerPrincipal, Long petId);
}
