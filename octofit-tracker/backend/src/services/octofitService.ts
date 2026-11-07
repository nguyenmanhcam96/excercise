import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

class HttpError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

function ensureString(value: unknown, fieldName: string) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new HttpError(`${fieldName} is required`, 400);
  }
  return value.trim();
}

function ensureValidObjectId(value: unknown, fieldName: string) {
  if (typeof value !== 'string' || !mongoose.isValidObjectId(value)) {
    throw new HttpError(`Invalid ${fieldName}`, 400);
  }
  return new mongoose.Types.ObjectId(value);
}

function ensurePositiveMinutes(value: unknown, fieldName: string) {
  const minutes = Number(value);
  if (!Number.isFinite(minutes) || minutes <= 0) {
    throw new HttpError(`${fieldName} must be a positive number`, 400);
  }
  return minutes;
}

export async function listActivities() {
  return Activity.find().sort({ occurredAt: -1 }).lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw new HttpError('Activity payload is required', 400);
  }

  const payload = input as Record<string, unknown>;
  const userId = ensureValidObjectId(payload.userId, 'userId');
  const teamId = ensureValidObjectId(payload.teamId, 'teamId');
  const type = ensureString(payload.type, 'type');
  const minutes = ensurePositiveMinutes(payload.minutes, 'minutes');

  const [user, team] = await Promise.all([User.findById(userId), Team.findById(teamId)]);
  if (!user) {
    throw new HttpError('User not found', 404);
  }
  if (!team) {
    throw new HttpError('Team not found', 404);
  }

  const activity = await Activity.create({
    user: userId,
    team: teamId,
    type,
    minutes,
    points: Math.max(1, Math.round(minutes)),
    occurredAt: new Date(),
  });

  return activity.toObject();
}

export async function listTeams() {
  return Team.find().sort({ name: 1 }).lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw new HttpError('Team payload is required', 400);
  }

  const payload = input as Record<string, unknown>;
  const name = ensureString(payload.name, 'name');
  const mascot = ensureString(payload.mascot, 'mascot');
  const rawMembers = Array.isArray(payload.members) ? payload.members : [];
  const memberIds = rawMembers.map((member) => ensureValidObjectId(member, 'member'));

  const team = await Team.create({ name, mascot, members: memberIds });

  if (memberIds.length > 0) {
    await User.updateMany({ _id: { $in: memberIds } }, { $set: { team: team._id } });
  }

  return team.toObject();
}

export async function getLeaderboard() {
  const leaderboard = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $sort: { totalPoints: -1, _id: 1 } },
  ]);

  if (leaderboard.length === 0) {
    return [];
  }

  const teamIds = leaderboard.map((entry) => entry._id);
  const teams = await Team.find({ _id: { $in: teamIds } }).lean();
  const teamNameMap = new Map(teams.map((team) => [team._id.toString(), team.name]));

  return leaderboard.map((entry, index) => ({
    teamName: teamNameMap.get(entry._id.toString()) ?? 'Unknown Team',
    totalPoints: Number(entry.totalPoints),
    rank: index + 1,
  }));
}

export async function suggestWorkouts(userEmail: string) {
  const email = ensureString(userEmail, 'userEmail').toLowerCase();
  const user = await User.findOne({ email });

  if (!user) {
    throw new HttpError('User not found', 404);
  }

  const recentActivities = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(10).lean();
  const recentTypes = recentActivities.map((activity) => String(activity.type).toLowerCase());
  const focusCandidates = [String(user.fitnessGoal ?? '').toLowerCase(), ...recentTypes].filter(Boolean);

  const workouts = await Workout.find().lean();
  const suggestions = workouts
    .map((workout) => {
      const focus = String(workout.focus).toLowerCase();
      let score = 0;
      let reasons: string[] = [];

      if (focusCandidates.includes(focus)) {
        score += 3;
        reasons.push(`matches your ${workout.focus} focus`);
      }

      if (String(user.fitnessGoal ?? '').toLowerCase() === focus) {
        score += 2;
        reasons.push(`aligns with your ${user.fitnessGoal} goal`);
      }

      if (recentTypes.includes(focus)) {
        score += 2;
        reasons.push(`fits your recent ${workout.focus} activity pattern`);
      }

      if (reasons.length === 0) {
        reasons.push('supports a balanced training plan');
      }

      return {
        ...workout,
        reason: reasons.join(' and '),
        _score: score,
      };
    })
    .sort((a, b) => Number(b._score) - Number(a._score));

  return suggestions.map(({ _score, ...suggestion }) => suggestion);
}

export { User };
