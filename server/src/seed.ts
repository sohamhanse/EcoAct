import "dotenv/config";
import mongoose from "mongoose";
import { Community } from "./models/Community.model.js";
import { Mission } from "./models/Mission.model.js";
import { User } from "./models/User.model.js";

const SEED_MISSIONS = [
  { title: "Bike Instead of Car", description: "Use a bicycle for a trip under 5km instead of driving", category: "transport", co2Saved: 1.05, basePoints: 50, difficulty: "easy", icon: "bicycle" },
  { title: "Take the Metro", description: "Commute by metro or bus instead of personal vehicle", category: "transport", co2Saved: 2.1, basePoints: 80, difficulty: "easy", icon: "train" },
  { title: "Carpool Today", description: "Share your car ride with at least one other person", category: "transport", co2Saved: 1.5, basePoints: 60, difficulty: "medium", icon: "people" },
  { title: "Walk for Short Trips", description: "Walk all trips under 1km today", category: "transport", co2Saved: 0.5, basePoints: 30, difficulty: "easy", icon: "walk" },
  { title: "Work From Home", description: "Avoid commuting by working from home", category: "transport", co2Saved: 3.2, basePoints: 100, difficulty: "medium", icon: "home" },
  { title: "Go Meat-Free Today", description: "Eat a fully vegetarian diet for the day", category: "food", co2Saved: 2.5, basePoints: 90, difficulty: "easy", icon: "leaf" },
  { title: "Try Vegan for a Day", description: "Avoid all animal products including dairy and eggs", category: "food", co2Saved: 4.1, basePoints: 130, difficulty: "medium", icon: "nutrition" },
  { title: "Zero Food Waste", description: "Consume or compost all food — waste nothing", category: "food", co2Saved: 1.2, basePoints: 50, difficulty: "easy", icon: "trash-outline" },
  { title: "Buy Local Produce", description: "Purchase locally grown fruits and vegetables", category: "food", co2Saved: 0.8, basePoints: 40, difficulty: "easy", icon: "basket" },
  { title: "Unplug Idle Devices", description: "Unplug chargers, TVs, and appliances not in use", category: "energy", co2Saved: 0.3, basePoints: 25, difficulty: "easy", icon: "flash-off" },
  { title: "AC Off for 4 Hours", description: "Turn off air conditioning for at least 4 hours", category: "energy", co2Saved: 0.9, basePoints: 45, difficulty: "medium", icon: "thermometer" },
  { title: "Line-Dry Laundry", description: "Air dry your clothes instead of using a dryer", category: "energy", co2Saved: 1.1, basePoints: 50, difficulty: "easy", icon: "shirt" },
  { title: "Switch to LED", description: "Replace one incandescent bulb with an LED bulb", category: "energy", co2Saved: 25.5, basePoints: 200, difficulty: "hard", icon: "bulb" },
  { title: "Cold Water Wash", description: "Wash clothes in cold water instead of hot", category: "energy", co2Saved: 0.6, basePoints: 35, difficulty: "easy", icon: "water" },
  { title: "Skip Single-Use Plastic", description: "Refuse plastic bags, straws, and cutlery today", category: "shopping", co2Saved: 0.3, basePoints: 30, difficulty: "easy", icon: "close-circle" },
  { title: "Buy Second-Hand", description: "Purchase a clothing item from a thrift store", category: "shopping", co2Saved: 5.0, basePoints: 150, difficulty: "medium", icon: "repeat" },
  { title: "Repair Don't Replace", description: "Fix a broken item instead of buying new", category: "shopping", co2Saved: 3.5, basePoints: 120, difficulty: "medium", icon: "build" },
  { title: "Bring a Reusable Bag", description: "Use a cloth or reusable bag for all shopping today", category: "shopping", co2Saved: 0.1, basePoints: 15, difficulty: "easy", icon: "bag" },
  { title: "2-Minute Shower", description: "Limit your shower to 2 minutes", category: "water", co2Saved: 0.4, basePoints: 30, difficulty: "medium", icon: "water" },
  { title: "Fix a Dripping Tap", description: "Repair a leaking tap to save water", category: "water", co2Saved: 15.0, basePoints: 300, difficulty: "hard", icon: "construct" },
];

