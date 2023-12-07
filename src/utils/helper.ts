
const cheerio = require('cheerio');

export async function fetchGitHubData(gitHubUrl: string): Promise<{ zipContent: Uint8Array, readmeContent: string }> {
  try {
      // Fetch the ZIP file from the GitHub repository
      const zipResponse = await fetch(gitHubUrl + '/archive/main.zip');
      const zipArrayBuffer = await zipResponse.arrayBuffer();
      const zipContent = new Uint8Array(zipArrayBuffer);

      // Fetch the README file from the GitHub repository (assuming it's in the root of the repository)
      const readmeResponse = await fetch(gitHubUrl + '/blob/main/README.md');
      const readmeText = await readmeResponse.text();

      // Use cheerio to parse the README content
      const $ = cheerio.load(readmeText);
      const readmeContent = $('article').text();

      return { zipContent, readmeContent };
  } catch (error) {
      throw new Error(`Error fetching GitHub data: ${error.message}`);
  }
}