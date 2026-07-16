package vn.pawstag.dto.response;

/** Nonce chống replay cho Google login — frontend truyền vào GIS initialize. */
public record GoogleNonceResponse(String nonce) {}
