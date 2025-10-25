Link slide:
https://www.canva.com/design/DAG2wrl_-8k/dgTZ6x7UCKi3FXn76KXfHw/edit

## Thông tin cấu hình dự án
- **Framework:** React 18  
- **Testing Library:** Jest + @testing-library/react + @testing-library/jest-dom  
- **Node.js:** >= 18  
- **Test file:** `front-end/test/Payment.test.js`  
- **Số lượng test:** 20  
- **Môi trường chạy:** `npm test`

---

## Prompt 1: Sinh mã kiểm thử Jest
"Tạo mã kiểm thử đơn vị (unit test) cho component **TicketPayment / Payment.js** với **15 test case chính** bao gồm:

1. Tải component với vé và token hợp lệ  
2. Gọi fetch không có Authorization khi thiếu token  
3. Cắt ngắn tiêu đề sự kiện quá 25 ký tự  
4. Tính tổng tiền chính xác cho nhiều vé  
5. Xử lý giá trị null trong giá vé  
6. Xử lý giá hoặc số lượng âm  
7. Xử lý khi danh sách vé rỗng  
8. Ghi log lỗi khi lỗi mạng xảy ra  
9. Xử lý khi không có checkoutUrl trả về  
10. Xử lý lỗi API 500  
11. Hiển thị thông báo “Đang tạo link thanh toán...” ban đầu  
12. Hiển thị link thành công khi có checkoutUrl  
13. Kiểm tra chuyển hướng đúng đến checkoutUrl  
14. Đảm bảo fetch chỉ được gọi một lần khi mount  
15. Kiểm tra state `checkoutUrl` được cập nhật chính xác  

**Yêu cầu:**
- Sử dụng Jest + React Testing Library  
- Có setup/teardown (mock localStorage, fetch, window.location)  
- Dùng async/await và assertion phù hợp (`toBe`, `toEqual`, `toContain`, `toHaveBeenCalledTimes`...)  
- Mô tả test rõ ràng, đúng mục tiêu  
- Mã test dễ đọc, theo chuẩn Jest hiện đại"

---

## Prompt 2: Chọn test case để thuyết trình
"Chọn 3–4 test case tiêu biểu trong 15 case, thể hiện rõ:
- Cách tính tổng vé (logic tính toán)  
- Xử lý mô phỏng API (mock fetch)  
- Trạng thái UI và chuyển hướng thành công."

---

## Prompt 3: Mở rộng phạm vi kiểm thử
"Thêm 5 test case mới để đạt **20 test case**, tập trung vào:
- Trường hợp dữ liệu biên hoặc lỗi dữ liệu  
- Xử lý lỗi API chi tiết (404, timeout...)  
- Trạng thái UI đặc biệt (không có token, vé = 0, lỗi JSON)  
- Đảm bảo giao diện phản hồi đúng."

---

## Prompt 4: Sửa lỗi Jest
"Phân tích và khắc phục lỗi Jest khi chạy test React:
- CSS import gây lỗi parser → thêm `moduleNameMapper` để mock file `.css`  
- Thiếu `jest-dom` → cài `@testing-library/jest-dom` và import vào `setupTests.js`  
- Kiểm tra lại fetch mock để tránh kết quả sai lệch."


---

## Mục đích sử dụng trong báo cáo
- Trình bày quy trình **Prompt Engineering** để sinh test tự động.  
- Chứng minh **AI hỗ trợ kiểm thử phần mềm** hiệu quả, giúp giảm thời gian tạo test thủ công.  
- Làm tư liệu cho môn **SWP391 – Software Project**.
