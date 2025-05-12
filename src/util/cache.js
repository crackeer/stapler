import { writeTextFile, BaseDirectory, readTextFile } from '@tauri-apps/plugin-fs';
import dayjs from 'dayjs';

const MenuCollapsed = "MenuCollapsed";
const OpenFiles = "OpenFiles";

const VRDir = "VRDir"
const VRFiles = "VRFiles"
const Project = "Project"
const ProjectSaveDir = "ProjectSaveDir"
const CacheHost = "CacheHost"
const STATIC_SERVER = "static_server"

var get = async (key) => {
    try {
        let value =  await readTextFile(key, { dir: BaseDirectory.Cache });
        return value
    } catch(e) {
        return ''
    }
}

var set = async (key, value) => {
    try {
        return await writeTextFile(key, value, { dir: BaseDirectory.Cache });
    } catch(e) {
        return false;
    }
}

var remove = async (key) => {
    try {
        return await removeFile(key, { dir: BaseDirectory.Cache });
    } catch(e) {
        return false;
    }
}

var getJSON = async (key) => {
    try {
        let value =  await readTextFile(key, { dir: BaseDirectory.Cache });
        return JSON.parse(value)
    } catch(e) {
        return null
    }
}

var setJSON = async (key, value) => {
    try {
        return await writeTextFile(key, JSON.stringify(value), { dir: BaseDirectory.Cache });
    } catch(e) {
        return false;
    }
}


var getOpenFiles = async () => {
    let value = await get(OpenFiles)
    if(value.length < 1) {
        return []
    }
    return JSON.parse(value)
}

var addFiles = (files, addFiles) => {
    files = files.filter(item => {
        return addFiles.indexOf(item.file) < 0
    })
    let date = dayjs().format('YYYY-MM-DD')
    let time = dayjs().format('HH:mm:ss')
    for (var i in addFiles) {
        files.unshift({
            'file' : addFiles[i],
            'date' : date,
            'time' : time,
        })
    }
    return files
}

var addOpenFiles = async (add) => {
    let files = await getOpenFiles()
    files = addFiles(files, add)
    await set(OpenFiles, JSON.stringify(files))
    return files
}

var deleteOpenFiles = async (addFiles) => {
    let files = await getOpenFiles()
    files = files.filter(item => {
        return addFiles.indexOf(item.file) < 0
    })
    await set(OpenFiles, JSON.stringify(files))
    return files
}


var getStaticServerConfig = async () => {
    return await getJSON(STATIC_SERVER)
}

var setStaticServerConfig = async (config) => {
    return await setJSON(STATIC_SERVER, config)
}


export default {
    set, get, remove, setJSON, getJSON, getStaticServerConfig, setStaticServerConfig
}