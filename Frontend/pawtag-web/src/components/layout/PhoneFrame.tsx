// Mobile web container — full-screen, không còn khung iPhone giả.
// Trên desktop tự giới hạn bề rộng cho dễ nhìn; trên điện thoại fill toàn màn hình.

import BottomNav from "./BottomNav";

interface PhoneFrameProps {
  children: React.ReactNode;
}

export default function PhoneFrame({ children }: PhoneFrameProps) {
  return (
    // h-screen + overflow-y-auto: khung TỰ cuộn thay vì để <html>/<body> cuộn toàn trang.
    // Trên desktop (khung hẹp căn giữa màn rộng), việc này giữ thanh cuộn bám sát mép
    // khung 480px thay vì trôi ra mép cửa sổ trình duyệt, cách xa nội dung hiển thị.
    <div className="relative flex flex-col h-screen w-full max-w-[480px] mx-auto bg-[#F7F9FC] overflow-y-auto overscroll-contain">
      <main className="flex-1 pb-[88px]">{children}</main>

      {/* Bottom nav cố định, canh theo bề rộng container */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-50">
        <BottomNav />
      </div>
    </div>
  );
}
