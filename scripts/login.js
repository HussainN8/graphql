import { clearJWT, fetchJWT, getJWT, setJWT } from "./jwt.js";
import { authError } from "./error.js";
import { validToken } from "./queries.js";




setInterval(() => {
    const token = getJWT();
    validToken(token).then(res => {
        if (res) {
            window.location.href = "/profile.html";
            return;
        }
    })
}, 5000);

document.getElementById("login-form").addEventListener("submit", async (e) => {
    e.preventDefault()
    const id = document.getElementById("login-identifier").value;
    const pass = document.getElementById("login-password").value;

    const token = await fetchJWT(id, pass);

    if (!token) {
        authError();
        return;
    } else {
        setJWT(token);
        window.location.href = "/profile.html";
        return;
    }
})
// ok
const params = new URLSearchParams(window.location.search);

console.log(params.get("error"))

if (params.get("error") === "true") {
    const sub = document.getElementById("login-subtitle");
    sub.innerHTML = "<span class=\"red\">Authentication failed!</span>, log in again to continue."
}
