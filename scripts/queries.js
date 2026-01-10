// @ts-check

const API = "https://learn.reboot01.com/api/graphql-engine/v1/graphql";
const ErrorMsg = "ERROR 505 - Couldn't fetch the data.";

/**
 * @param {string} query
 * @param {string} token
 */
const fetchData = async (query, token) => {
    const res = await fetch(API, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ query })
    });

    const result = await res.json();

    if (result.errors) {
        console.log(result.errors)
    } else {
        return result.data;
    }
}

/**
 * @param {string} token
 */
export const getid = async (token) => {
    const query = `
    query {
        user {
            id
        }
    }
    `;
    const data = await fetchData(query, token);
    if (!data) {
        console.log(data)
        throw new Error(ErrorMsg);
    }
    return data.user[0].id;
}

/**
 * @param {string} token
 */
export const getName = async (token) => {
    const query = `
    query {
        user {
            firstName
            lastName
            login
        }
    }
    `;
    const data = await fetchData(query, token);
    if (!data) {
        console.log(data)
        throw new Error(ErrorMsg);
    }
    return [data.user[0].firstName, data.user[0].lastName, data.user[0].login];
}

/**
 * @param {string} token
 */
export const validToken = async (token) => {
    try {
        const id = await getid(token);
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * @param {string} token
 * @param {number} id
 */
// return [level Number, project String]
export const getModuleLevelNProject = async (token, id) => {
    const query = `
        query {
            transaction(
                where: {
                userId: { _eq: ${id} }
                type: { _eq: "level" }
                path: { _like: "/bahrain/bh-module/%", _nlike: "/bahrain/bh-module/%/%" }
                }
                order_by: [{ createdAt: desc }, { amount: desc }]
                limit: 1
            ) {
                amount
                object {
                    name 
                }
            }
        }
    `;
    const data = await fetchData(query, token);
    if (!data) {
        console.log(data)
        throw new Error(ErrorMsg);
    }
    return [data.transaction[0].amount, data.transaction[0].object.name];
}

/**
 * @param {string} token
 * @param {number} level
 */
export const getRank = async (token, level) => {
    const query = `
    query {
        object(
            where: { id: { _eq: 100236 } }
            limit: 1
        ) {
            ranksDefinitions: attrs(path: "$.ranksDefinitions")
        }
    }
    `
    const data = await fetchData(query, token);
    if (!data) {
        console.log(data)
        throw new Error(ErrorMsg);
    }
    const ranks = data.object[0].ranksDefinitions
    let i = '0';
    for (i in ranks) {
        if (ranks[+i].level > level) {
            if (+i != 0) i = `${+i-1}`;
            break;
        }
    }
    return ranks[+i].name;
}

/**
 * @param {string} token
 * @param {number} id
 * @param {string} type
 */
export const getAuditsXp = async (token, id, type) => {
    const query = `
    query {
        transaction(
            where: { userId: { _eq: ${id} }, type: { _eq: "${type}" } }
            order_by: { createdAt: desc }
        ) {
            amount
        }
    }
    `;
    const data = await fetchData(query, token);
    if (!data) {
        console.log(data)
        throw new Error(ErrorMsg);
    }
    let total = 0;
    for (const audit of data.transaction) {
        total += audit.amount;
    }
    return total;
}

/**
 * @param {string} token
 */
export const getSkillTypes = async (token) => {
    const query = `
    query {
        transaction(
            where: { type: { _like: "skill_%" } }
            distinct_on: type
            order_by: { type: asc }
        ) {
            type
        }
    }
    `
    const data = await fetchData(query, token);
    if (!data) {
        console.log(data)
        throw new Error(ErrorMsg);
    }
    const types = [];
    for (const entry of data.transaction) {
        types.push(entry.type.replace("skill_", ""));
    }
    return types;
}

/**
 * @param {string} token
 * @param {string[]} types
*/
export const getSkillsXp = async (token, types) => {
    let query = "query SkillSums {";
    for (const type of types) {
        query += `
        ${type.replace("-","_")}: transaction_aggregate(where: { type: { _eq: "skill_${type}" } }) {
            aggregate { sum { amount } }
        }

        `
    }
    query += "}";
    const data = await fetchData(query, token);
    if (!data) {
        console.log(data)
        throw new Error(ErrorMsg);
    }
    
    let results = {};
    for (const type of types) {
        // @ts-ignore
        results[type] = data[type.replace("-","_")].aggregate.sum.amount;
    }
        return results;
}

/**
 * @param {string} token
*/
export const getXpOverTime = async (token) => {
    const query = `
    query {
        transaction(
            where: {
              type: { _eq: "xp" }
            	path: { _like: "%/bh-module/%" }
              _or: [
                { path: { _nlike: "%/piscine%" } }
                { path: { _eq: "/bahrain/bh-module/piscine-js" } }
                { path: { _eq: "/bahrain/bh-module/piscine-rust" } }
          		]
            }
            order_by: {createdAt:asc}
        ) {
            amount
            createdAt
        }
    }
    `;
    const data = await fetchData(query, token);
    if (!data) {
        console.log(data)
        throw new Error(ErrorMsg);
    }
    return data.transaction;
}