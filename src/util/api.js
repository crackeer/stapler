import { fetch, Body } from '@tauri-apps/api/http';
import common from './common'
import lodash from 'lodash'


const get = async (url, query, headers) => {
    //url = formatURL(url)
    if (query != null) {
        url = url + '?' + common.httpBuildQuery(query)
    }
    try {
        let result = await fetch(url, {
            method: 'GET',
            headers,
        })
        console.log("GET", url, query, result)
        return result.data
    } catch (e) {
        return {
            "code": -101,
            "status": e,
            "data": null,
        }
    }
}

const post = async (url, data, headers) => {
    //url = formatURL(url)
    headers = lodash.merge({
        'Content-Type': 'application/json'
    }, headers)
    try {
        let result = await fetch(url, {
            method: 'POST',
            timeout: 1,
            body: Body.json(data),
            headers: headers,
        })
        console.log("POST", url, data, result)
        return result.data
    } catch (e) {
        console.log(e)
        return {
            "code": -101,
            "status": e,
            "data": null,
        }

    }
}

const patch = async (url, data, headers) => {
   // url = formatURL(url)
    try {
        let result = await fetch(url, {
            method: 'PATCH',
            timeout: 5,
            body: Body.json(data),
            headers: headers,
        })
        console.log("PATCH", url, data, result)
        return result.data
    } catch (e) {
        console.log(e)
        return {
            "code": -101,
            "status": e,
            "data": null,
        }

    }
}

var getGithubGists = async (token) => {
    let result = await get('https://api.github.com/gists', {}, {
        Authorization: 'Bearer ' + token,
    })
    return result
}

var getGithubGist = async (token, gistID) => {
    let result = await get('https://api.github.com/gists/' + gistID, {}, {
        Authorization: 'Bearer ' + token,
    })
    return result
}

var getGithubGistFile = async (fileURL) => {
    let result = await get(fileURL, {}, {})
    return result
}

var updateGithubGistFile = async (token, gistID, name, content) => {
    let files = {}
    files[name] = content
    let result = await patch('https://api.github.com/gists/' + gistID, {
        "description":"An updated gist description",
        "files" : files
    }, {
        Authorization: 'Bearer ' + token,
    })
    return result
}

export default {
    getGithubGists, getGithubGist, getGithubGistFile, updateGithubGistFile
}