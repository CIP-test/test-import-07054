const express = require('express')
const axios = require('axios')

const config = require('../../config.js')
const router = express.Router()

router.post('/*', postAll)
router.get('/*', getAll)
router.put('/*', putAll)
router.delete('/*', deleteAll)

const axiosConfig = {
    baseURL: config.GITHUB_URL,
    headers: { Authorization: `Bearer ${config.GITHUB_TOKEN}` },
}
const axiosInstance = axios.create(axiosConfig)

async function getAll(req, res, next) {
    try {
        const url = req.params['0']

        const response = await axiosInstance.get(url)
        await res.json(response.data)
    } catch (e) {
        next(e)
    }
}

async function postAll(req, res, next) {
    try {
        const url = req.params['0']
        const body = req.body

        const response = await axiosInstance.post(url, body)
        await res.json(response.data)
    } catch (e) {
        next(e)
    }
}

async function putAll(req, res, next) {
    try {
        const url = req.params['0']
        const body = req.body

        const response = await axiosInstance.put(url, body)
        await res.json(response.data)
    } catch (e) {
        next(e)
    }
}

async function deleteAll(req, res, next) {
    try {
        const url = req.params['0']

        const response = await axiosInstance.delete(url)
        await res.json(response.data)
    } catch (e) {
        next(e)
    }
}

module.exports = router