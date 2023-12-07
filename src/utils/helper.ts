
const cheerio = require('cheerio');

export async function fetchGitHubData(gitHubUrl: string): Promise<{ zipContent: Uint8Array, readmeContent: string }> {
    try {
      // Fetch the ZIP file from the GitHub repository
      const response = await fetch(gitHubUrl + '/archive/main.zip');
      const arrayBuffer = await response.arrayBuffer();
      const zipContent = new Uint8Array(arrayBuffer);
  
      // Fetch the README file from the GitHub repository (assuming it's in the root of the repository)
      const readmeResponse = await fetch(gitHubUrl + '/blob/main/README.md');
      const readmeJson = await readmeResponse.json();
  
      // Check if the expected properties exist in the JSON response
      if (
        readmeJson &&
        readmeJson.payload &&
        readmeJson.payload.blob &&
        readmeJson.payload.blob.richText
      ) {
        // Extract the actual content from the JSON response
        const readmeHtml = readmeJson.payload.blob.richText;
  
        // Use cheerio to parse the HTML and extract the text
        const $ = cheerio.load(readmeHtml);
        const readmeText = $('article').text();
        
        
  
        return { zipContent, readmeContent: readmeText };
      } else {
        throw new Error('Invalid GitHub API response structure');
      }
    } catch (error) {
      throw new Error(`Error fetching GitHub data: ${error.message}`);
    }
  }