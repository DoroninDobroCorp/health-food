const APP_STATE_KEY = 'appState';
const AUTH_TOKEN_KEY = 'authToken';

export const loadState = () => {
  try {
    const serializedState = localStorage.getItem(APP_STATE_KEY);
    if (serializedState === null) {
      return undefined;
    }
    return JSON.parse(serializedState);
  } catch (err) {
    console.error("Could not load state from localStorage", err);
    return undefined;
  }
};

export const saveState = (state: any) => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem(APP_STATE_KEY, serializedState);
  } catch (err) {
    console.error("Could not save state to localStorage", err);
  }
};


export const getToken = (): string | null => {
    return localStorage.getItem(AUTH_TOKEN_KEY);
}

export const saveToken = (token: string) => {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export const removeToken = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
}
