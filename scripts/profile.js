import { authError } from "./error.js";
import { getJWT, clearJWT } from "./jwt.js";
import { getAuditsXp, getid, getModuleLevelNProject, getName, getRank, getSkillsXp, getSkillTypes, getXpOverTime, validToken } from "./queries.js";
import { renderRadarGraph, renderXPGraph } from "./svgs.js";

const token = getJWT();
validToken(token).then(res => {
    if (!res) {
        authError();
    }
});

document.getElementById("logout-btn").addEventListener("click", (e) => {
    clearJWT();
    window.location.href = "/graphql/index.html";
    // change will ya?
});


const setNames = async (token) => {
    const usernameField = document.getElementById("username");
    const fullNameField = document.getElementById("fullname");
    try {
        const [firstName, lastName, username] = await getName(token);
        usernameField.innerText = username;
        fullNameField.innerText = `${firstName} ${lastName}`; 
    } catch (e) {
        console.log(e);
        authError();
    }
};
setNames(token);

const setSatistics = async (token) => {
    const levelFeild = document.getElementById("level");
    const rankFeild = document.getElementById("rank");
    const ratioFeild = document.getElementById("audit-ratio");

    try {
        const id = await getid(token);
        const [level] = await getModuleLevelNProject(token, id);
        levelFeild.innerText = level;

        const rank = await getRank(token, level);
        rankFeild.innerText = rank;

        const xpUp = await getAuditsXp(token, id, "up");
        const xpDown = await getAuditsXp(token, id, "down");
        ratioFeild.innerText = ( Math.round(((xpUp/xpDown)*10))/10).toFixed(1);
        console.log((xpUp/xpDown)*10)
        console.log(Math.round(((xpUp/xpDown)*10))/10)

        const types = await getSkillTypes(token);
        const skills = await getSkillsXp(token, types);
        renderRadarGraph(skills);

        const xpOTime = await getXpOverTime(token);
        renderXPGraph(xpOTime);
    } catch (e) {
        console.log(e);
        authError();
    }
}
setSatistics(token);

