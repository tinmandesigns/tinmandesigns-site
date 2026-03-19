module.exports = function (eleventyConfig) {
  // Add simple date filter for blog posts
  eleventyConfig.addFilter("dateReadable", (dateObj) => {
    return dateObj.toLocaleDateString("en-GB", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  });

  // ISO string date filter for sitemaps and schema
  eleventyConfig.addFilter("dateIso", (dateObj) => {
    return new Date(dateObj).toISOString();
  });

  // Add reading time filter based on average reading speed (200 words/minute)
  eleventyConfig.addFilter("readingTime", (text) => {
    const wordsPerMinute = 200;
    const numberOfWords = text.split(/\s/g).length;
    const minutes = Math.ceil(numberOfWords / wordsPerMinute);
    return `${minutes} min read`;
  });

  // Pass through all essential static assets directly to the build folder
  eleventyConfig.addPassthroughCopy("assets");
  eleventyConfig.addPassthroughCopy("sw.js");
  eleventyConfig.addPassthroughCopy("manifest.json");
  eleventyConfig.addPassthroughCopy("robots.txt");
  eleventyConfig.addPassthroughCopy("sitemap.xml");
  eleventyConfig.addPassthroughCopy("_headers");

  return {
    dir: {
      input: ".", // Use the current root directory as the source
      output: "_site", // Output everything to the _site directory
      includes: "_includes", // This is where we will put reusable layouts like headers/footers
    },
    passthroughFileCopy: true,
  };
};
