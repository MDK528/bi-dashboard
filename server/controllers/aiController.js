// // const Anthropic = require('@anthropic-ai/sdk');
// // const  GoogleGenAI = require("@google/genai") 
// import  {GoogleGenAI} from "@google/genai"
// import { getTableSchema, executeQuery } from '../db/database.js';

// const client = new GoogleGenAI({ 
//   apiKey: process.env.GEMINI_API_KEY 
// });

// /**
//  * Build the system prompt with current schema context
//  */
// function buildSystemPrompt(schemas) {
//   const schemaText = schemas.map(s => {
//     const cols = s.columns.map(c => `  - ${c.name} (${c.type})`).join('\n');
//     const sample = s.sampleData.length > 0
//       ? `  Sample row: ${JSON.stringify(s.sampleData[0])}`
//       : '';
//     return `Table: ${s.tableName} (${s.rowCount} rows)\nColumns:\n${cols}\n${sample}`;
//   }).join('\n\n');

//   return `You are an expert Business Intelligence analyst and SQL expert. Your job is to convert natural language questions into SQL queries and generate dashboard configurations.

// AVAILABLE DATABASE SCHEMA:
// ${schemaText}

// YOUR TASK:
// Given a user's natural language question, you must respond with a valid JSON object (no markdown, no explanation, just JSON) in this exact format:

// {
//   "understood": true,
//   "sql": "SELECT ... FROM ...",
//   "charts": [
//     {
//       "type": "bar|line|pie|doughnut|area|scatter|table",
//       "title": "Chart Title",
//       "description": "What this chart shows",
//       "xKey": "column_name_for_x_axis",
//       "yKey": "column_name_for_y_axis",
//       "colorKey": "optional_column_for_color_grouping",
//       "aggregation": "sum|count|avg|none",
//       "sortBy": "value|label|none",
//       "limit": 10
//     }
//   ],
//   "insights": [
//     "Key insight 1 in plain English",
//     "Key insight 2 in plain English"
//   ],
//   "title": "Dashboard Title",
//   "summary": "One sentence summary of what this dashboard shows"
// }

// CHART SELECTION RULES:
// - Line chart: time-series data, trends over time
// - Bar chart: comparisons between categories (horizontal or vertical)
// - Pie/Doughnut: parts-of-a-whole, proportions (max 8 slices)
// - Area chart: cumulative totals over time
// - Scatter: correlation between two numeric variables
// - Table: detailed records, multiple columns needed

// SQL RULES:
// - Only write SELECT queries
// - Use proper SQLite syntax
// - Always include LIMIT clause (max 500 rows for table, max 50 for charts)
// - Use aliases for computed columns (e.g., SUM(revenue) as total_revenue)
// - For date grouping use: strftime('%Y-%m', order_date) as month
// - For year: strftime('%Y', order_date) as year

// HALLUCINATION PREVENTION:
// - If the question cannot be answered with the available schema, set "understood": false and explain in "summary"
// - Never make up column names or table names not in the schema
// - If data is ambiguous, choose the most reasonable interpretation

// MULTIPLE CHARTS:
// - Generate 2-4 charts when the question warrants it
// - Always include a summary/overview chart and a detail chart
// - Make charts complementary, not redundant`;
// }

// /**
//  * Main function: convert natural language to dashboard config
//  */
// async function generateDashboard(userMessage, conversationHistory = []) {
//   const schemas = getTableSchema();
  
//   if (schemas.length === 0) {
//     return {
//       success: false,
//       error: 'No data tables found. Please seed the database or upload a CSV file.',
//     };
//   }

//   const systemPrompt = buildSystemPrompt(schemas);

//   // Build messages array with history
//   const messages = [
//     ...conversationHistory.map(m => ({
//       role: m.role,
//       content: m.role === 'assistant' 
//         ? (typeof m.content === 'string' ? m.content : JSON.stringify(m.dashboardData || m.content))
//         : m.content,
//     })),
//     { role: 'user', content: userMessage },
//   ];

//   try {
//     const response = await client.messages.create({
//       model: 'gemini-2.5-flash',
//       max_tokens: 2000,
//       system: systemPrompt,
//       messages,
//     });

//     const rawText = response.content
//       .filter(b => b.type === 'text')
//       .map(b => b.text)
//       .join('');

