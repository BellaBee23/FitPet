import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  streak: integer("streak").notNull().default(0),
  caloriesBurned: integer("calories_burned").notNull().default(0),
  activeMinutes: integer("active_minutes").notNull().default(0),
  completedWorkouts: integer("completed_workouts").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Pet schema
export const pets = pgTable("pets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull().default("cat"),
  health: integer("health").notNull().default(100),
  hunger: integer("hunger").notNull().default(100),
  happiness: integer("happiness").notNull().default(100),
  level: integer("level").notNull().default(1),
  xp: integer("xp").notNull().default(0),
  lastFed: timestamp("last_fed").defaultNow().notNull(),
  lastPlayed: timestamp("last_played").defaultNow().notNull(),
  lastGroomed: timestamp("last_groomed").defaultNow().notNull(),
});

// Workout schema
export const workouts = pgTable("workouts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  duration: integer("duration").notNull(), // duration in minutes
  calories: integer("calories").notNull(),
  difficulty: text("difficulty").notNull(), // 'Easy', 'Moderate', 'Hard'
  type: text("type").notNull(), // 'Cardio', 'Strength', 'Yoga', etc.
});

// User workout schema (tracks user's assigned and completed workouts)
export const userWorkouts = pgTable("user_workouts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  workoutId: integer("workout_id").notNull(),
  completed: boolean("completed").notNull().default(false),
  scheduledFor: timestamp("scheduled_for").notNull(),
  completedAt: timestamp("completed_at"),
});

// Exercises within workouts
export const exercises = pgTable("exercises", {
  id: serial("id").primaryKey(),
  workoutId: integer("workout_id").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  duration: integer("duration").notNull(), // duration in seconds
  reps: integer("reps"),
  sets: integer("sets"),
  order: integer("order").notNull(), // order within the workout
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertPetSchema = createInsertSchema(pets).pick({
  userId: true,
  name: true,
  type: true,
});

export const insertWorkoutSchema = createInsertSchema(workouts);

export const insertUserWorkoutSchema = createInsertSchema(userWorkouts).pick({
  userId: true,
  workoutId: true,
  scheduledFor: true,
});

export const insertExerciseSchema = createInsertSchema(exercises);

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertPet = z.infer<typeof insertPetSchema>;
export type Pet = typeof pets.$inferSelect;

export type InsertWorkout = z.infer<typeof insertWorkoutSchema>;
export type Workout = typeof workouts.$inferSelect;

export type InsertUserWorkout = z.infer<typeof insertUserWorkoutSchema>;
export type UserWorkout = typeof userWorkouts.$inferSelect;

export type InsertExercise = z.infer<typeof insertExerciseSchema>;
export type Exercise = typeof exercises.$inferSelect;

// Extended types for frontend use
export type UserWorkoutWithDetails = UserWorkout & {
  workout: Workout;
};

export type WorkoutWithExercises = Workout & {
  exercises: Exercise[];
};

export interface UserProgress {
  completed: number;
  total: number;
  percentage: number;
}

// Pet types and states
export type PetState = "happy" | "sad" | "tired" | "hungry" | "excited" | "sleeping";
export type PetType = "cat" | "dog" | "rabbit" | "fox" | "hamster";
