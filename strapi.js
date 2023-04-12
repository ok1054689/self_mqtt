const qs = require('qs');

const axios = require('axios');


function getStrapiURL(path) {
    return `${process.env.STRAPI_API_URL || "http://localhost:1337"
        }${path}`
}
async function fetchAPI(path, urlParamsObject = {}, options = {}) {
    // Merge default and user options
    const mergedOptions = {
        headers: {
            "Content-Type": "application/json",
        },
        ...options,
    }

    // Build request URL
    const queryString = qs.stringify(urlParamsObject)
    const requestUrl = `${getStrapiURL(
        `/api${path}${queryString ? `?${queryString}` : ""}`
    )}`

    // Trigger API call
    const response = await axios.get(requestUrl, mergedOptions)

    // Handle response
    if (response.status !== 200) {
        console.error(response.statusText, response.status)
        throw new Error(`An error occured please try again`)
    }
    // console.log("response.data",response.data)
    // const data = await JSON.parse(response.data)
    return response.data
}

const getDevices = (async () => {
    try {
        const devices = await fetchAPI('/devices', {
            filters: {
                controlDeviceId: config.controlDeviceId,
            },
        })
        // console.log("devices", devices);
        return devices
        // 在这里使用devices变量做其他操作
        // ...

    } catch (error) {

        console.error(error);
        return false
    }
})