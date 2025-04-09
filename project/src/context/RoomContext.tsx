import React, { createContext, useContext, useReducer } from 'react';
import { Room } from '../types/room';

interface RoomState {
  rooms: Room[];
  selectedRoom: Room | null;
}

type RoomAction =
  | { type: 'ADD_ROOM'; payload: Room }
  | { type: 'UPDATE_ROOM'; payload: Room }
  | { type: 'DELETE_ROOM'; payload: string }
  | { type: 'SELECT_ROOM'; payload: Room | null }
  | { type: 'INITIALIZE_ROOMS'; payload: Room[] };

const initialState: RoomState = {
  rooms: [],
  selectedRoom: null,
};

const RoomContext = createContext<{
  state: RoomState;
  dispatch: React.Dispatch<RoomAction>;
}>({ state: initialState, dispatch: () => null });

function roomReducer(state: RoomState, action: RoomAction): RoomState {
  switch (action.type) {
    case 'INITIALIZE_ROOMS':
      return {
        ...state,
        rooms: action.payload,
      };
    case 'ADD_ROOM':
      return {
        ...state,
        rooms: [...state.rooms, action.payload],
      };
    case 'UPDATE_ROOM':
      return {
        ...state,
        rooms: state.rooms.map((room) =>
          room.id === action.payload.id ? action.payload : room
        ),
      };
    case 'DELETE_ROOM':
      return {
        ...state,
        rooms: state.rooms.filter((room) => room.id !== action.payload),
      };
    case 'SELECT_ROOM':
      return {
        ...state,
        selectedRoom: action.payload,
      };
    default:
      return state;
  }
}

export function RoomProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(roomReducer, initialState);

  return (
    <RoomContext.Provider value={{ state, dispatch }}>
      {children}
    </RoomContext.Provider>
  );
}

export function useRoom() {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error('useRoom must be used within a RoomProvider');
  }
  return context;
}