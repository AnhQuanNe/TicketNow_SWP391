import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api/auth",
});

export const registerUser = (data) => API.post("/register", data);
export const loginUser = (data) => API.post("/login", data);
// axios là một thư viện giúp React gửi yêu cầu HTTP (GET, POST, PUT, DELETE) đến backend của bạn — ví dụ: Node.js/Express hoặc bất kỳ server nào.

//Nó thay thế fetch() mặc định trong JavaScript, nhưng mạnh hơn, dễ dùng hơn.