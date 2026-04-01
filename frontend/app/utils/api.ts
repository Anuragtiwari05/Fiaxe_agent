import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

export const signupUser = (data: {
  name: string;
  email: string;
  password: string;
}) => API.post("/auth/signup", data);

export const loginUser = (data: {
  email: string;
  password: string;
}) => API.post("/auth/login", data);

export const sendVoice = (formData: FormData) =>
  API.post("/ai/voice", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
    },
    responseType: "blob",
  });

export default API;