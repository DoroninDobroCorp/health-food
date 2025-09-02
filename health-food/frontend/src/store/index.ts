import { configureStore } from '@reduxjs/toolkit';
import { loadState, saveState, getToken } from './localStorage';
import appReducer, { initialState as appInitialState, fetchCurrentUser } from './slices/appSlice';

const loadedState = loadState();
const token = getToken();

const preloadedState = loadedState ? { ...appInitialState, ...loadedState } : undefined;
if (preloadedState && token) {
    preloadedState.token = token;
    preloadedState.isAuthenticated = true;
}


export const store = configureStore({
  reducer: {
    app: appReducer,
  },
  preloadedState: preloadedState ? { app: preloadedState } : undefined,
});

if (token) {
    store.dispatch(fetchCurrentUser());
}

store.subscribe(() => {
  const stateToSave = store.getState().app;
  const { 
      token, 
      isAuthenticated, 
      currentUser, 
      authStatus, 
      authError, 
      ...restOfState 
  } = stateToSave;
  saveState(restOfState);
  console.log('State saved to localStorage:', restOfState);
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
