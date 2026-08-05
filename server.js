import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { buildAuthorization, getUserSummary } from '@retroachievements/api';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const authorization = buildAuthorization({
  username: process.env.RA_USERNAME,
  webApiKey: process.env.RA_API_KEY,
});

// Club members list
const CLUB_MEMBERS = [
  'heroofnow',
  // Add your friends' usernames here as they join
];

// This variable holds our cached data in memory
let cachedMemberData = [];

// Function that fetches fresh data from RetroAchievements
async function updateMemberCache() {
  console.log('Fetching fresh stats from RetroAchievements...');
  try {
    const memberData = await Promise.all(
      CLUB_MEMBERS.map(async (username) => {
        const summary = await getUserSummary(authorization, {
          username: username,
          recentGamesCount: 1,
        });

        return {
          user: summary.user,
          avatar: `https://retroachievements.org${summary.userPic}`,
          totalPoints: summary.totalPoints,
          recentGame: summary.lastGame ? summary.lastGame.title : 'None',
        };
      })
    );

    cachedMemberData = memberData;
    console.log('Cache successfully updated at:', new Date().toLocaleTimeString());
  } catch (error) {
    console.error('Error updating member cache:', error);
  }
}

// Fetch data immediately when the server starts
updateMemberCache();

// Run the update function every 5 minutes (300,000 milliseconds)
setInterval(updateMemberCache, 5 * 60 * 1000);

// API Route now serves the cached data instantly
app.get('/api/members', (req, res) => {
  res.json(cachedMemberData);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend is running! Listening on port ${PORT}`);
});
