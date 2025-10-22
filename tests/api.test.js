/**
 * Simple API Tests
 * Run manually by making requests to these endpoints
 */

const API_BASE = 'http://localhost:5000/api';

console.log(`
📝 MANUAL API TESTING GUIDE
=================================

1. Health Check:
   GET ${API_BASE}/health

2. Get All Movies:
   GET ${API_BASE}/movies?page=1&limit=10

3. Search Movies:
   GET ${API_BASE}/movies/search?query=action&genre=Action&minRating=7

4. Get Trending Movies:
   GET ${API_BASE}/movies/trending

5. Get All Users:
   GET ${API_BASE}/users

6. Get User History (replace USER_ID):
   GET ${API_BASE}/users/USER_ID/history

7. Get Movie Details (replace MOVIE_ID):
   GET ${API_BASE}/movies/MOVIE_ID

8. Get Movie Reviews (replace MOVIE_ID):
   GET ${API_BASE}/movies/MOVIE_ID/reviews

9. Get Review Stats (replace MOVIE_ID):
   GET ${API_BASE}/movies/MOVIE_ID/reviews/stats

10. Create Review (POST with body):
    POST ${API_BASE}/movies/MOVIE_ID/reviews
    Body: {
      "userId": "USER_ID",
      "rating": 9,
      "reviewText": "Great movie!"
    }

=================================
Use Postman, Thunder Client, or curl to test these endpoints.
Make sure the server is running first: npm run dev
`);

