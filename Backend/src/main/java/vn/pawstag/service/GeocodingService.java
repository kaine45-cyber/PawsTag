package vn.pawstag.service;

public interface GeocodingService {
    /** Đổi lat/lng → tên địa điểm (vd "Hoan Kiem District, Hanoi"). null nếu không tra được. */
    String reverse(Double lat, Double lng);
}
