import {
  users, pets, workouts, userWorkouts, exercises,
  type User, type InsertUser,
  type Pet, type InsertPet,
  type Workout, type InsertWorkout,
  type UserWorkout, type InsertUserWorkout,
  type Exercise, type InsertExercise,
  type UserWorkoutWithDetails, type WorkoutWithExercises
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserStreak(id: number, streak: number): Promise<User | undefined>;
  updateUserStats(id: number, caloriesBurned: number, activeMinutes: number, completedWorkouts: number): Promise<User | undefined>;

  // Pet methods
  getPet(id: number): Promise<Pet | undefined>;
  getPetByUserId(userId: number): Promise<Pet | undefined>;
  createPet(pet: InsertPet): Promise<Pet>;
  updatePet(id: number, updates: Partial<Pet>): Promise<Pet | undefined>;
  
  // Workout methods
  getWorkout(id: number): Promise<Workout | undefined>;
  getWorkouts(): Promise<Workout[]>;
  createWorkout(workout: InsertWorkout): Promise<Workout>;
  
  // User Workout methods
  getUserWorkout(id: number): Promise<UserWorkout | undefined>;
  getUserWorkoutsByUserId(userId: number): Promise<UserWorkoutWithDetails[]>;
  getUserWorkoutWithDetails(id: number): Promise<UserWorkoutWithDetails | undefined>;
  createUserWorkout(userWorkout: InsertUserWorkout): Promise<UserWorkout>;
  completeUserWorkout(id: number): Promise<UserWorkout | undefined>;
  
  // Exercise methods
  getExercisesByWorkoutId(workoutId: number): Promise<Exercise[]>;
  getWorkoutWithExercises(workoutId: number): Promise<WorkoutWithExercises | undefined>;
  createExercise(exercise: InsertExercise): Promise<Exercise>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private pets: Map<number, Pet>;
  private workouts: Map<number, Workout>;
  private userWorkouts: Map<number, UserWorkout>;
  private exercises: Map<number, Exercise>;
  
  private userIdCounter: number;
  private petIdCounter: number;
  private workoutIdCounter: number;
  private userWorkoutIdCounter: number;
  private exerciseIdCounter: number;

  constructor() {
    this.users = new Map();
    this.pets = new Map();
    this.workouts = new Map();
    this.userWorkouts = new Map();
    this.exercises = new Map();
    
    this.userIdCounter = 1;
    this.petIdCounter = 1;
    this.workoutIdCounter = 1;
    this.userWorkoutIdCounter = 1;
    this.exerciseIdCounter = 1;
    
    // Initialize with some sample workouts
    this.initializeWorkouts();
    
    // Create a default user
    const user = this.createUser({
      username: "user",
      password: "password"
    });
    
    // Set up user and pet in the next tick to ensure proper initialization
    user.then(defaultUser => {
      this.createPet({
        userId: defaultUser.id,
        name: "Buddy",
        type: "cat"
      });
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const now = new Date();
    const id = this.userIdCounter++;
    const user: User = { 
      ...insertUser, 
      id, 
      streak: 0,
      caloriesBurned: 0,
      activeMinutes: 0,
      completedWorkouts: 0,
      createdAt: now
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserStreak(id: number, streak: number): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, streak };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateUserStats(
    id: number, 
    caloriesBurned: number, 
    activeMinutes: number, 
    completedWorkouts: number
  ): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { 
      ...user, 
      caloriesBurned: user.caloriesBurned + caloriesBurned,
      activeMinutes: user.activeMinutes + activeMinutes,
      completedWorkouts: user.completedWorkouts + completedWorkouts
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Pet methods
  async getPet(id: number): Promise<Pet | undefined> {
    return this.pets.get(id);
  }

  async getPetByUserId(userId: number): Promise<Pet | undefined> {
    return Array.from(this.pets.values()).find(pet => pet.userId === userId);
  }

  async createPet(insertPet: InsertPet): Promise<Pet> {
    const now = new Date();
    const id = this.petIdCounter++;
    const pet: Pet = {
      ...insertPet,
      id,
      type: insertPet.type || "cat", // Default to cat if type not provided
      health: 100,
      hunger: 100,
      happiness: 100,
      level: 1,
      xp: 0,
      lastFed: now,
      lastPlayed: now,
      lastGroomed: now
    };
    this.pets.set(id, pet);
    return pet;
  }

  async updatePet(id: number, updates: Partial<Pet>): Promise<Pet | undefined> {
    const pet = await this.getPet(id);
    if (!pet) return undefined;
    
    const updatedPet = { ...pet, ...updates };
    
    // Ensure values are within bounds
    if (updatedPet.health > 100) updatedPet.health = 100;
    if (updatedPet.hunger > 100) updatedPet.hunger = 100;
    if (updatedPet.happiness > 100) updatedPet.happiness = 100;
    
    this.pets.set(id, updatedPet);
    return updatedPet;
  }

  // Workout methods
  async getWorkout(id: number): Promise<Workout | undefined> {
    return this.workouts.get(id);
  }

  async getWorkouts(): Promise<Workout[]> {
    return Array.from(this.workouts.values());
  }

  async createWorkout(insertWorkout: InsertWorkout): Promise<Workout> {
    const id = this.workoutIdCounter++;
    const workout: Workout = { ...insertWorkout, id };
    this.workouts.set(id, workout);
    return workout;
  }

  // User Workout methods
  async getUserWorkout(id: number): Promise<UserWorkout | undefined> {
    return this.userWorkouts.get(id);
  }

  async getUserWorkoutsByUserId(userId: number): Promise<UserWorkoutWithDetails[]> {
    const userWorkoutsList = Array.from(this.userWorkouts.values())
      .filter(uw => uw.userId === userId);
    
    return Promise.all(userWorkoutsList.map(async uw => {
      const workout = await this.getWorkout(uw.workoutId);
      return { 
        ...uw, 
        workout: workout!
      };
    }));
  }

  async getUserWorkoutWithDetails(id: number): Promise<UserWorkoutWithDetails | undefined> {
    const userWorkout = await this.getUserWorkout(id);
    if (!userWorkout) return undefined;
    
    const workout = await this.getWorkout(userWorkout.workoutId);
    if (!workout) return undefined;
    
    return {
      ...userWorkout,
      workout
    };
  }

  async createUserWorkout(insertUserWorkout: InsertUserWorkout): Promise<UserWorkout> {
    const id = this.userWorkoutIdCounter++;
    const userWorkout: UserWorkout = {
      ...insertUserWorkout,
      id,
      completed: false,
      completedAt: null
    };
    this.userWorkouts.set(id, userWorkout);
    return userWorkout;
  }

  async completeUserWorkout(id: number): Promise<UserWorkout | undefined> {
    const userWorkout = await this.getUserWorkout(id);
    if (!userWorkout) return undefined;
    
    const completedUserWorkout: UserWorkout = {
      ...userWorkout,
      completed: true,
      completedAt: new Date()
    };
    this.userWorkouts.set(id, completedUserWorkout);
    return completedUserWorkout;
  }

  // Exercise methods
  async getExercisesByWorkoutId(workoutId: number): Promise<Exercise[]> {
    return Array.from(this.exercises.values())
      .filter(exercise => exercise.workoutId === workoutId)
      .sort((a, b) => a.order - b.order);
  }

  async getWorkoutWithExercises(workoutId: number): Promise<WorkoutWithExercises | undefined> {
    const workout = await this.getWorkout(workoutId);
    if (!workout) return undefined;
    
    const exercises = await this.getExercisesByWorkoutId(workoutId);
    
    return {
      ...workout,
      exercises
    };
  }

  async createExercise(insertExercise: InsertExercise): Promise<Exercise> {
    const id = this.exerciseIdCounter++;
    const exercise: Exercise = { ...insertExercise, id };
    this.exercises.set(id, exercise);
    return exercise;
  }

  // Helper method to initialize sample workouts
  private async initializeWorkouts() {
    // Create sample workouts
    const morningCardio = await this.createWorkout({
      name: "Morning Cardio",
      description: "Energizing cardio to start your day",
      duration: 20,
      calories: 120,
      difficulty: "Moderate",
      type: "Cardio"
    });

    const strengthTraining = await this.createWorkout({
      name: "Strength Training",
      description: "Build muscle and increase strength",
      duration: 25,
      calories: 110,
      difficulty: "Hard",
      type: "Strength"
    });

    const eveningYoga = await this.createWorkout({
      name: "Evening Yoga",
      description: "Gentle stretching to end your day",
      duration: 15,
      calories: 80,
      difficulty: "Easy",
      type: "Yoga"
    });

    // Create exercises for morning cardio
    await this.createExercise({
      workoutId: morningCardio.id,
      name: "Jumping Jacks",
      description: "Start with your feet together and arms at your sides, then jump up with your feet apart and hands overhead.",
      duration: 60,
      reps: null,
      sets: null,
      order: 1
    });

    await this.createExercise({
      workoutId: morningCardio.id,
      name: "High Knees",
      description: "Run in place, lifting your knees as high as possible with each step.",
      duration: 45,
      reps: null,
      sets: null,
      order: 2
    });

    await this.createExercise({
      workoutId: morningCardio.id,
      name: "Butt Kicks",
      description: "Run in place, kicking your heels up toward your buttocks with each step.",
      duration: 45,
      reps: null,
      sets: null,
      order: 3
    });

    // Create exercises for strength training
    await this.createExercise({
      workoutId: strengthTraining.id,
      name: "Push-ups",
      description: "Start in a high plank position and lower your body until your chest nearly touches the floor, then push back up.",
      duration: 0,
      reps: 10,
      sets: 3,
      order: 1
    });

    await this.createExercise({
      workoutId: strengthTraining.id,
      name: "Squats",
      description: "Stand with feet shoulder-width apart, then lower your body as if sitting in a chair, then stand back up.",
      duration: 0,
      reps: 15,
      sets: 3,
      order: 2
    });

    await this.createExercise({
      workoutId: strengthTraining.id,
      name: "Planks",
      description: "Hold a push-up position with your body in a straight line from head to heels.",
      duration: 30,
      reps: null,
      sets: 3,
      order: 3
    });

    // Create exercises for evening yoga
    await this.createExercise({
      workoutId: eveningYoga.id,
      name: "Downward Dog",
      description: "Stretch your entire body, focusing on your back and shoulders.",
      duration: 45,
      reps: null,
      sets: 3,
      order: 1
    });

    await this.createExercise({
      workoutId: eveningYoga.id,
      name: "Child's Pose",
      description: "A resting pose that gently stretches your lower back and hips.",
      duration: 30,
      reps: null,
      sets: 3,
      order: 2
    });

    await this.createExercise({
      workoutId: eveningYoga.id,
      name: "Cobra Pose",
      description: "Lie on your stomach and lift your chest while keeping your hips on the ground.",
      duration: 30,
      reps: null,
      sets: 3,
      order: 3
    });
  }
}

export const storage = new MemStorage();
