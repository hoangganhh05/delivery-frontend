import axios from "axios";

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD
    ? "https://delivery-management-backend-fqen.onrender.com/api/v1"
    : "http://localhost:8080/api/v1");
const API_BASE_URL = rawBaseUrl.endsWith("/")
  ? rawBaseUrl.slice(0, -1)
  : rawBaseUrl;

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  // Render free instances may need 30-50 seconds to wake after being idle.
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: Gán Bearer Token nếu có trong localStorage
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor: Bóc tách ResponseData & xử lý lỗi hệ thống/xác thực
axiosClient.interceptors.response.use(
  (response) => {
    // Backend trả về ResponseData { code, message, data } -> trả về response.data
    return response.data;
  },
  (error) => {
    const status = error.response ? error.response.status : null;
    const resData = error.response?.data;

    // Xử lý 401: Xóa thông tin đăng nhập và dispatch sự kiện
    if (status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("username");
      localStorage.removeItem("role");
      window.dispatchEvent(new Event("auth:unauthorized"));
    }

    let errorMessage = "";
    if (error.code === "ECONNABORTED") {
      errorMessage = "Dịch vụ đang khởi động lâu hơn dự kiến. Vui lòng đợi một chút rồi thử lại.";
    }
    if (resData) {
      if (resData.message && resData.message !== "INVALID_INPUT") {
        errorMessage = resData.message;
      } else if (resData.error) {
        errorMessage = resData.error;
      } else if (resData.data && typeof resData.data === "object") {
        errorMessage = Object.values(resData.data).filter(Boolean).join(", ");
      }
    }

    if (!errorMessage) {
      errorMessage =
        error.message || "Không thể kết nối. Vui lòng thử lại sau";
    }

    const customError = new Error(errorMessage);
    (customError as any).response = error.response;
    (customError as any).status = status;
    return Promise.reject(customError);
  },
);

export default axiosClient;
