// Verified parent reviews shown on /demo. The section stays hidden while this
// list is empty. Only add reviews a parent actually gave and that are already
// public (these come from data/testimonials.json). Never write one by hand.

export interface DemoReview {
  name: string;
  role: string;
  quote: string;
}

export const demoReviews: DemoReview[] = [
  {
    name: "Namrata Gunjal",
    role: "Parent of a sixth grader",
    quote:
      "My 6th grader just finished his coding classes and had an absolute blast—it was so fun-loaded and engaging. We are so happy to be part of this learning community.",
  },
];
