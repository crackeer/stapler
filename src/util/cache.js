import { writeTextFile, BaseDirectory, readTextFile, exists, create, mkdir  } from '@tauri-apps/plugin-fs';

var readFile = async (name) => {
    try {
        let value = await readTextFile(name, { baseDir: BaseDirectory.AppData });
        return value
    } catch (e) {
        return ''
    }
}

var writeFile = async (name, value) => {
    try {
        let dirExists = await exists('', {
            baseDir: BaseDirectory.AppData,
        });
        if (!dirExists) {
            await mkdir('', { baseDir: BaseDirectory.AppData });
        }
        let fileExists = await exists(name, {
            baseDir: BaseDirectory.AppData,
        });
        if (!fileExists) {
            let result = await create(name, { baseDir: BaseDirectory.AppData });
        }
        return await writeTextFile(name, value, { baseDir: BaseDirectory.AppData });
    } catch (e) {
        alert(e)
        return false;
    }
}

export default {
    readFile, writeFile
}