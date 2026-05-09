import { BLOG_CATEGORIES, type BlogCategory, type BlogPost } from "./types";

export const blogCategoryStyles: Record<
  BlogCategory,
  {
    pill: string;
  }
> = {
  "Parent Tips": {
    pill: "bg-[#FFF1E8] text-[#A24B1D] ring-1 ring-[#F4C4A8]"
  },
  "Learning Strategies": {
    pill: "bg-[#E8F6FF] text-[#0A5B8C] ring-1 ring-[#B6DDF7]"
  },
  "Kriana Approach": {
    pill: "bg-[#EAFBF7] text-[#0D6B5E] ring-1 ring-[#B9E8DE]"
  }
};

export const blogPosts: BlogPost[] = [
  {
    id: "why-kids-struggle-with-math",
    title: "Math Tutoring for Kids in Ottawa: Why Kids Struggle with Math and How to Fix It Early",
    slug: "why-kids-struggle-with-math-and-how-to-fix-it-early",
    category: "Parent Tips",
    date: "2026-05-01",
    excerpt:
      "Many children struggle with math not because they lack ability, but because they miss foundational concepts early on...",
    metaTitle: "Math Tutoring for Kids in Ottawa | Kriana Tutoring Blog",
    metaDescription:
      "Learn why children fall behind in math and how Ottawa families can rebuild confidence early with practical support and tutoring strategies.",
    content: `
<h2>Math tutoring for kids in Ottawa starts with the foundation</h2>
<p>Math tutoring for kids works best when families spot the struggle early. When a child says math is hard, the real problem is often not effort or intelligence. In many cases, they missed one or two core building blocks like <strong>number sense</strong>, place value, or confidence with basic facts. Once those gaps appear, every new concept can feel heavier.</p>
<p>That is why early support matters. A child who does not fully understand today&apos;s lesson often carries that confusion into tomorrow&apos;s work, and the frustration grows faster than parents realize.</p>

<h2>Warning signs to watch for at home</h2>
<p>Parents usually notice the pattern before report cards do. Homework takes much longer than it should. Simple problems trigger tears or avoidance. Your child may guess instead of explaining how they found an answer, or they may freeze when asked to do mental math.</p>

<h3>Small signals matter</h3>
<p>If your child keeps forgetting strategies they learned last week, mixes up operations, or says they are <em>just bad at math</em>, it is worth slowing down and checking the foundation instead of pushing harder.</p>

<h2>What actually helps children improve</h2>
<p>The goal is not more worksheets. The goal is clearer understanding. Children make better progress when they can revisit missing concepts in smaller steps, use visual models, and practise with someone who can adjust the pace in real time.</p>
<p>At Kriana Tutoring, we focus on teaching the <strong>why</strong> behind the process so students are not memorizing steps they do not trust. That shift is often what rebuilds confidence.</p>

<h2>Fixing it early protects confidence later</h2>
<p>Math confidence is fragile. When children get support early, they stop attaching struggle to identity. Instead of thinking <em>I am not a math kid</em>, they begin to see that they simply needed the right explanation, enough guided practice, and space to ask questions without pressure.</p>
<p>The earlier those supports are in place, the easier it is to prevent long-term gaps and restore a healthy relationship with learning.</p>
    `
  },
  {
    id: "reading-routines-that-build-confidence",
    title: "Reading Help for Grade 1-3: Routines That Build Confidence After School",
    slug: "reading-routines-that-build-confidence-after-school",
    category: "Learning Strategies",
    date: "2026-04-21",
    excerpt:
      "Short, repeatable reading routines can reduce resistance, improve fluency, and help children end the day feeling successful instead of overwhelmed.",
    metaTitle: "Reading Help for Grade 1-3 | Kriana Tutoring Blog",
    metaDescription:
      "See how simple after-school routines give young learners stronger reading fluency, comprehension, and confidence without turning evenings into a battle.",
    content: `
<h2>Reading help for grade 1-3 starts with consistency</h2>
<p>Reading help for grade 1-3 students does not need to look like long, stressful sessions. Ten to fifteen focused minutes done consistently often leads to better fluency and comprehension than occasional marathon sessions.</p>

<h2>Create a predictable structure</h2>
<p>Choose one time, one cozy spot, and one simple rhythm. For example:</p>
<ol>
  <li>Read together for a short block.</li>
  <li>Talk about one idea from the text.</li>
  <li>Celebrate one thing your child did well.</li>
</ol>
<p>Predictability lowers stress and helps children come to reading with less resistance.</p>

<h2>Use support before frustration shows up</h2>
<p>If a text is too difficult, confidence drops quickly. A good routine includes books your child can handle successfully, plus gentle support with vocabulary, decoding, and comprehension questions.</p>

<h2>Make the win visible</h2>
<p>Children stay engaged when they can feel progress. Tracking books finished, new words learned, or moments of strong expression helps turn reading into proof that growth is happening.</p>
    `
  },
  {
    id: "what-personalized-tutoring-looks-like",
    title: "Homework Help for Kids in Ottawa: What Personalized Tutoring Looks Like at Kriana",
    slug: "what-personalized-tutoring-looks-like-at-kriana",
    category: "Kriana Approach",
    date: "2026-04-12",
    excerpt:
      "Personalized tutoring should do more than review homework. It should identify gaps, build confidence, and adapt to how each child learns best.",
    metaTitle: "Homework Help for Kids in Ottawa | Kriana Tutoring Blog",
    metaDescription:
      "Understand how personalized tutoring and homework help for kids in Ottawa can close gaps, build confidence, and support steady progress.",
    content: `
<h2>Homework help for kids in Ottawa begins with understanding the learner</h2>
<p>Homework help for kids is most effective when tutors look at more than grades. We want to know where a child feels confident, where they hesitate, and how they respond when work becomes challenging. That gives us a clearer starting point than a worksheet score alone.</p>

<h2>Instruction is adjusted in real time</h2>
<p>Personalized support means the tutor changes the pace, examples, and teaching method based on the student&apos;s response. If a child needs visual models, we use them. If they need guided repetition, we slow down. If they are ready to stretch, we challenge them.</p>

<h2>Confidence is part of the plan</h2>
<p>Children learn better when they feel safe making mistakes. We deliberately create sessions where students can ask questions, try again, and leave with evidence that they are improving.</p>

<h2>Parents stay informed without being overwhelmed</h2>
<p>Families need clear communication. We focus on practical updates:</p>
<ul>
  <li>what the student worked on</li>
  <li>what improved</li>
  <li>what the next step should be</li>
</ul>
<p>That keeps support aligned between tutoring and home.</p>
    `
  },
  {
    id: "best-math-tutoring-for-kids-in-ottawa",
    title: "Best Math Tutoring for Kids in Ottawa: What Parents Should Look For",
    slug: "best-math-tutoring-for-kids-in-ottawa-what-parents-should-look-for",
    category: "Parent Tips",
    date: "2026-03-14",
    excerpt:
      "Parents looking for the best math tutoring for kids in Ottawa should focus on fit, teaching approach, and whether sessions build confidence as well as skills.",
    metaTitle: "Best Math Tutoring for Kids in Ottawa | Kriana Tutoring Blog",
    metaDescription:
      "Learn what Ottawa parents should look for when choosing math tutoring for kids, including teaching style, confidence-building, and long-term academic support.",
    content: `
<h2>Best math tutoring for kids in Ottawa starts with the right fit</h2>
<p>Best math tutoring for kids in Ottawa is not just about finding someone who can explain homework. Parents should look for a tutor who can spot missing foundations, explain ideas in more than one way, and help children feel calmer and more capable around math.</p>
<p>When the fit is strong, children make better academic progress because they are more willing to ask questions, practise, and stay engaged when work gets difficult.</p>

<h2>Look for teaching that goes beyond answer-checking</h2>
<p>A strong tutor does more than correct mistakes. They explain why a method works, check for understanding, and adjust the lesson when a child needs more support with number sense, operations, or problem solving.</p>

<h2>Confidence should be part of the tutoring plan</h2>
<p>Many children who need math support are not only behind academically. They are also discouraged. Good tutoring helps rebuild confidence by creating smaller wins, clearer explanations, and enough repetition for concepts to stick.</p>

<h2>Ask practical questions before committing</h2>
<p>Parents can ask how sessions are personalized, how progress is shared, and whether the tutor has experience supporting children who avoid math or rush through work. Those answers often reveal whether the program is built for real growth or just short-term homework help.</p>
    `
  },
  {
    id: "how-to-find-reading-help-for-grade-1-students-in-ottawa",
    title: "How to Find Reading Help for Grade 1 Students in Ottawa",
    slug: "how-to-find-reading-help-for-grade-1-students-in-ottawa",
    category: "Learning Strategies",
    date: "2025-10-03",
    excerpt:
      "Families looking for reading help for Grade 1 students in Ottawa should focus on early literacy support that improves phonics, fluency, and confidence without overwhelming young learners.",
    metaTitle: "How to Find Reading Help for Grade 1 Students in Ottawa | Kriana Tutoring Blog",
    metaDescription:
      "Find out what to look for in Grade 1 reading help in Ottawa, including phonics support, confidence-building routines, and signs a child needs extra help.",
    content: `
<h2>Reading help for Grade 1 students in Ottawa should feel supportive and clear</h2>
<p>Reading help for Grade 1 students in Ottawa works best when families choose support that is structured, patient, and built around early literacy foundations. At this age, children need help with phonics, decoding, fluency, and confidence, not pressure to perform beyond their readiness.</p>
<p>The right support should help a child feel successful often enough that they stay willing to try again the next day.</p>

<h2>Prioritize phonics and decoding first</h2>
<p>If a child is still struggling to sound out words, it is important to start there. Strong reading programs for Grade 1 students should build letter-sound relationships, blending, and word recognition before expecting high-level comprehension.</p>

<h2>Look for routines families can reinforce at home</h2>
<p>The best reading support does not stop when the session ends. It gives parents simple ways to practise at home through short reading blocks, repeated texts, and vocabulary conversations that feel manageable in busy evenings.</p>

<h2>Choose a setting that protects confidence</h2>
<p>Young learners often know when reading feels harder for them than for classmates. Support should be calm, encouraging, and paced well enough that students can build fluency without feeling embarrassed or rushed.</p>
    `
  },
  {
    id: "homework-help-for-kids-in-kanata-when-to-get-extra-support",
    title: "Homework Help for Kids in Kanata: When to Get Extra Support",
    slug: "homework-help-for-kids-in-kanata-when-to-get-extra-support",
    category: "Parent Tips",
    date: "2025-06-18",
    excerpt:
      "Homework help for kids in Kanata becomes important when nightly schoolwork is turning into stress, avoidance, or a constant battle at home.",
    metaTitle: "Homework Help for Kids in Kanata | Kriana Tutoring Blog",
    metaDescription:
      "Learn when Kanata families should consider homework help for kids and what signs show a child needs extra academic support after school.",
    content: `
<h2>Homework help for kids in Kanata matters when evenings stop being productive</h2>
<p>Homework help for kids in Kanata can make a real difference when schoolwork is taking too long, ending in tears, or causing repeated tension at home. Extra support is often needed long before report cards show a major problem.</p>
<p>Parents usually notice the warning signs first: avoidance, rushing, constant reminders, or work that a child cannot complete independently.</p>

<h2>Look for patterns, not just bad nights</h2>
<p>Every child has occasional tough evenings. The bigger concern is when homework battles happen most nights, directions need to be repeated over and over, or your child seems unsure where to start even on familiar tasks.</p>

<h2>Extra support should build habits, not dependence</h2>
<p>Good homework help is not about sitting beside a child forever. It should teach planning, focus, task breakdown, and follow-through so students become more independent over time.</p>

<h2>Early support can prevent wider academic gaps</h2>
<p>When homework struggles are ignored for too long, missing concepts and weak routines usually pile up together. Getting help earlier makes it easier to reduce stress and rebuild consistency before the problem gets bigger.</p>
    `
  },
  {
    id: "signs-your-child-needs-a-tutor-for-math-in-ottawa",
    title: "Signs Your Child Needs a Tutor for Math in Ottawa",
    slug: "signs-your-child-needs-a-tutor-for-math-in-ottawa",
    category: "Parent Tips",
    date: "2025-01-27",
    excerpt:
      "If your child is avoiding math, taking too long on homework, or losing confidence at school, those may be signs it is time to consider a math tutor in Ottawa.",
    metaTitle: "Signs Your Child Needs a Tutor for Math in Ottawa | Kriana Tutoring Blog",
    metaDescription:
      "See the common signs a child may need math tutoring in Ottawa, from low confidence and slow homework to repeated confusion with core concepts.",
    content: `
<h2>Signs your child needs a tutor for math in Ottawa often show up at home first</h2>
<p>Signs your child needs a tutor for math in Ottawa usually appear before a major drop in grades. A child may avoid homework, say math is too hard, freeze on simple questions, or guess instead of explaining their thinking.</p>
<p>These signals often point to missing foundational understanding rather than a lack of effort.</p>

<h2>Watch for slow homework and rising frustration</h2>
<p>If math homework takes far longer than expected or leads to repeated arguments, it may mean your child no longer feels secure with the basics needed for classwork.</p>

<h2>Confidence changes matter just as much as grades</h2>
<p>Some children still manage acceptable grades while quietly losing confidence. If your child sounds defeated, avoids participating, or says they are just not a math person, support may be needed even before marks fall significantly.</p>

<h2>Earlier tutoring often leads to faster recovery</h2>
<p>When gaps are addressed early, children are more likely to catch up without carrying frustration from one unit into the next. Small interventions now can prevent much bigger struggles later.</p>
    `
  },
  {
    id: "how-to-help-a-grade-2-child-with-reading-at-home",
    title: "How to Help a Grade 2 Child With Reading at Home",
    slug: "how-to-help-a-grade-2-child-with-reading-at-home",
    category: "Learning Strategies",
    date: "2024-09-09",
    excerpt:
      "Helping a Grade 2 child with reading at home works best when families use short, steady routines that strengthen fluency, vocabulary, and comprehension.",
    metaTitle: "How to Help a Grade 2 Child With Reading at Home | Kriana Tutoring Blog",
    metaDescription:
      "Use simple routines to help a Grade 2 child with reading at home through fluency practice, vocabulary support, and encouraging comprehension conversations.",
    content: `
<h2>Helping a Grade 2 child with reading at home starts with short routines</h2>
<p>Helping a Grade 2 child with reading at home does not require long lessons or complicated materials. The most effective support usually comes from short, consistent reading routines that build fluency, vocabulary, and confidence over time.</p>
<p>Children at this stage benefit from repetition, encouragement, and books that feel challenging enough to grow but not so hard that they shut down.</p>

<h2>Read together before expecting independence</h2>
<p>Shared reading allows parents to model pacing, expression, and problem-solving. Taking turns reading aloud also gives children support without making them feel they must carry the entire task alone.</p>

<h2>Talk about the story in simple ways</h2>
<p>Comprehension grows when children are asked what happened, why a character made a choice, or what they think might happen next. These quick conversations help reading feel more meaningful and less mechanical.</p>

<h2>Celebrate progress children can notice</h2>
<p>Pointing out smoother reading, stronger expression, or better retelling helps children see growth happening. Visible progress is often what keeps home reading routines going.</p>
    `
  },
  {
    id: "what-makes-personalized-tutoring-better-than-homework-clubs",
    title: "What Makes Personalized Tutoring Better Than Homework Clubs",
    slug: "what-makes-personalized-tutoring-better-than-homework-clubs",
    category: "Kriana Approach",
    date: "2024-06-24",
    excerpt:
      "Personalized tutoring is often more effective than homework clubs because it adapts to the learner instead of giving the same kind of support to every child in the room.",
    metaTitle: "Personalized Tutoring Better Than Homework Clubs | Kriana Tutoring Blog",
    metaDescription:
      "Learn why personalized tutoring often leads to stronger results than homework clubs for children who need targeted academic support and confidence-building.",
    content: `
<h2>Personalized tutoring is better than homework clubs when a child needs targeted support</h2>
<p>Personalized tutoring is often better than homework clubs because it adapts to the learner instead of expecting one format to work for everyone. Children who are missing key concepts usually need focused teaching, not just a supervised place to finish assignments.</p>
<p>That difference matters when a child is already frustrated, behind, or unsure how to ask for help.</p>

<h2>Homework clubs are useful, but they have limits</h2>
<p>Homework clubs can provide accountability and quiet work time. They are helpful for some students, but they usually cannot offer the same depth of diagnosis, reteaching, and pacing that personalized tutoring can provide.</p>

<h2>Individualized instruction closes gaps faster</h2>
<p>When a tutor adjusts examples, explanations, and difficulty in real time, children are more likely to understand why they are stuck and what to do next. That is especially important in math, reading, and writing where one weak foundation affects everything after it.</p>

<h2>Confidence grows when children feel seen</h2>
<p>Many students improve academically once they feel their struggles are understood clearly. Personalized tutoring gives them more room to ask questions, try again, and experience progress that feels specific to them.</p>
    `
  }
];

export function getBlogPosts(category?: string) {
  const posts = [...blogPosts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (!category || !BLOG_CATEGORIES.includes(category as BlogCategory)) {
    return posts;
  }

  return posts.filter((post) => post.category === category);
}

export function getBlogPostBySlug(slug: string) {
  return blogPosts.find((post) => post.slug === slug);
}

export function getRelatedBlogPosts(slug: string, category: BlogCategory) {
  return blogPosts
    .filter((post) => post.slug !== slug)
    .sort((a, b) => Number(b.category === category) - Number(a.category === category))
    .slice(0, 2);
}

export function formatBlogDate(date: string) {
  return new Date(date).toLocaleDateString("en-CA", {
    month: "long",
    day: "numeric",
    year: "numeric"
  });
}
