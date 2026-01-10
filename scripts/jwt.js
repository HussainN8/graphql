// @ts-check
const TokenName = "hasura-jwt-token" 

/**
 * @param {string} email
 * @param {string} password
 */
export const fetchJWT = async (email, password) => {
    const encoded_creds = btoa(email+":"+password);
    const token = await fetch("https://learn.reboot01.com/api/auth/signin", {
        "method": "POST",
        "headers": {"Authorization": `Basic ${encoded_creds}`}
    })
    if (!token.ok) {
        return undefined;
    }
    return token.json();
}

/**
 * @param {string} token
 */
export const setJWT = (token) => {
    window.localStorage.setItem(TokenName, token);
}

export const getJWT = () => {
    return window.localStorage.getItem(TokenName);
}

export const clearJWT = () => {
    window.localStorage.setItem(TokenName, "");
}