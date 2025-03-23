import { apiRequest } from "./queryClient";
import { Pet, UserWorkoutWithDetails, WorkoutWithExercises, User } from "@shared/schema";

// Define the mock user ID (in a real app this would come from authentication)
const USER_ID = 1;

// Pet API functions
export const getPet = async (): Promise<Pet> => {
  const res = await fetch(`/api/users/${USER_ID}/pet`);
  if (!res.ok) throw new Error("Failed to fetch pet");
  return res.json();
};

export const feedPet = async (petId: number): Promise<Pet> => {
  const res = await apiRequest("POST", `/api/pets/${petId}/feed`, {});
  return res.json();
};

export const playWithPet = async (petId: number): Promise<Pet> => {
  const res = await apiRequest("POST", `/api/pets/${petId}/play`, {});
  return res.json();
};

export const groomPet = async (petId: number): Promise<Pet> => {
  const res = await apiRequest("POST", `/api/pets/${petId}/groom`, {});
  return res.json();
};

export const updatePet = async (petId: number, updates: Partial<Pet>): Promise<Pet> => {
  const res = await apiRequest("PATCH", `/api/pets/${petId}`, updates);
  return res.json();
};

// Workout API functions
export const getUserWorkouts = async (): Promise<UserWorkoutWithDetails[]> => {
  const res = await fetch(`/api/users/${USER_ID}/workouts`);
  if (!res.ok) throw new Error("Failed to fetch workouts");
  return res.json();
};

export const getWorkoutWithExercises = async (workoutId: number): Promise<WorkoutWithExercises> => {
  const res = await fetch(`/api/workouts/${workoutId}/exercises`);
  if (!res.ok) throw new Error("Failed to fetch workout details");
  return res.json();
};

export const completeUserWorkout = async (userWorkoutId: number): Promise<UserWorkoutWithDetails> => {
  const res = await apiRequest("POST", `/api/user-workouts/${userWorkoutId}/complete`, {});
  return res.json();
};

// User API functions
export const getUser = async (): Promise<User> => {
  const res = await fetch(`/api/users/${USER_ID}`);
  if (!res.ok) throw new Error("Failed to fetch user");
  return res.json();
};

export const updateUserStats = async (
  caloriesBurned: number,
  activeMinutes: number,
  completedWorkouts: number
): Promise<User> => {
  const res = await apiRequest("POST", `/api/users/${USER_ID}/stats`, {
    caloriesBurned,
    activeMinutes,
    completedWorkouts
  });
  return res.json();
};