//     // Parse JSON response
//     let dashboardConfig;
//     try {
//       // Strip markdown code fences if present
//       const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
//       dashboardConfig = JSON.parse(cleaned);
//     } catch (parseErr) {
//       console.error('Failed to parse AI response:', rawText);
//       return {
//         success: false,
//         error: 'AI returned an unparseable response. Please rephrase your question.',
//         rawResponse: rawText,
//       };
//     }

//     if (!dashboardConfig.understood) {
//       return {
//         success: false,
//         error: dashboardConfig.summary || 'This question cannot be answered with the available data.',
//         understood: false,
//       };
//     }

//     // Execute the SQL
//     const queryResult = executeQuery(dashboardConfig.sql);
//     if (!queryResult.success) {
//       // Try to self-heal: ask AI to fix the SQL
//       const fixResponse = await client.messages.create({
//         model: 'claude-sonnet-4-20250514',
//         max_tokens: 500,
//         system: systemPrompt,
//         messages: [
//           ...messages,
//           {
//             role: 'assistant',
//             content: JSON.stringify(dashboardConfig),
//           },
//           {
//             role: 'user',
//             content: `The SQL failed with error: "${queryResult.error}". Please fix the SQL and return only the corrected JSON.`,
//           },
//         ],
//       });

//       const fixedText = fixResponse.content.filter(b => b.type === 'text').map(b => b.text).join('');
//       try {
//         const fixedCleaned = fixedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
//         dashboardConfig = JSON.parse(fixedCleaned);
//         const retryResult = executeQuery(dashboardConfig.sql);
//         if (!retryResult.success) {
//           return { success: false, error: `SQL Error: ${retryResult.error}` };
//         }
//         queryResult.rows = retryResult.rows;
//         queryResult.rowCount = retryResult.rowCount;
//       } catch {
//         return { success: false, error: `SQL Error: ${queryResult.error}` };
//       }
//     }

//     return {
//       success: true,
//       title: dashboardConfig.title,
//       summary: dashboardConfig.summary,
//       insights: dashboardConfig.insights || [],
//       charts: dashboardConfig.charts,
//       data: queryResult.rows,
//       rowCount: queryResult.rowCount,
//       sql: dashboardConfig.sql,
//     };
//   } catch (err) {
//     console.error('AI generation error:', err);
//     return {
//       success: false,
//       error: err.message || 'Failed to generate dashboard',
//     };
//   }
// }

// export { generateDashboard };


import { GoogleGenAI } from "@google/genai";
import { getTableSchema, executeQuery } from '../db/database.js';

const client = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// console.log("GEMINI_API_KEY: ", process.env.GEMINI_API_KEY);


/**
 * Build the system prompt with current schema context
 */
function buildSystemPrompt(schemas) {
  const schemaText = schemas.map(s => {
    const cols = s.columns.map(c => `  - ${c.name} (${c.type})`).join('\n');
    const sample = s.sampleData.length > 0
      ? `  Sample row: ${JSON.stringify(s.sampleData[0])}`
      : '';
    return `Table: ${s.tableName} (${s.rowCount} rows)\nColumns:\n${cols}\n${sample}`;
  }).join('\n\n');

  return `You are an expert Business Intelligence analyst and SQL expert. Your job is to convert natural language questions into SQL queries and generate dashboard configurations. Your response must be ONLY a valid JSON object. 
  No markdown, no backticks, no explanation, no text before or after the JSON.

AVAILABLE DATABASE SCHEMA:
${schemaText}

YOUR TASK:
Given a user's natural language question, you must respond with a valid JSON object (no markdown, no explanation, just JSON) in this exact format:

{
  "understood": true,
  "sql": "SELECT ... FROM ...",
  "charts": [
    {
      "type": "bar|line|pie|doughnut|area|scatter|table",
      "title": "Chart Title",
      "description": "What this chart shows",
      "xKey": "column_name_for_x_axis",
      "yKey": "column_name_for_y_axis",
      "colorKey": "optional_column_for_color_grouping",
      "aggregation": "sum|count|avg|none",
      "sortBy": "value|label|none",
      "limit": 10
    }
  ],
  "insights": [
    "Key insight 1 in plain English",
    "Key insight 2 in plain English"
  ],
  "title": "Dashboard Title",
  "summary": "One sentence summary of what this dashboard shows"
}

CHART SELECTION RULES:
- Line chart: time-series data, trends over time
- Bar chart: comparisons between categories (horizontal or vertical)
- Pie/Doughnut: parts-of-a-whole, proportions (max 8 slices)
- Area chart: cumulative totals over time
- Scatter: correlation between two numeric variables
- Table: detailed records, multiple columns needed

SQL RULES:
- Only write SELECT queries
- Use proper SQLite syntax
- Always include LIMIT clause (max 500 rows for table, max 50 for charts)
- Use aliases for computed columns (e.g., SUM(revenue) as total_revenue)
- For date grouping use: strftime('%Y-%m', order_date) as month
- For year: strftime('%Y', order_date) as year

HALLUCINATION PREVENTION:
- If the question cannot be answered with the available schema, set "understood": false and explain in "summary"
- Never make up column names or table names not in the schema
- If data is ambiguous, choose the most reasonable interpretation

MULTIPLE CHARTS:
- Generate 2-4 charts when the question warrants it
- Always include a summary/overview chart and a detail chart
- Make charts complementary, not redundant`;
}

