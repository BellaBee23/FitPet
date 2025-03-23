import React, { createContext, useContext, useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { UserWorkoutWithDetails, WorkoutWithExercises, UserProgress, User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// Define mock user ID (in a real app, this would come from auth)
const USER_ID = 1;

// Define context type
interface WorkoutContextType {
  todayWorkouts: UserWorkoutWithDetails[];
  allWorkouts: UserWorkoutWithDetails[];
  currentWorkout: WorkoutWithExercises | null;
  isWorkoutTimerOpen: boolean;
  isWorkoutCompletedOpen: boolean;
  completedWorkout: UserWorkoutWithDetails | null;
  xpGained: number;
  isLoading: boolean;
  progress: UserProgress;
  caloriesBurned: number;
  activeMinutes: number;
  completedWorkouts: number;
  streak: number;
  startWorkout: (userWorkoutId: number) => void;
  completeWorkout: () => void;
  closeWorkoutTimer: () => void;
  closeWorkoutCompleted: () => void;
}

// Create context
const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

// Create provider
export const WorkoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isWorkoutTimerOpen, setIsWorkoutTimerOpen] = useState(false);
  const [isWorkoutCompletedOpen, setIsWorkoutCompletedOpen] = useState(false);
  const [currentWorkout, setCurrentWorkout] = useState<WorkoutWithExercises | null>(null);
  const [completedWorkout, setCompletedWorkout] = useState<UserWorkoutWithDetails | null>(null);
  const [xpGained, setXpGained] = useState(0);
  
  const { toast } = useToast();

  // Fetch user workouts
  const { 
    data: userWorkouts = [],
    isLoading: isLoadingWorkouts,
    refetch: refetchUserWorkouts
  } = useQuery<UserWorkoutWithDetails[]>({
    queryKey: [`/api/users/${USER_ID}/workouts`],
  });

  // Fetch user data for stats
  const {
    data: userData = {
      id: USER_ID,
      username: '',
      caloriesBurned: 0,
      activeMinutes: 0,
      completedWorkouts: 0,
      streak: 0
    },
    isLoading: isLoadingUser
  } = useQuery<User>({
    queryKey: [`/api/users/${USER_ID}`],
  });

  // Initialize workouts for user if none exist
  const initializeWorkoutsMutation = useMutation({
    mutationFn: async () => {
      // Get all available workouts
      const workoutsRes = await fetch("/api/workouts");
      const workouts = await workoutsRes.json();
      
      // Schedule each workout for today
      const today = new Date();
      const promises = workouts.map((workout: any) => 
        apiRequest("POST", `/api/users/${USER_ID}/workouts`, {
          workoutId: workout.id,
          scheduledFor: today.toISOString()
        })
      );
      
      await Promise.all(promises);
      return refetchUserWorkouts();
    },
    onSuccess: () => {
      toast({
        title: "Workouts initialized",
        description: "Your daily workouts have been set up!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error initializing workouts",
        description: String(error),
        variant: "destructive",
      });
    }
  });

  // Complete workout mutation
  const completeWorkoutMutation = useMutation({
    mutationFn: async (userWorkoutId: number) => {
      const res = await apiRequest("POST", `/api/user-workouts/${userWorkoutId}/complete`, {});
      return res.json();
    },
    onSuccess: () => {
      // Handle success in the completeWorkout function
      refetchUserWorkouts();
    },
    onError: (error) => {
      toast({
        title: "Error completing workout",
        description: String(error),
        variant: "destructive",
      });
      closeWorkoutTimer();
    }
  });

  // Filter today's workouts
  const todayWorkouts = userWorkouts.filter(workout => {
    const today = new Date();
    const scheduledDate = new Date(workout.scheduledFor);
    return (
      scheduledDate.getDate() === today.getDate() &&
      scheduledDate.getMonth() === today.getMonth() &&
      scheduledDate.getFullYear() === today.getFullYear()
    );
  });

  // Calculate progress
  const progress: UserProgress = {
    completed: todayWorkouts.filter(w => w.completed).length,
    total: todayWorkouts.length,
    percentage: todayWorkouts.length > 0 
      ? Math.round((todayWorkouts.filter(w => w.completed).length / todayWorkouts.length) * 100)
      : 0
  };

  // Get user stats
  const caloriesBurned = userData?.caloriesBurned || 0;
  const activeMinutes = userData?.activeMinutes || 0;
  const completedWorkouts = userData?.completedWorkouts || 0;
  const streak = userData?.streak || 0;

  // Initialize workouts if none exist
  const [hasInitialized, setHasInitialized] = useState(false);
  
  useEffect(() => {
    if (!isLoadingWorkouts && userWorkouts.length === 0 && !hasInitialized && !initializeWorkoutsMutation.isPending) {
      setHasInitialized(true);
      initializeWorkoutsMutation.mutate();
    }
  }, [isLoadingWorkouts, userWorkouts.length, initializeWorkoutsMutation, hasInitialized]);

  // Start a workout
  const startWorkout = async (userWorkoutId: number) => {
    try {
      // Find the user workout
      const userWorkout = userWorkouts.find(uw => uw.id === userWorkoutId);
      if (!userWorkout) {
        throw new Error("Workout not found");
      }

      // Get workout with exercises
      const res = await fetch(`/api/workouts/${userWorkout.workoutId}/exercises`);
      const workoutWithExercises: WorkoutWithExercises = await res.json();
      
      // Set current workout and open timer
      setCurrentWorkout(workoutWithExercises);
      setIsWorkoutTimerOpen(true);
    } catch (error) {
      toast({
        title: "Error starting workout",
        description: String(error),
        variant: "destructive",
      });
    }
  };

  // Complete a workout
  const completeWorkout = async () => {
    try {
      if (!currentWorkout) return;
      
      // Find the user workout for this workout
      const userWorkout = userWorkouts.find(uw => uw.workoutId === currentWorkout.id);
      if (!userWorkout) {
        throw new Error("User workout not found");
      }
      
      // Only complete if not already completed
      if (!userWorkout.completed) {
        await completeWorkoutMutation.mutateAsync(userWorkout.id);
        
        // Calculate XP gained (based on calories)
        const xpGain = Math.round(currentWorkout.calories / 5);
        setXpGained(xpGain);
        
        // Update user stats - pet will be updated elsewhere
        await apiRequest("POST", `/api/users/${USER_ID}/stats`, {
          caloriesBurned: currentWorkout.calories,
          activeMinutes: Math.round(currentWorkout.duration / 60),
          completedWorkouts: 1
        });
        
        // Set completed workout for display in modal
        setCompletedWorkout(userWorkout);
      }
      
      // Close timer modal and open completed modal
      setIsWorkoutTimerOpen(false);
      setIsWorkoutCompletedOpen(true);
    } catch (error) {
      toast({
        title: "Error completing workout",
        description: String(error),
        variant: "destructive",
      });
      closeWorkoutTimer();
    }
  };

  // Close modals
  const closeWorkoutTimer = () => {
    setIsWorkoutTimerOpen(false);
    setCurrentWorkout(null);
  };

  const closeWorkoutCompleted = () => {
    setIsWorkoutCompletedOpen(false);
    setCompletedWorkout(null);
    setXpGained(0);
  };

  // Loading state
  const isLoading = isLoadingWorkouts || isLoadingUser;

  return (
    <WorkoutContext.Provider
      value={{
        todayWorkouts,
        allWorkouts: userWorkouts,
        currentWorkout,
        isWorkoutTimerOpen,
        isWorkoutCompletedOpen,
        completedWorkout,
        xpGained,
        isLoading,
        progress,
        caloriesBurned,
        activeMinutes,
        completedWorkouts,
        streak,
        startWorkout,
        completeWorkout,
        closeWorkoutTimer,
        closeWorkoutCompleted
      }}
    >
      {children}
    </WorkoutContext.Provider>
  );
};

// Custom hook to use workout context
export const useWorkout = () => {
  const context = useContext(WorkoutContext);
  if (!context) {
    throw new Error("useWorkout must be used within a WorkoutProvider");
  }
  return context;
};
