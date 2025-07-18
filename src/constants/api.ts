export const API_URL = "https://catalofacil-backend.onrender.com";
import axios from "axios";

axios.get(`${API_URL}/products`).then(res => console.log(res.data));
