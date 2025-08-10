import { create } from 'zustand'
import lodash from 'lodash'
import { load } from '@tauri-apps/plugin-store';


export const fetch = async () => {
    const pageInitStore = await load('page_init_config.json', {
        autoSave: true,
    });
    try {
        let value = await pageInitStore.get(window.location.pathname);
        console.log(value);
        let jsonData = JSON.parse(value);
        return jsonData;
    } catch (error) {
        return null;
    }
}

export const update = async (item) => {
    const pageInitStore = await load('page_init_config.json', {
        autoSave: true,
    });
    let page = window.location.pathname
    try {
        let oldValue = await pageInitStore.get(window.location.pathname);
        let jsonData = JSON.parse(oldValue);
        jsonData = lodash.merge(jsonData, item);
        await pageInitStore.set(page, JSON.stringify(jsonData));
        return newData;
    } catch (error) {
        return item
    }
}

export const usePageInitStore = create((set, get) => ({
    data: null,
    fetched: false,
    page: '',
    setPage: (page) => set({ page: page }),
    fetchConfig: async () => {
        let { page, fetched, data } = get()
        console.log(page, fetched, data);
        if (fetched) {
            return data;
        }

        let pageInitStore = await load('page_init_config.json', {
            autoSave: true,
        });
        try {
            let value = await pageInitStore.get(page);
            console.log(value);
            let jsonData = JSON.parse(value);
            set({ data: jsonData, fetched: true });
            return jsonData;
        } catch (error) {
            set({ data: null });
            return null;
        }
    },
    updateConfig: async (item) => {
        let { data, page } = get()
        let pageInitStore = await load('page_init_config.json', {
            autoSave: true
        });
        let newData = lodash.merge(data, item);
        try {
            await pageInitStore.set(page, JSON.stringify(newData));
            set((state) => {
                return {
                    data: newData
                }
            })
        } catch (error) {
            console.log(error);
        }
    },
    getData: () => get().data,
    getPage: () => get().page,
}))
