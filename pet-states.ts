import { type PetState } from "@shared/schema";

// Mapping of pet states to properties we need for animation and display
export interface PetStateConfig {
  animation: string;
  color: string;
  message: string;
}

export const PET_STATE_CONFIG: Record<PetState, PetStateConfig> = {
  happy: {
    animation: "bounce-slow",
    color: "bg-green-200",
    message: "I'm feeling great! Let's work out together!"
  },
  sad: {
    animation: "pulse",
    color: "bg-blue-200",
    message: "I'm feeling a bit sad. Can we play?"
  },
  tired: {
    animation: "pulse-slow",
    color: "bg-gray-200",
    message: "I'm really tired... Need to rest!"
  },
  hungry: {
    animation: "wiggle",
    color: "bg-amber-200",
    message: "I'm hungry! Can you feed me?"
  },
  excited: {
    animation: "bounce",
    color: "bg-indigo-200",
    message: "I'm so excited! Let's do this!"
  },
  sleeping: {
    animation: "",
    color: "bg-purple-200",
    message: "Zzz... I'm recharging my energy..."
  }
};

export const getPetMotivationalMessages = (state: PetState): string[] => {
  switch (state) {
    case "happy":
      return [
        "You're doing great! Keep it up!",
        "I'm proud of you for staying consistent!",
        "Your hard work is paying off!",
        "Let's crush this workout together!",
        "I believe in you!"
      ];
    case "excited":
      return [
        "WOW! You're amazing!",
        "This is fun! Let's do more!",
        "You're on fire today!",
        "I've never seen someone so strong!",
        "We make the best team ever!"
      ];
    case "tired":
      return [
        "I'm a bit tired, but I'll still cheer for you!",
        "Let's both push through this together!",
        "One more rep! You can do it!",
        "Almost there! Don't give up!",
        "We both need a good rest after this!"
      ];
    case "hungry":
      return [
        "Let's finish this workout so we can both eat!",
        "My tummy is rumbling, but your health comes first!",
        "Food is fuel! Let's earn our meals!",
        "Working up an appetite together!",
        "After this, we'll both deserve a healthy snack!"
      ];
    case "sad":
      return [
        "Exercise always cheers me up!",
        "Seeing you work out makes me happy!",
        "Your dedication is inspiring!",
        "I feel better already watching you!",
        "Your progress is my happiness!"
      ];
    case "sleeping":
      return [
        "I'm resting, but don't let that stop you!",
        "I'll dream of your fitness success!",
        "Wake me up when you're done so I can celebrate with you!",
        "Getting strong while I get my beauty sleep!",
        "Rest is important for recovery too!"
      ];
    default:
      return [
        "Let's work out together!",
        "You've got this!",
        "Stay consistent and see results!",
        "Every workout counts!",
        "I believe in you!"
      ];
  }
};

export const getWorkoutCompleteMessages = (state: PetState): string[] => {
  switch (state) {
    case "happy":
      return [
        "Great job! You're getting stronger every day!",
        "I'm so proud of you! What a fantastic workout!",
        "You're making amazing progress! Keep it up!"
      ];
    case "excited":
      return [
        "WOW! That was AMAZING! Let's do it again tomorrow!",
        "You're my hero! That workout was incredible!",
        "I'm bouncing with joy! You're the best!"
      ];
    case "tired":
      return [
        "That was tough, but you pushed through! Now we both need rest!",
        "Even though I'm tired, I'm so impressed with your workout!",
        "Let's both recover and come back stronger tomorrow!"
      ];
    case "hungry":
      return [
        "Now we've both earned a healthy meal! Great workout!",
        "Food time! You've definitely burned those calories!",
        "I'm hungry and you must be too after that awesome session!"
      ];
    case "sad":
      return [
        "Your workout has cheered me up! Thank you!",
        "I'm feeling better just seeing your dedication!",
        "You inspire me with your consistency!"
      ];
    case "sleeping":
      return [
        "*Wakes up* Wow, you finished already? Great job!",
        "*Yawns* I missed it? I bet you were amazing!",
        "Your workout was so quiet it didn't even wake me up! Well done!"
      ];
    default:
      return [
        "Great job on completing your workout!",
        "You should be proud of yourself!",
        "Every workout brings you closer to your goals!"
      ];
  }
};
