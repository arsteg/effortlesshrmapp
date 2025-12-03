import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Task } from '../../types';

interface TaskState {
    tasks: Task[];
    selectedTask: Task | null;
    isLoading: boolean;
    error: string | null;
}

const initialState: TaskState = {
    tasks: [],
    selectedTask: null,
    isLoading: false,
    error: null,
};

const taskSlice = createSlice({
    name: 'task',
    initialState,
    reducers: {
        setTasks: (state, action: PayloadAction<Task[]>) => {
            state.tasks = action.payload;
        },
        setSelectedTask: (state, action: PayloadAction<Task | null>) => {
            state.selectedTask = action.payload;
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },
        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },
    },
});

export const { setTasks, setSelectedTask, setLoading, setError } = taskSlice.actions;
export default taskSlice.reducer;
