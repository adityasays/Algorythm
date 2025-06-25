interface Ratings {
  codeforces: number;
  codechef: number;
  leetcode: number;
}

const scrapeCodeChefRating = async (username: string): Promise<number> => {
  try {
    // Using a CORS proxy to bypass CORS restrictions
    const proxyUrl = 'https://api.allorigins.win/get?url=';
    const targetUrl = `https://www.codechef.com/users/${username}`;
    
    const response = await fetch(proxyUrl + encodeURIComponent(targetUrl));
    const data = await response.json();
    
    if (!data.contents) {
      throw new Error('No content received from proxy');
    }
    
    const htmlContent = data.contents;
    
    // Create a temporary DOM element to parse the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    
    // Try to find the rating using the same logic as the Node.js version
    const ratingElement = tempDiv.querySelector('.rating-number');
    if (ratingElement) {
      const ratingText = ratingElement.textContent;
      if (ratingText) {
        const rating = parseInt(ratingText.trim());
        if (!isNaN(rating)) {
          return rating;
        }
      }
    }
    
    // Alternative approach: extract from script tags like in the original code
    const scriptTags = tempDiv.querySelectorAll('script');
    for (const script of scriptTags) {
      const scriptContent = script.textContent || script.innerHTML;
      if (scriptContent.includes('var all_rating = ')) {
        try {
          const allRatingStart = scriptContent.indexOf('var all_rating = ') + 'var all_rating = '.length;
          const allRatingEnd = scriptContent.indexOf('var current_user_rating =') - 6;
          
          if (allRatingStart > 16 && allRatingEnd > allRatingStart) {
            const ratingDataString = scriptContent.substring(allRatingStart, allRatingEnd);
            const ratingData = JSON.parse(ratingDataString);
            
            // Get the latest rating from the rating data
            if (ratingData && ratingData.length > 0) {
              const latestRating = ratingData[ratingData.length - 1];
              if (latestRating && latestRating.rating) {
                return parseInt(latestRating.rating);
              }
            }
          }
        } catch (parseError) {
          console.error('Error parsing rating data from script:', parseError);
        }
      }
    }
    
    // If we can't find rating in the DOM, try regex approach on the HTML string
    const ratingMatch = htmlContent.match(/class="rating-number"[^>]*>([^<]+)</);
    if (ratingMatch && ratingMatch[1]) {
      const rating = parseInt(ratingMatch[1].trim());
      if (!isNaN(rating)) {
        return rating;
      }
    }
    
    throw new Error('Could not extract rating from CodeChef profile');
    
  } catch (error) {
    console.error('Error scraping CodeChef rating:', error);
    throw error;
  }
};

export const fetchAndStoreRatingss = async (): Promise<Ratings | null> => {
  try {
    const codeforcesUsername = localStorage.getItem('codeforcesUsername');
    const codechefUsername = localStorage.getItem('codechefUsername');
    const leetcodeUsername = localStorage.getItem('leetcodeUsername');

    if (!codeforcesUsername || !codechefUsername || !leetcodeUsername) {
      console.error('One or more usernames not found in localStorage');
      return null;
    }

    const ratings: Ratings = {
      codeforces: 0,
      codechef: 0,
      leetcode: 0,
    };

    // Fetch Codeforces rating
    try {
      const res = await fetch(`https://codeforces.com/api/user.info?handles=${codeforcesUsername}`);
      const data: any = await res.json();
      if (data.status === 'OK' && data.result[0]?.rating) {
        ratings.codeforces = data.result[0].rating;
        localStorage.setItem('codeforcesRating', ratings.codeforces.toString());
      }
    } catch (error) {
      console.error('Error fetching Codeforces rating:', error);
    }

    // Fetch CodeChef rating using scraping
    try {
      const codechefRating = await scrapeCodeChefRating(codechefUsername);
      ratings.codechef = codechefRating;
      localStorage.setItem('codechefRating', ratings.codechef.toString());
    } catch (error) {
      console.error('Error fetching CodeChef rating:', error);
    }

    // Fetch LeetCode rating
    try {
      const res = await fetch(`https://leetcode.com/graphql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query getUserProfile($username: String!) {
              matchedUser(username: $username) {
                contestRating
              }
            }
          `,
          variables: { username: leetcodeUsername }
        }),
      });

      const data: any = await res.json();
      if (data?.data?.matchedUser?.contestRating) {
        ratings.leetcode = Math.round(data.data.matchedUser.contestRating);
        localStorage.setItem('leetcodeRating', ratings.leetcode.toString());
      }
    } catch (error) {
      console.error('Error fetching LeetCode rating:', error);
    }

    return ratings;
  } catch (error) {
    console.error('Error in fetchAndStoreRatings:', error);
    return null;
  }
};