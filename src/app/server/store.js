import { create } from 'zustand'
import lodash from 'lodash'

export const useResultStore = create((set) => ({
    dataList: [],
    updateLast: (item) => set((state) => {
        if (state.dataList.length > 0) {
            state.dataList[state.dataList.length - 1] = lodash.merge(state.dataList[state.dataList.length - 1], item)
            return {
                dataList: [...state.dataList]
            }
        }
        return state
    }),
    addData: (item) => {
        set((state) => {
            return {
                dataList: [...state.dataList, item]
            }
        })
    },
    clearData: () => set({
        dataList: []
    }),
}))