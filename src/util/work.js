import invoke from './invoke'
import api from './api'

var convertWork = (work) => {
    let retData = {
        initial : work.initial,
        observers : work.observers,
        title_picture_url : work.title_picture_url,
        picture_url : work.picture_url,
    }
    let baseURL = getBaseURL(work)
    retData['base_url'] = baseURL
    console.log(baseURL)
    retData['panorama'] = parsePanorama(work, baseURL)
    let model = parseModel(work,baseURL)
    retData['model'] = model
    return retData
}

var getBaseURL = (work) => {
    let parts = work.panorama.list[0].back.split('images')
    return parts[0]
}

var parsePanorama = (work, baseURL) => {
    let list = work.panorama.list
    let newList = []
    for(var i in list) {
        newList.push({
            back : list[i].back.substr(baseURL.length),
            front : list[i].front.substr(baseURL.length),
            left : list[i].left.substr(baseURL.length),
            right : list[i].right.substr(baseURL.length),
            down : list[i].down.substr(baseURL.length),
            up : list[i].up.substr(baseURL.length),
            derived_id : list[i].derived_id,
            index : list[i].index,
        })
    }
   return {
      list : newList, count : newList.length
   }
}

var parseModel = (work, baseURL) => {
    let model = work.model
    let material_textures = []
    for(var i in model.material_textures) {
        material_textures.push(model.material_textures[i].substr(model.material_base_url.length))
    }
    console.log(material_textures)
    return {
        'file_url' : work.model.file_url.substr(baseURL.length),
        material_textures : material_textures,
        material_base_url : work.model.material_base_url.substr(baseURL.length),
        type : work.model.type,
    }
}


// js_code from: http://realsee.com
var getWorkJSONFromJSCodeList1 = (list) => {
    let getJSON = (line) => {
        let start = line.indexOf("{")
       // console.log(line)
        return JSON.parse(line.substr(start -1))
       
    }
    for(var i in list) {
        if(list[i].indexOf('work_code') > -1) {
            let parts = list[i].trim().split(';;');
            for(var j in parts) {
                if(parts[j].indexOf('__module__data') > -1) {
                    let jsonData = getJSON(parts[j])
                    return convertWork(jsonData.work)
                }
            }
        }
    }
    return null
}

var trimComment = (str) => {
    let start = str.indexOf('&lt;!-')
    let end = str.indexOf('--&gt;')
   
    return str.substring(start + 7, end)
}

// js_code from: http://open.realsee.com
var getWorkJSONFromJSCodeList2 = (list) => {
    for(var i in list) {
        if(list[i].indexOf('houseInfo') > -1) {           
            let pureJSONString = trimComment(list[i])
            let jsonData = JSON.parse(pureJSONString)
            return convertWork(jsonData.firstscreen.defaultWork)
        }
    }
    return null
}

// js_code from: https://realsee.cn
var getWorkJSONFromJSCodeList3 = async (list) => {
    for(var i in list) {
        if(list[i].indexOf('resource_code') > -1) {           
            let pureJSONString = trimComment(list[i])
            let jsonData = JSON.parse(pureJSONString)
            let pageInitData = await api.getVRPageInitData(jsonData)
            if(pageInitData.data != undefined && pageInitData.data.work != undefined) {
                return  pageInitData.data.work
            }
        }
    }
    return ''
}

var isOpenRealsee = (url) => {
    return url.indexOf('http://open.realsee.com') > -1 || url.indexOf('https://open.realsee.com') > -1
}

var isRealsee = (url) => {
    return url.indexOf('http://realsee.com') > -1 || url.indexOf('https://realsee.com') > -1
}

var isRealseeCN = (url) => {
    return url.indexOf('http://realsee.cn') > -1 || url.indexOf('https://realsee.cn') > -1
}


var getWorkJSONByURL = async (url) => {
    let jsCode = await invoke.parseJSCode(url)
    if(jsCode.length < 1) {
        return ''
    }
    if(isRealsee(url)) {
        return getWorkJSONFromJSCodeList1(jsCode)
    }

    if(isOpenRealsee(url)) {
        return getWorkJSONFromJSCodeList2(jsCode)
    }

    if(isRealseeCN(url)) {
        return getWorkJSONFromJSCodeList3(jsCode)
    }

    return ''
}

export default {
    getWorkJSONByURL
}
export {
    getWorkJSONByURL
}