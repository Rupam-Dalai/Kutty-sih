import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Fallback heuristic comment analysis if Gemini API key is not configured or network error occurs.
 */
function fallbackSentimentAnalysis(scorecard) {
  const combinedComments = [
    scorecard.c1_comments,
    scorecard.c2_comments,
    scorecard.c3_comments,
    scorecard.c4_comments,
    scorecard.c5_comments,
    scorecard.c6_comments,
    scorecard.c7_comments,
    scorecard.c8_comments,
    scorecard.wrong_perspective_observation,
    scorecard.overall_comments
  ].filter(Boolean).join(' ').toLowerCase();

  const positiveKeywords = ['excellent', 'strong', 'clear', 'impressive', 'good', 'deep', 'sound', 'solid', 'well', 'thorough', 'innovative', 'capable', 'defended', 'proactive', 'understood'];
  const negativeKeywords = ['poor', 'weak', 'struggled', 'failed', 'superficial', 'confused', 'could not', 'lack', 'lacking', 'unable', 'unclear', 'shallow', 'vague', 'hesitant'];

  let posCount = 0;
  let negCount = 0;

  for (const word of positiveKeywords) {
    const matches = combinedComments.match(new RegExp(`\\b${word}`, 'gi'));
    if (matches) posCount += matches.length;
  }
  for (const word of negativeKeywords) {
    const matches = combinedComments.match(new RegExp(`\\b${word}`, 'gi'));
    if (matches) negCount += matches.length;
  }

  let sentiment = 'Neutral';
  if (posCount > negCount + 1) sentiment = 'Positive';
  else if (negCount > posCount + 1) sentiment = 'Negative';

  return {
    sentiment,
    summary: sentiment === 'Positive'
      ? 'Strong qualitative remarks highlighting authentic domain grasp and collaborative explanation.'
      : sentiment === 'Negative'
      ? 'Notable gaps identified during technical probing or individual contribution check.'
      : 'Balanced qualitative feedback with standard compliance to criteria.',
    strengths: posCount > 0 ? ['Positive faculty remarks across evaluation checkpoints'] : ['Criteria baseline met'],
    concerns: negCount > 0 ? ['Areas flagged for deeper validation and member depth'] : ['None heavily flagged'],
    tiebreakerInsight: `Score ${scorecard.total_score || 0}/80 with ${sentiment.toLowerCase()} qualitative sentiment. ${sentiment === 'Positive' ? 'Favorable for tie resolution based on depth of faculty remarks.' : 'Review comments closely before tie resolution.'}`
  };
}

/**
 * Analyzes scorecard comments using Gemini API with gemini-3.6-flash.
 * 
 * @param {object} scorecard
 * @returns {Promise<{ sentiment: 'Positive' | 'Negative' | 'Neutral', analysis: object }>}
 */
export async function analyzeScorecardComments(scorecard) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === '' || apiKey === 'YOUR_GEMINI_API_KEY') {
    const fallback = fallbackSentimentAnalysis(scorecard);
    return {
      sentiment: fallback.sentiment,
      analysis: fallback
    };
  }

  const models = ['gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-1.5-flash'];
  const genAI = new GoogleGenerativeAI(apiKey);

  const prompt = `
You are an expert judging committee advisor for the Smart India Hackathon (SIH).
Analyze the following faculty comments and scores given to a hackathon team.

Scorecard Details:
- Team Total Score: ${scorecard.total_score}/80
- Problem Understanding Comments: ${scorecard.c1_comments || 'N/A'}
- Problem-Solving Mindset Comments: ${scorecard.c2_comments || 'N/A'}
- Team Coordination Comments (Mandatory): ${scorecard.c3_comments || 'N/A'}
- Individual Contribution Selected Member (${scorecard.c4_selected_member}): Score ${scorecard.c4_random_member_score}/2, Comments: ${scorecard.c4_comments || 'N/A'}
- Research & Validation Comments: ${scorecard.c5_comments || 'N/A'}
- Innovation & Creativity Comments: ${scorecard.c6_comments || 'N/A'}
- Execution Thinking Comments: ${scorecard.c7_comments || 'N/A'}
- Communication & Pitch Comments: ${scorecard.c8_comments || 'N/A'}
- Wrong-Perspective Challenge Reaction: ${scorecard.wrong_perspective_reaction || 'N/A'}
- Wrong-Perspective Observation: ${scorecard.wrong_perspective_observation || 'N/A'}
- Overall Comments: ${scorecard.overall_comments || 'N/A'}

TASK:
1. Determine the overall qualitative sentiment of the faculty feedback strictly as: "Positive", "Negative", or "Neutral".
2. Provide a concise summary of the team's qualitative strengths.
3. Provide any noted concerns or red flags.
4. Provide a 1-sentence tiebreaker insight (explaining how this qualitative feedback can help the admin distinguish this team if tied with another team having a similar score).

Respond ONLY with a valid JSON object matching this structure:
{
  "sentiment": "Positive" | "Negative" | "Neutral",
  "summary": "Brief 1-2 sentence overall qualitative synthesis",
  "strengths": ["Key strength 1", "Key strength 2"],
  "concerns": ["Key concern or area to verify"],
  "tiebreakerInsight": "1 concise sentence to aid tiebreaker decisions"
}
`;

  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      // Clean JSON response
      const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanedText);

      const validSentiments = ['Positive', 'Negative', 'Neutral'];
      const finalSentiment = validSentiments.includes(parsed.sentiment) ? parsed.sentiment : 'Neutral';

      return {
        sentiment: finalSentiment,
        analysis: {
          sentiment: finalSentiment,
          summary: parsed.summary || 'Qualitative feedback processed by Gemini.',
          strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
          concerns: Array.isArray(parsed.concerns) ? parsed.concerns : [],
          tiebreakerInsight: parsed.tiebreakerInsight || 'Review comments for tie-breaking details.'
        }
      };
    } catch (err) {
      console.warn(`[Gemini Service] Model ${modelName} call failed, trying next fallback:`, err.message);
    }
  }

  // Fallback if all API attempts fail
  const fallback = fallbackSentimentAnalysis(scorecard);
  return {
    sentiment: fallback.sentiment,
    analysis: fallback
  };
}
