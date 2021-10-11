import axios from 'axios'
import { createStore, applyMiddleware } from "redux";
import { createLogger } from "redux-logger";
import thunkMiddleware from "redux-thunk";
import { composeWithDevTools } from "redux-devtools-extension";

const CREATE_USER = 'CREATE_USER'
const SET_USERS = 'SET_USERS'

// action type
const createUser = (user) => ({
  type: CREATE_USER,
  user
})

const setUsers = (users) => ({
  type: SET_USERS,
  users
})

// thunk
export const createUserThunk = (user) => {
  return async (dispatch) => {
    try {
      const { data } = await axios.post(`/api/users`, user);
      dispatch(createUser(data))
    } catch (error) {
      return dispatch(createUser({ error: error }))
    }
  }
}

export const setUsersThunk = () => {
  return async (dispatch) => {
    const { data } = await axios.get('/api/users');
    dispatch(setUsers(data))
  }
}

// reducer
function userReducer(state = [], action) {
  switch (action.type) {
    case CREATE_USER:
      return action.user
    case SET_USERS:
      return action.users
    default:
      return state
  }
}

// middleware
const middleware = composeWithDevTools(
  applyMiddleware(thunkMiddleware, createLogger({ collapsed: true }))
);

const store = createStore(userReducer, middleware);

export default store;
