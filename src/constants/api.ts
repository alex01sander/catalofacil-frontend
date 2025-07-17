export const API_URL = "http://localhost:3000";
import axios from "axios";

axios.get(`${API_URL}/produtos`).then(res => console.log(res.data));
