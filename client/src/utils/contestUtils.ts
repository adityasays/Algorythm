import axios from 'axios';

interface Contest {
  id: string;
  platform: string;
  name: string;
  startTime: string;
  duration: string;
  link: string;
  status: 'upcoming' | 'past';
  solutions?: Array<{
    videoId: string;
    title: string;
    url: string;
    thumbnail: string;
  }>;
  _id?: string;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

const API_BASE_URL = import.meta.env.VITE_API_URL ;

export const getUpcomingContests = async (): Promise<Contest[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/contests/upcoming`, { timeout: 10000 });
    console.log('Raw upcoming API response:', response.data);
    return response.data.map((contest: any) => ({
      id: contest._id || contest.id,
      platform: contest.platform,
      name: contest.name,
      startTime: contest.startTime,
      duration: contest.duration,
      link: contest.link,
      status: contest.status,
      solutions: contest.solutions || [],
      _id: contest._id,
      createdAt: contest.createdAt,
      updatedAt: contest.updatedAt,
      __v: contest.__v,
    }));
  } catch (error) {
    console.error('Error fetching upcoming contests:', error);
    throw error;
  }
};

export const getPastContests = async (): Promise<Contest[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/contests/past`, { timeout: 10000 });
    console.log('Raw past API response:', response.data);
    return response.data.map((contest: any) => ({
      id: contest._id || contest.id,
      platform: contest.platform,
      name: contest.name,
      startTime: contest.startTime,
      duration: contest.duration,
      link: contest.link,
      status: contest.status,
      solutions: contest.solutions || [],
      _id: contest._id,
      createdAt: contest.createdAt,
      updatedAt: contest.updatedAt,
      __v: contest.__v,
    }));
  } catch (error) {
    console.error('Error fetching past contests:', error);
    throw error;
  }
};