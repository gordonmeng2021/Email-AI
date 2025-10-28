# API Integration Options for AI Email Manager

This document compares different LLM API options for the email classification and processing features.

## Current Implementation: OpenRouter (Gemini 2.0 Flash)

### Pros:
- ✅ Already integrated and working
- ✅ Access to multiple models (not locked to one provider)
- ✅ Free tier available with Gemini 2.0 Flash Experimental
- ✅ Simple REST API with standard OpenAI-compatible interface
- ✅ Good performance and response times
- ✅ Handles rate limiting and fallbacks across providers

### Cons:
- ⚠️ Requires API key management
- ⚠️ Depends on third-party service availability
- ⚠️ Free tier may have rate limits

## Option 1: Direct Google Gemini API

### Description:
Use Google's Gemini API directly through `ai.google.dev` instead of OpenRouter.

### Implementation:
```javascript
// Example endpoint:
https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent

// Headers:
{
  'Content-Type': 'application/json',
  'x-goog-api-key': YOUR_API_KEY
}
```

### Pros:
- ✅ Direct connection to Google's infrastructure
- ✅ May have better rate limits for Gemini specifically
- ✅ Access to latest Gemini features immediately
- ✅ Free tier available (60 requests per minute)
- ✅ Official support from Google

### Cons:
- ⚠️ Still requires API key management
- ⚠️ Locked to Google's ecosystem only
- ⚠️ Less flexibility if we want to switch models
- ⚠️ Requires code changes to migrate

## Option 2: Chrome Built-in AI (Prompt API)

### Description:
Use Chrome's experimental Prompt API which provides on-device AI capabilities.

### Implementation:
```javascript
// Example usage:
const session = await window.ai.createTextSession();
const result = await session.prompt('Classify this email...');
```

### Pros:
- ✅ No API key required
- ✅ Works offline (on-device processing)
- ✅ No rate limits
- ✅ Better privacy (data doesn't leave user's device)
- ✅ No cost to users or developers
- ✅ Fast response times (local processing)

### Cons:
- ⚠️ **Currently in Origin Trial** (experimental feature)
- ⚠️ Limited to Chrome browser only
- ⚠️ Requires Chrome 129+ with specific flags enabled
- ⚠️ Less powerful than cloud-based models
- ⚠️ Not yet production-ready
- ⚠️ API may change before stable release
- ⚠️ Limited model capabilities compared to Gemini 2.0

### Status:
- As of January 2025, still in experimental/origin trial phase
- Not recommended for production use yet
- Need to monitor for stable release

## Option 3: Hybrid Approach

### Description:
Use Chrome Prompt API when available (fallback to OpenRouter/Gemini when not).

### Implementation Strategy:
```javascript
async function classifyEmail(emailData) {
  // Try Chrome built-in AI first
  if (window.ai && window.ai.createTextSession) {
    try {
      return await classifyWithChromeAI(emailData);
    } catch (e) {
      console.log('Chrome AI not available, falling back to cloud API');
    }
  }
  
  // Fallback to OpenRouter/Gemini API
  return await classifyWithCloudAPI(emailData);
}
```

### Pros:
- ✅ Best of both worlds
- ✅ Graceful degradation
- ✅ Future-proof
- ✅ Better privacy when possible
- ✅ Cost savings when Chrome AI is available

### Cons:
- ⚠️ More complex implementation
- ⚠️ Need to maintain two code paths
- ⚠️ Testing complexity increases

## Recommendations

### Short-term (Current): Stick with OpenRouter
**Reasoning:**
1. Already implemented and working
2. Chrome Prompt API is not production-ready yet
3. OpenRouter provides flexibility to switch models if needed
4. Gemini 2.0 Flash through OpenRouter is free and performant

### Medium-term (3-6 months): Monitor Chrome Prompt API
**Action items:**
1. Test Chrome Prompt API in development builds
2. Evaluate performance vs. cloud APIs
3. Check feature stability and adoption
4. Plan migration strategy if it becomes stable

### Long-term (6-12 months): Implement Hybrid Approach
**If Chrome Prompt API becomes stable:**
1. Implement hybrid system with Chrome AI as primary
2. Keep OpenRouter/Gemini as fallback
3. Add user settings to choose API preference
4. Optimize based on use case (speed vs. quality)

## Implementation Changes Needed for Direct Gemini API

If we decide to switch from OpenRouter to direct Gemini API:

### 1. Update `apiConfig.js`:
```javascript
export const API_ENDPOINTS = {
  GEMINI: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
  // ... other endpoints
};

export function getGeminiHeaders(apiKey) {
  return {
    'Content-Type': 'application/json',
    'x-goog-api-key': apiKey
  };
}
```

### 2. Update Request Format:
Gemini API uses a different request format than OpenRouter:
```javascript
{
  "contents": [{
    "parts": [{"text": "Your prompt here"}]
  }]
}
```

### 3. Update Response Parsing:
Gemini API response format:
```javascript
{
  "candidates": [{
    "content": {
      "parts": [{"text": "Response text"}]
    }
  }]
}
```

## Cost Comparison

| Service | Free Tier | Paid Tier | Rate Limits |
|---------|-----------|-----------|-------------|
| OpenRouter (Gemini) | Free (with limits) | Pay per token | Varies by model |
| Direct Gemini API | 60 req/min free | Pay per token | 60 req/min (free) |
| Chrome Prompt API | Unlimited (local) | N/A | None (local) |

## Conclusion

**Current Recommendation: Keep OpenRouter for now**

The current implementation using OpenRouter with Gemini 2.0 Flash is the best choice because:
1. It's already working well
2. Chrome Prompt API is not production-ready
3. OpenRouter provides flexibility and good performance
4. Free tier is sufficient for most users

**Future Plan:**
- Monitor Chrome Prompt API development
- Consider hybrid approach when Chrome AI becomes stable
- Keep code modular for easy switching between APIs

## References

- [Chrome Prompt API Documentation](https://developer.chrome.com/blog/prompt-api-origin-trial)
- [Google Gemini API Documentation](https://ai.google.dev/docs)
- [OpenRouter Documentation](https://openrouter.ai/docs)

---

*Last Updated: January 2025*