const DEMO_NAMES = [
  "Priya Sharma", "Rahul Verma", "Ananya Singh", "Vikram Patel", "Sneha Reddy",
  "Arjun Nair", "Kavya Iyer", "Rohan Krishnan", "Ishita Gupta", "Aditya Mehta",
  "Neha Joshi", "Karan Desai", "Divya Rao", "Siddharth Malhotra", "Pooja Agarwal",
  "Vivek Pillai", "Shreya Menon", "Rishabh Saxena", "Aarti Choudhury", "Nikhil Tiwari",
  "Lakshmi Venkatesh", "Manish Kumar", "Swati Bhat", "Akash Dubey", "Preeti Nair",
  "Rajesh Prabhu", "Deepa Krishnamurthy", "Sanjay Gopal", "Meera Subramanian", "Karthik Raman",
  "Anjali Venkat", "Gaurav Sethi", "Ritu Bansal", "Varun Khanna", "Simran Chopra",
  "Abhishek Dutta", "Pallavi Sinha", "Ravi Shankar", "Kriti Mehra", "Harsh Vaidya",
  "Tanvi Kapoor", "Yash Oberoi", "Nidhi Trivedi", "Rohit Bajaj", "Sonal Jain",
  "Manoj Prasad", "Kiran Reddy", "Vandana Murthy", "Suresh Iyengar", "Anita Bose",
];

const SEED_COMMUNITIES = [
  { name: "IIT Bombay", type: "college" as const, description: "IIT Bombay Green Campus Initiative" },
  { name: "IIT Delhi", type: "college" as const, description: "Sustainability at IIT Delhi" },
  { name: "Bangalore Tech Park", type: "company" as const, description: "Corporate sustainability challenge" },
  { name: "Mumbai Green City", type: "city" as const, description: "Mumbai citizens for climate" },
  { name: "Delhi NCR Eco Warriors", type: "city" as const, description: "NCR community climate action" },
  { name: "BITS Pilani", type: "college" as const, description: "BITS Green Club" },
  { name: "Infosys Green Team", type: "company" as const, description: "Infosys employee sustainability" },
  { name: "Chennai Coastal Guardians", type: "city" as const, description: "Chennai coastal community" },
  { name: "NIT Trichy Eco", type: "college" as const, description: "NIT Trichy environment club" },
  { name: "Hyderabad Green Society", type: "city" as const, description: "Hyderabad urban sustainability" },
];

async function seed() {
  const uri = process.env.MONGODB_URI ?? "mongodb://localhost:27017/ecoact";
  await mongoose.connect(uri);

  const missionCount = await Mission.countDocuments();
  if (missionCount === 0) {
    await Mission.insertMany(SEED_MISSIONS);
    console.log("Seeded", SEED_MISSIONS.length, "missions");
  }

  let communities = await Community.find().lean();
  if (communities.length === 0) {
    const inserted = await Community.insertMany(
      SEED_COMMUNITIES.map((c) => ({
        ...c,
        memberCount: 0,
        totalCo2Saved: 0,
        totalPoints: 0,
      })),
    );
    communities = inserted;
    console.log("Seeded", communities.length, "communities");
  }
  const { ensureActiveChallenge } = await import("./services/challenge.service.js");
  for (const c of communities) {
    await ensureActiveChallenge(c._id);
  }

  const userCount = await User.countDocuments();
  if (userCount === 0) {
    const commList = await Community.find().limit(10).lean();
    const demoUsers = DEMO_NAMES.map((name, i) => ({
      googleId: `demo-${i}-${Date.now()}`,
      name,
      email: `demo${i}@ecoact.demo`,
      avatar: "",
      totalPoints: Math.floor(Math.random() * 800) + 50,
      totalCo2Saved: Math.floor(Math.random() * 200) + 10,
      footprintBaseline: 1700,
      currentStreak: Math.floor(Math.random() * 7),
      longestStreak: Math.floor(Math.random() * 20) + 1,
      lastActiveDate: new Date(),
      badges: [],
      communityId: commList[i % commList.length]?._id ?? null,
      role: "user",
    }));
    await User.insertMany(demoUsers);
    for (const c of commList) {
      const members = demoUsers.filter((u) => u.communityId?.toString() === c._id.toString());
      const totalPoints = members.reduce((s, u) => s + u.totalPoints, 0);
      const totalCo2Saved = members.reduce((s, u) => s + u.totalCo2Saved, 0);
      await Community.findByIdAndUpdate(c._id, {
        $set: { memberCount: members.length, totalPoints, totalCo2Saved },
      });
    }
    console.log("Seeded", demoUsers.length, "demo users");
  }

  await mongoose.disconnect();
  console.log("Seed complete.");
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
