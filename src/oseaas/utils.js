const axios = require('axios')
const config = require('../../config.js')

const axiosInstance = axios.create({
    baseURL: config.OPENSHIFT_URL,
})

let token

async function renewToken() {
    const body = {
        grant_type: 'client_credentials',
        client_id: config.CLIENT_ID,
        client_secret: config.CLIENT_SECRET,
        redirect_uri: 'http://localhost:5000/v2/documentation/oauth2-redirect.html',
        response_type: 'code',
        scope: config.SCOPE,
    }

    const url = `${config.IAMAAS_URL}/v2/oauth2/token`
    console.log(`[INFO] POST ${url}`)

    const response = await axios.post(url, body, {
        headers: {
            'Content-Type': 'application/json',
        }
    })
    return response.data
}

async function getHeaders() {
    let expired = true
    if (token && token.expires_at) {
        expired = Date.now() >= token.expires_at
    }

    if (expired) {
        const tokenResponse = await renewToken()
        tokenResponse.expires_at = Date.now() + parseInt(tokenResponse.expires_in) * 1000
        token = tokenResponse
    }

    return {
        headers: { Authorization: `Bearer ${token.access_token}` },
    }
}

async function createProject(clusterName, projectName) {
    const body = {
        businessLine: 'GTS',
        projectSuffix: projectName,
    }

    const url = `/v1/clusters/${clusterName}/projects`
    console.log(`[INFO] POST ${url}`)

    const headers = await getHeaders()
    const response = await axiosInstance.post(url, body, headers)
    return response.data
}

async function getProjects(clusterName) {
    const url = `/v1/clusters/${clusterName}/projects`
    console.log(`[INFO] GET ${url}`)

    const headers = await getHeaders()
    const response = await axiosInstance.get(url, headers)
    const data = response.data
    const projects = []
    for (let i in data.projects) {
        const project = data.projects[i]
        if (project.endsWith(clusterName)) {
            projects.push(project.substring(0, project.length - (clusterName.length + 1)))
        }
    }

    return projects
}

async function deleteProject(clusterName, projectName) {
    const url = `/v1/clusters/${clusterName}/projects/${projectName}`
    console.log(`[INFO] DELETE ${url}`)

    const headers = await getHeaders()
    const response = await axiosInstance.delete(url, headers)
    return response.data
}

async function addRoleBinding(clusterName, projectName, userName, role) {
    const body = {
        user: userName,
        role: role,
    }

    const url = `/v1/clusters/${clusterName}/projects/${projectName}/rolebindings/users`
    console.log(`[INFO] PUT ${url}`)

    const headers = await getHeaders()
    const response = await axiosInstance.put(url, body, headers)
    return response.data
}

async function updateRoleBindingResult(operationId, actionName, username, role) {
    const result = await operationResult(operationId)
    const details = result.details
    if (details) {
        const action = details[actionName]
        if (action) {
            const openshiftAction = action[`User-${username}-${role}`]
            if (openshiftAction) {
                return openshiftAction
            }
        }
    }
}

async function getRoleBindings(clusterName, projectName) {
    const url = `/v1/clusters/${clusterName}/projects/${projectName}/rolebindings`
    console.log(`[INFO] GET ${url}`)

    const headers = await getHeaders()
    const response = await axiosInstance.get(url, headers)
    return response.data
}

async function deleteRoleBinding(clusterName, projectName, userName, role) {
    const body = {
        user: userName,
        role: role,
    }

    const url = `/v1/clusters/${clusterName}/projects/${projectName}/rolebindings/users`
    console.log(`[INFO] DELETE ${url}`)

    const config = {
        data: body,
    }
    const headers = await getHeaders()
    Object.assign(config, headers)
    const response = await axiosInstance.delete(url, config)
    return response.data
}

async function operationResult(operationId) {
    const url = `/v1/operations/${operationId}`
    console.log(`[INFO] GET ${url}`)

    const response = await axiosInstance.get(url)
    return response.data
}

module.exports = {
    createProject,
    getProjects,
    deleteProject,
    addRoleBinding,
    updateRoleBindingResult,
    getRoleBindings,
    deleteRoleBinding,
    operationResult,
}