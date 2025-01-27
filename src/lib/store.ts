import { combineReducers, configureStore } from '@reduxjs/toolkit'
import { treeSlice } from './feature/schema/treeSlice'
import { schemaSlice } from './feature/schema/schemaSlice'
import { uiSchemaSlice } from './feature/schema/uiSchemaSlice'

export const makeStore = () => {
  return configureStore({
    reducer: combineReducers({
      tree: treeSlice.reducer,
      schema: schemaSlice.reducer,
      uiSchema: uiSchemaSlice.reducer
    }),
  })
}

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']