/**
 * Convert conversation history to Gemini's message format
 * Gemini uses: { role, parts: [{ text }] }
 */
function buildGeminiMessages(conversationHistory, userMessage) {
  const history = conversationHistory.map(m => ({
    role: m.role,
    parts: [{
      text: m.role === 'assistant'
        ? (typeof m.content === 'string' ? m.content : JSON.stringify(m.dashboardData || m.content))
        : m.content
    }]
  }));

  return [
    ...history,
    { role: 'user', parts: [{ text: userMessage }] }
  ];
}

/**
 * Main function: convert natural language to dashboard config
 */
async function generateDashboard(userMessage, conversationHistory = []) {
  const schemas = getTableSchema();

  if (schemas.length === 0) {
    return {
      success: false,
      error: 'No data tables found. Please seed the database or upload a CSV file.',
    };
  }

  const systemPrompt = buildSystemPrompt(schemas);
  const messages = buildGeminiMessages(conversationHistory, userMessage);

  try {
    // ✅ Correct Gemini SDK call
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: messages,
      config: {
        systemInstruction: systemPrompt,
        maxOutputTokens: 2000,
        responseMimeType: 'application/json'
      }
    });

    // ✅ Correct Gemini response parsing
    const rawText = response.text;

    // Parse JSON response
    let dashboardConfig;
    try {
      // Strip markdown code fences if present
      const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      dashboardConfig = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error('Failed to parse AI response:', rawText);
      return {
        success: false,
        error: 'AI returned an unparseable response. Please rephrase your question.',
        rawResponse: rawText,
      };
    }

    if (!dashboardConfig.understood) {
      return {
        success: false,
        error: dashboardConfig.summary || 'This question cannot be answered with the available data.',
        understood: false,
      };
    }

    // Execute the SQL
    const queryResult = executeQuery(dashboardConfig.sql);
    if (!queryResult.success) {
      // Self-heal: ask Gemini to fix the SQL
      const fixMessages = [
        ...messages,
        {
          role: 'model', // ✅ Gemini uses 'model' not 'assistant' for AI turns
          parts: [{ text: JSON.stringify(dashboardConfig) }]
        },
        {
          role: 'user',
          parts: [{ text: `The SQL failed with error: "${queryResult.error}". Please fix the SQL and return only the corrected JSON.` }]
        }
      ];

      const fixResponse = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: fixMessages,
        config: {
          systemInstruction: systemPrompt,
          maxOutputTokens: 1000,
        }
      });

      const fixedText = fixResponse.text;
      try {
        const fixedCleaned = fixedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        dashboardConfig = JSON.parse(fixedCleaned);
        const retryResult = executeQuery(dashboardConfig.sql);
        if (!retryResult.success) {
          return { success: false, error: `SQL Error: ${retryResult.error}` };
        }
        queryResult.rows = retryResult.rows;
        queryResult.rowCount = retryResult.rowCount;
      } catch {
        return { success: false, error: `SQL Error: ${queryResult.error}` };
      }
    }

    return {
      success: true,
      title: dashboardConfig.title,
      summary: dashboardConfig.summary,
      insights: dashboardConfig.insights || [],
      charts: dashboardConfig.charts,
      data: queryResult.rows,
      rowCount: queryResult.rowCount,
      sql: dashboardConfig.sql,
    };
  } catch (err) {
    console.error('AI generation error:', err);
    return {
      success: false,
      error: err.message || 'Failed to generate dashboard',
    };
  }
}

export { generateDashboard };