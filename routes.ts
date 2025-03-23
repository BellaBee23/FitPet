import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertUserSchema, insertPetSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // User routes
  app.post("/api/users", async (req: Request, res: Response) => {
    try {
      const validatedUser = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(validatedUser.username);
      
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }
      
      const user = await storage.createUser(validatedUser);
      return res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      return res.json(user);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/users/:id/stats", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const statsSchema = z.object({
        caloriesBurned: z.number().int().nonnegative(),
        activeMinutes: z.number().int().nonnegative(),
        completedWorkouts: z.number().int().nonnegative(),
      });
      
      const { caloriesBurned, activeMinutes, completedWorkouts } = statsSchema.parse(req.body);
      
      const updatedUser = await storage.updateUserStats(
        userId, 
        caloriesBurned, 
        activeMinutes, 
        completedWorkouts
      );
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      return res.json(updatedUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Pet routes
  app.post("/api/pets", async (req: Request, res: Response) => {
    try {
      const validatedPet = insertPetSchema.parse(req.body);
      const existingPet = await storage.getPetByUserId(validatedPet.userId);
      
      if (existingPet) {
        return res.status(409).json({ message: "User already has a pet" });
      }
      
      const pet = await storage.createPet(validatedPet);
      return res.status(201).json(pet);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/users/:userId/pet", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const pet = await storage.getPetByUserId(userId);
      if (!pet) {
        return res.status(404).json({ message: "Pet not found" });
      }
      
      return res.json(pet);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/pets/:id", async (req: Request, res: Response) => {
    try {
      const petId = parseInt(req.params.id);
      if (isNaN(petId)) {
        return res.status(400).json({ message: "Invalid pet ID" });
      }
      
      const updateSchema = z.object({
        health: z.number().int().min(0).max(100).optional(),
        hunger: z.number().int().min(0).max(100).optional(),
        happiness: z.number().int().min(0).max(100).optional(),
        xp: z.number().int().nonnegative().optional(),
        level: z.number().int().positive().optional(),
        type: z.enum(["cat", "dog", "rabbit", "fox", "hamster"]).optional(),
        lastFed: z.date().optional(),
        lastPlayed: z.date().optional(),
        lastGroomed: z.date().optional(),
      });
      
      const updates = updateSchema.parse(req.body);
      const updatedPet = await storage.updatePet(petId, updates);
      
      if (!updatedPet) {
        return res.status(404).json({ message: "Pet not found" });
      }
      
      return res.json(updatedPet);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Pet care routes
  app.post("/api/pets/:id/feed", async (req: Request, res: Response) => {
    try {
      const petId = parseInt(req.params.id);
      if (isNaN(petId)) {
        return res.status(400).json({ message: "Invalid pet ID" });
      }
      
      const pet = await storage.getPet(petId);
      if (!pet) {
        return res.status(404).json({ message: "Pet not found" });
      }
      
      const now = new Date();
      const updatedPet = await storage.updatePet(petId, {
        hunger: Math.min(pet.hunger + 20, 100),
        lastFed: now
      });
      
      return res.json(updatedPet);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/pets/:id/play", async (req: Request, res: Response) => {
    try {
      const petId = parseInt(req.params.id);
      if (isNaN(petId)) {
        return res.status(400).json({ message: "Invalid pet ID" });
      }
      
      const pet = await storage.getPet(petId);
      if (!pet) {
        return res.status(404).json({ message: "Pet not found" });
      }
      
      const now = new Date();
      const updatedPet = await storage.updatePet(petId, {
        happiness: Math.min(pet.happiness + 15, 100),
        hunger: Math.max(pet.hunger - 5, 0),
        lastPlayed: now
      });
      
      return res.json(updatedPet);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/pets/:id/groom", async (req: Request, res: Response) => {
    try {
      const petId = parseInt(req.params.id);
      if (isNaN(petId)) {
        return res.status(400).json({ message: "Invalid pet ID" });
      }
      
      const pet = await storage.getPet(petId);
      if (!pet) {
        return res.status(404).json({ message: "Pet not found" });
      }
      
      const now = new Date();
      const updatedPet = await storage.updatePet(petId, {
        health: Math.min(pet.health + 10, 100),
        lastGroomed: now
      });
      
      return res.json(updatedPet);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Workout routes
  app.get("/api/workouts", async (_req: Request, res: Response) => {
    try {
      const workouts = await storage.getWorkouts();
      return res.json(workouts);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/workouts/:id", async (req: Request, res: Response) => {
    try {
      const workoutId = parseInt(req.params.id);
      if (isNaN(workoutId)) {
        return res.status(400).json({ message: "Invalid workout ID" });
      }
      
      const workout = await storage.getWorkout(workoutId);
      if (!workout) {
        return res.status(404).json({ message: "Workout not found" });
      }
      
      return res.json(workout);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/workouts/:id/exercises", async (req: Request, res: Response) => {
    try {
      const workoutId = parseInt(req.params.id);
      if (isNaN(workoutId)) {
        return res.status(400).json({ message: "Invalid workout ID" });
      }
      
      const workoutWithExercises = await storage.getWorkoutWithExercises(workoutId);
      if (!workoutWithExercises) {
        return res.status(404).json({ message: "Workout not found" });
      }
      
      return res.json(workoutWithExercises);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // User workout routes
  app.get("/api/users/:userId/workouts", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const userWorkouts = await storage.getUserWorkoutsByUserId(userId);
      return res.json(userWorkouts);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/users/:userId/workouts", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const schema = z.object({
        workoutId: z.number().int().positive(),
        scheduledFor: z.string().transform(str => new Date(str)),
      });
      
      const { workoutId, scheduledFor } = schema.parse(req.body);
      
      const workout = await storage.getWorkout(workoutId);
      if (!workout) {
        return res.status(404).json({ message: "Workout not found" });
      }
      
      // Check for existing workouts for the same user, workout, and scheduled date
      const existingWorkouts = await storage.getUserWorkoutsByUserId(userId);
      const scheduledDate = new Date(scheduledFor);
      
      const isDuplicate = existingWorkouts.some(uw => {
        const existingDate = new Date(uw.scheduledFor);
        return (
          uw.workoutId === workoutId && 
          existingDate.getDate() === scheduledDate.getDate() &&
          existingDate.getMonth() === scheduledDate.getMonth() &&
          existingDate.getFullYear() === scheduledDate.getFullYear()
        );
      });
      
      if (isDuplicate) {
        // Return existing workout instead of creating a duplicate
        const existingWorkout = existingWorkouts.find(uw => uw.workoutId === workoutId);
        return res.status(200).json(existingWorkout);
      }
      
      // Create new workout assignment if no duplicate exists
      const userWorkout = await storage.createUserWorkout({
        userId,
        workoutId,
        scheduledFor
      });
      
      return res.status(201).json(userWorkout);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/user-workouts/:id/complete", async (req: Request, res: Response) => {
    try {
      const userWorkoutId = parseInt(req.params.id);
      if (isNaN(userWorkoutId)) {
        return res.status(400).json({ message: "Invalid user workout ID" });
      }
      
      const userWorkoutWithDetails = await storage.getUserWorkoutWithDetails(userWorkoutId);
      if (!userWorkoutWithDetails) {
        return res.status(404).json({ message: "User workout not found" });
      }
      
      if (userWorkoutWithDetails.completed) {
        return res.status(400).json({ message: "Workout already completed" });
      }
      
      const completedUserWorkout = await storage.completeUserWorkout(userWorkoutId);
      
      // Update user stats
      const { workout } = userWorkoutWithDetails;
      await storage.updateUserStats(
        userWorkoutWithDetails.userId,
        workout.calories,
        workout.duration,
        1
      );
      
      // Update pet stats
      const pet = await storage.getPetByUserId(userWorkoutWithDetails.userId);
      if (pet) {
        const xpGain = Math.round(workout.calories / 5); // XP gain based on calories
        await storage.updatePet(pet.id, {
          xp: pet.xp + xpGain,
          happiness: Math.min(pet.happiness + 10, 100),
          health: Math.min(pet.health + 5, 100),
        });
      }
      
      return res.json(completedUserWorkout);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Server init
  const httpServer = createServer(app);
  return httpServer;
}
