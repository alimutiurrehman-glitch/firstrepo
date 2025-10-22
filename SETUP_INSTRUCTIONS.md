# Movie Streaming Platform - Setup Instructions

## Prerequisites
- Node.js (version 14 or higher)
- MongoDB (local installation or MongoDB Atlas account)
- Git (optional, for version control)

## Quick Setup (5 minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` file and update the MongoDB URI:
   - For local MongoDB: `MONGODB_URI=mongodb://localhost:27017/movie-streaming-platform`
   - For MongoDB Atlas: Replace with your Atlas connection string

### 3. Start the Development Server
```bash
npm run dev
```

The server will start on `http://localhost:3000`

### 4. Populate Database with Sample Data
In a new terminal window, run:
```bash
npm run seed-10k
```

This will populate your database with 10,000 sample entries including movies, users, reviews, and watch history.

## Detailed Setup

### MongoDB Setup Options

#### Option A: Local MongoDB
1. Install MongoDB locally
2. Start MongoDB service
3. Use URI: `mongodb://localhost:27017/movie-streaming-platform`

#### Option B: MongoDB Atlas (Recommended)
1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get connection string
4. Update `.env` file with your Atlas URI

### Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with auto-reload
- `npm run seed-10k` - Populate database with 10k sample entries
- `npm run create-sample` - Create small sample dataset
- `npm run test` - Run API tests

### API Endpoints

Once running, you can access:

- **Movies**: `GET /api/movies` - List all movies
- **Search**: `GET /api/movies/search?q=query` - Search movies
- **Users**: `GET /api/users` - List users
- **Reviews**: `GET /api/reviews` - List reviews
- **Watch History**: `GET /api/users/:userId/watch-history` - User watch history

### Frontend
The project includes a simple frontend accessible at `http://localhost:3000`

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Check if MongoDB is running
   - Verify connection string in `.env`
   - Ensure network access is allowed (for Atlas)

2. **Port Already in Use**
   - Change PORT in `.env` file
   - Kill process using port 3000

3. **Missing Dependencies**
   - Run `npm install` again
   - Delete `node_modules` and `package-lock.json`, then `npm install`

### Getting Help
- Check the console for error messages
- Verify all environment variables are set correctly
- Ensure MongoDB is accessible from your application

## Production Deployment

For production deployment:
1. Set `NODE_ENV=production` in `.env`
2. Use `npm start` instead of `npm run dev`
3. Ensure MongoDB Atlas has proper security settings
4. Consider using PM2 for process management

## Database Schema

The application uses 4 main collections:
- **movies**: Movie information and metadata
- **users**: User profiles and preferences
- **reviews**: Movie reviews and ratings
- **watchhistories**: User viewing history and progress

All collections are automatically created when you run the seed script.
