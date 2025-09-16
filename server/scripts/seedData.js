import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from '../config.js';
import User from '../models/User.js';
import Department from '../models/Department.js';
import Issue from '../models/Issue.js';
import IssueUpdate from '../models/IssueUpdate.js';

const sampleUsers = [
  {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
    role: 'citizen'
  },
  {
    name: 'Jane Smith',
    email: 'jane@example.com',
    password: 'password123',
    role: 'citizen'
  },
  {
    name: 'Mike Johnson',
    email: 'mike@example.com',
    password: 'password123',
    role: 'citizen'
  },
  {
    name: 'Sarah Wilson',
    email: 'sarah@example.com',
    password: 'password123',
    role: 'admin1'
  },
  {
    name: 'David Brown',
    email: 'david@example.com',
    password: 'password123',
    role: 'admin2'
  }
];

const sampleDepartments = [
  {
    name: 'Public Works',
    locationZone: 'Downtown'
  },
  {
    name: 'Environmental Services',
    locationZone: 'North District'
  },
  {
    name: 'Transportation',
    locationZone: 'South District'
  }
];

const sampleIssues = [
  {
    category: 'Infrastructure',
    description: 'Large pothole on Main Street causing traffic issues and potential vehicle damage. Located near the intersection with Oak Avenue.',
    location: {
      latitude: 40.7128,
      longitude: -74.0060,
      address: '123 Main Street, Downtown'
    },
    status: 'pending',
    priority: 'high'
  },
  {
    category: 'Environment',
    description: 'Garbage collection missed for the past 3 days. Bins are overflowing and creating unpleasant odors in the neighborhood.',
    location: {
      latitude: 40.7589,
      longitude: -73.9851,
      address: '456 Oak Avenue, Midtown'
    },
    status: 'acknowledged',
    priority: 'medium'
  },
  {
    category: 'Safety',
    description: 'Broken streetlight on the corner of 5th and Pine. Area is very dark at night, creating safety concerns for pedestrians.',
    location: {
      latitude: 40.7505,
      longitude: -73.9934,
      address: '789 Pine Street, Uptown'
    },
    status: 'in_progress',
    priority: 'high'
  },
  {
    category: 'Transportation',
    description: 'Bus stop bench is broken and needs repair. Elderly residents have difficulty waiting for buses without seating.',
    location: {
      latitude: 40.7614,
      longitude: -73.9776,
      address: '321 Elm Street, Eastside'
    },
    status: 'resolved',
    priority: 'medium'
  },
  {
    category: 'Utilities',
    description: 'Water leak from fire hydrant on Maple Drive. Water is pooling on the street and sidewalk.',
    location: {
      latitude: 40.7831,
      longitude: -73.9712,
      address: '654 Maple Drive, Westside'
    },
    status: 'pending',
    priority: 'urgent'
  },
  {
    category: 'Infrastructure',
    description: 'Sidewalk is cracked and uneven, making it difficult for wheelchair users to navigate safely.',
    location: {
      latitude: 40.7282,
      longitude: -73.7949,
      address: '987 Cedar Lane, Northside'
    },
    status: 'acknowledged',
    priority: 'medium'
  }
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(config.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Department.deleteMany({});
    await Issue.deleteMany({});
    await IssueUpdate.deleteMany({});
    console.log('Cleared existing data');

    // Create departments
    const departments = await Department.insertMany(sampleDepartments);
    console.log('Created departments');

    // Create users
    const users = [];
    for (const userData of sampleUsers) {
      const user = new User(userData);
      await user.save();
      users.push(user);
    }
    console.log('Created users');

    // Create issues
    const issues = [];
    for (let i = 0; i < sampleIssues.length; i++) {
      const issueData = sampleIssues[i];
      const citizen = users[i % 3]; // Assign to first 3 users (citizens)
      
      const issue = new Issue({
        ...issueData,
        citizen: citizen._id
      });
      await issue.save();
      issues.push(issue);

      // Create initial status update
      const issueUpdate = new IssueUpdate({
        issue: issue._id,
        updatedBy: citizen._id,
        status: issue.status,
        comment: 'Issue submitted'
      });
      await issueUpdate.save();

      // Create additional updates for some issues
      if (issue.status === 'in_progress' || issue.status === 'resolved') {
        const admin = users.find(u => u.role === 'admin1');
        const update = new IssueUpdate({
          issue: issue._id,
          updatedBy: admin._id,
          status: issue.status,
          comment: issue.status === 'in_progress' ? 'Work has been assigned and is in progress' : 'Issue has been resolved'
        });
        await update.save();
      }
    }
    console.log('Created issues and updates');

    console.log('Database seeded successfully!');
    console.log('\nSample login credentials:');
    console.log('Citizen: john@example.com / password123');
    console.log('Citizen: jane@example.com / password123');
    console.log('Citizen: mike@example.com / password123');
    console.log('Admin1: sarah@example.com / password123');
    console.log('Admin2: david@example.com / password123');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

seedDatabase();

