import React, { createContext, useContext, useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Pet, PetType } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// Define mock user ID (in a real app, this would come from auth)
const USER_ID = 1;

// Define pet messages
const petMessages = {
  default: "Let's crush today's workout! I believe in you!",
  hungry: "I'm getting a bit hungry. Could you feed me?",
  unhappy: "I'm feeling a bit down today. Want to play?",
  unhealthy: "I'm not feeling well. Can you help me?",
  happy: "I feel amazing today! Let's have a great workout!",
  fed: "Yum! Thank you for the food!",
  played: "This is so fun! I love playing with you!",
  groomed: "I feel refreshed and clean now!",
  workout: "You're doing great! Keep going!"
};

// Define context type
interface PetContextType {
  pet: Pet;
  message: string;
  isLoading: boolean;
  feedPet: () => void;
  playWithPet: () => void;
  groomPet: () => void;
  updatePetAfterWorkout: (calories: number) => void;
  changePetType: (type: PetType) => void;
}

// Create context
export const PetContext = createContext<PetContextType | undefined>(undefined);

// Create provider
export const PetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [message, setMessage] = useState(petMessages.default);
  const { toast } = useToast();

  // Fetch pet data
  const { 
    data: pet, 
    isLoading,
    error
  } = useQuery<Pet>({
    queryKey: [`/api/users/${USER_ID}/pet`],
    refetchInterval: 60000, // Refetch every minute to update pet status
  });

  // Create pet if none exists
  const createPetMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/pets", {
        userId: USER_ID,
        name: "Buddy"
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData([`/api/users/${USER_ID}/pet`], data);
      toast({
        title: "Pet created!",
        description: "Your new pet buddy is ready to motivate you!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error creating pet",
        description: String(error),
        variant: "destructive",
      });
    }
  });

  // Feed pet mutation
  const feedPetMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/pets/${pet?.id}/feed`, {});
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData([`/api/users/${USER_ID}/pet`], data);
      setMessage(petMessages.fed);
      toast({
        title: "Pet fed!",
        description: "Your pet is happier now.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error feeding pet",
        description: String(error),
        variant: "destructive",
      });
    }
  });

  // Play with pet mutation
  const playWithPetMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/pets/${pet?.id}/play`, {});
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData([`/api/users/${USER_ID}/pet`], data);
      setMessage(petMessages.played);
      toast({
        title: "Played with pet!",
        description: "Your pet is having fun!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error playing with pet",
        description: String(error),
        variant: "destructive",
      });
    }
  });

  // Groom pet mutation
  const groomPetMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/pets/${pet?.id}/groom`, {});
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData([`/api/users/${USER_ID}/pet`], data);
      setMessage(petMessages.groomed);
      toast({
        title: "Groomed pet!",
        description: "Your pet is clean and healthy!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error grooming pet",
        description: String(error),
        variant: "destructive",
      });
    }
  });

  // Update pet after workout mutation
  const updatePetAfterWorkoutMutation = useMutation({
    mutationFn: async (calories: number) => {
      if (!pet) return null;
      
      // Calculate XP gain based on calories
      const xpGain = Math.round(calories / 5);
      
      const res = await apiRequest("PATCH", `/api/pets/${pet.id}`, {
        happiness: Math.min(pet.happiness + 10, 100),
        health: Math.min(pet.health + 5, 100),
        xp: pet.xp + xpGain
      });
      return { pet: await res.json(), xpGain };
    },
    onSuccess: (data) => {
      if (!data) return;
      
      queryClient.setQueryData([`/api/users/${USER_ID}/pet`], data.pet);
      toast({
        title: "Pet gained XP!",
        description: `Your pet gained ${data.xpGain} XP from your workout!`,
      });
    }
  });

  // Set message based on pet status
  useEffect(() => {
    if (!pet) return;

    if (pet.hunger < 30) {
      setMessage(petMessages.hungry);
    } else if (pet.happiness < 30) {
      setMessage(petMessages.unhappy);
    } else if (pet.health < 30) {
      setMessage(petMessages.unhealthy);
    } else if (pet.happiness > 80 && pet.health > 80) {
      setMessage(petMessages.happy);
    } else {
      setMessage(petMessages.default);
    }
  }, [pet]);

  // Create pet if error fetching (not found)
  useEffect(() => {
    if (error && !createPetMutation.isPending) {
      createPetMutation.mutate();
    }
  }, [error, createPetMutation]);

  // Helper functions
  const feedPet = () => {
    if (pet) {
      feedPetMutation.mutate();
    }
  };

  const playWithPet = () => {
    if (pet) {
      playWithPetMutation.mutate();
    }
  };

  const groomPet = () => {
    if (pet) {
      groomPetMutation.mutate();
    }
  };

  const updatePetAfterWorkout = (calories: number) => {
    if (pet) {
      updatePetAfterWorkoutMutation.mutate(calories);
    }
  };

  // Change pet type mutation
  const changePetTypeMutation = useMutation({
    mutationFn: async (type: PetType) => {
      if (!pet) return null;
      
      const res = await apiRequest("PATCH", `/api/pets/${pet.id}`, {
        type
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (!data) return;
      
      queryClient.setQueryData([`/api/users/${USER_ID}/pet`], data);
      toast({
        title: "Pet changed!",
        description: `Your pet has been changed to a ${data.type}!`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error changing pet type",
        description: String(error),
        variant: "destructive",
      });
    }
  });
  
  // Helper function to change pet type
  const changePetType = (type: PetType) => {
    if (pet) {
      changePetTypeMutation.mutate(type);
    }
  };

  // Default pet data if still loading
  const defaultPet: Pet = {
    id: 0,
    userId: USER_ID,
    name: "Buddy",
    type: "cat", // Default pet type
    health: 100,
    hunger: 100,
    happiness: 100,
    level: 1,
    xp: 0,
    lastFed: new Date(),
    lastPlayed: new Date(),
    lastGroomed: new Date()
  };

  return (
    <PetContext.Provider
      value={{
        pet: pet || defaultPet,
        message,
        isLoading,
        feedPet,
        playWithPet,
        groomPet,
        updatePetAfterWorkout,
        changePetType
      }}
    >
      {children}
    </PetContext.Provider>
  );
};

// Custom hook to use pet context
export const usePet = () => {
  const context = useContext(PetContext);
  if (!context) {
    throw new Error("usePet must be used within a PetProvider");
  }
  return context;
};
