import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Task ,Project} from '../../types';

interface TaskState {
    tasks: Task[];
    selectedTask: Task | null;
    projects: Project[];
    selectedProject: Project | null;
    isLoading: boolean;
    error: string | null;
}

const initialState: TaskState = {
    tasks: [],
    selectedTask: null,
    projects: [],
    selectedProject: null,
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
        setProjects: (state, action: PayloadAction<Project[]>) => {
            state.projects = action.payload;
        },
        setSelectedProject: (state, action: PayloadAction<Project | null>) => {
            state.selectedProject = action.payload;
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
