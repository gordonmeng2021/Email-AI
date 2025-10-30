/**
 * Writer API Service
 * Uses Chrome's built-in Writer API (Gemini Nano) for content generation
 * Reference: https://developer.chrome.com/docs/ai/writer-api
 */

/**
 * Check if Writer API is available
 * @returns {Promise<string>} 'available', 'after-download', or 'unavailable'
 */
export async function checkWriterAvailability() {
  try {
    
    const availability = await self.ai.writer.availability();
    console.log('Writer API availability:', availability);
    return availability;
  } catch (error) {
    console.error('Error checking Writer API availability:', error);
    return 'unavailable';
  }
}

/**
 * Create a Writer API session
 * @param {Object} options - Session options
 * @param {string} options.tone - Writing tone: 'formal', 'neutral', or 'casual'
 * @param {string} options.format - Output format: 'markdown' or 'plain-text'
 * @param {string} options.length - Output length: 'short', 'medium', or 'long'
 * @param {string} options.sharedContext - Shared context for multiple writings
 * @param {Array<string>} options.expectedInputLanguages - Expected input languages
 * @param {Array<string>} options.expectedContextLanguages - Expected context languages
 * @param {string} options.outputLanguage - Output language
 * @param {Function} options.onDownloadProgress - Callback for download progress
 * @returns {Promise<Object>} Writer object
 */
export async function createWriter(options = {}) {
  try {
    const availability = await checkWriterAvailability();
    
    if (availability === 'unavailable') {
      throw new Error('Writer API is not available on this device');
    }

    const writerOptions = {
      tone: options.tone || 'neutral',
      format: options.format || 'plain-text',
      length: options.length || 'medium'
    };
    
    // Add shared context if provided
    if (options.sharedContext) {
      writerOptions.sharedContext = options.sharedContext;
    }
    
    // Add language settings if provided
    if (options.expectedInputLanguages) {
      writerOptions.expectedInputLanguages = options.expectedInputLanguages;
    }
    
    if (options.expectedContextLanguages) {
      writerOptions.expectedContextLanguages = options.expectedContextLanguages;
    }
    
    if (options.outputLanguage) {
      writerOptions.outputLanguage = options.outputLanguage;
    }

    // Add download monitoring for downloadable models
    if (availability === 'after-download') {
      console.log('Writer model needs to be downloaded. Setting up download monitor...');
      
      writerOptions.monitor = (m) => {
        m.addEventListener('downloadprogress', (e) => {
          const progress = Math.round(e.loaded * 100);
          console.log(`Writer API model download progress: ${progress}%`);
          
          if (options.onDownloadProgress) {
            options.onDownloadProgress(progress);
          }
        });
      };
    }

    console.log('Creating Writer API session with options:', writerOptions);
    const writer = await self.ai.writer.create(writerOptions);
    console.log('Writer API session created successfully');
    
    return writer;
  } catch (error) {
    console.error('Failed to create Writer API session:', error);
    throw error;
  }
}

/**
 * Write content with a single query (non-streaming)
 * @param {string} prompt - The writing task description
 * @param {Object} options - Options
 * @param {string} options.context - Context for the writing
 * @param {string} options.tone - Writing tone ('formal', 'neutral', 'casual')
 * @param {string} options.format - Output format ('markdown', 'plain-text')
 * @param {string} options.length - Output length ('short', 'medium', 'long')
 * @param {string} options.sharedContext - Shared context for multiple writings
 * @returns {Promise<string>} Generated content
 */
export async function write(prompt, options = {}) {
  let writer = null;
  
  try {
    const writerOptions = {
      tone: options.tone,
      format: options.format,
      length: options.length,
      sharedContext: options.sharedContext,
      expectedInputLanguages: options.expectedInputLanguages,
      expectedContextLanguages: options.expectedContextLanguages,
      outputLanguage: options.outputLanguage
    };
    
    writer = await createWriter(writerOptions);
    
    console.log('Sending write request:', prompt);
    const writeOptions = {};
    if (options.context) {
      writeOptions.context = options.context;
    }
    
    const result = await writer.write(prompt, writeOptions);
    console.log('Received response:', result);
    
    return result;
  } catch (error) {
    console.error('Failed to write:', error);
    throw error;
  } finally {
    if (writer) {
      writer.destroy();
      console.log('Writer destroyed');
    }
  }
}

/**
 * Write content with streaming response
 * @param {string} prompt - The writing task description
 * @param {Function} onChunk - Callback for each chunk of response
 * @param {Object} options - Options
 * @param {string} options.context - Context for the writing
 * @param {string} options.tone - Writing tone
 * @param {string} options.format - Output format
 * @param {string} options.length - Output length
 * @param {string} options.sharedContext - Shared context for multiple writings
 * @returns {Promise<string>} Complete generated content
 */
export async function writeStreaming(prompt, onChunk, options = {}) {
  let writer = null;
  
  try {
    const writerOptions = {
      tone: options.tone,
      format: options.format,
      length: options.length,
      sharedContext: options.sharedContext,
      expectedInputLanguages: options.expectedInputLanguages,
      expectedContextLanguages: options.expectedContextLanguages,
      outputLanguage: options.outputLanguage
    };
    
    writer = await createWriter(writerOptions);
    
    console.log('Sending streaming write request:', prompt);
    const writeOptions = {};
    if (options.context) {
      writeOptions.context = options.context;
    }
    
    const stream = writer.writeStreaming(prompt, writeOptions);
    
    let fullResponse = '';
    
    for await (const chunk of stream) {
      fullResponse = chunk;
      if (onChunk) {
        onChunk(chunk);
      }
    }
    
    console.log('Streaming complete. Full response:', fullResponse);
    return fullResponse;
  } catch (error) {
    console.error('Failed to stream write:', error);
    throw error;
  } finally {
    if (writer) {
      writer.destroy();
      console.log('Writer destroyed');
    }
  }
}

/**
 * Example: Generate email reply using Writer API
 * @param {string} emailContent - Original email content
 * @param {string} tone - Tone of the reply (formal, neutral, casual)
 * @returns {Promise<string>} Generated reply
 */
export async function generateReplyWithWriter(emailContent, tone = 'formal') {
  const sharedContext = 'This is an email reply to be sent through Gmail. The reply should be professional, courteous, and address the main points from the original email.';

  try {
    const result = await write(
      'Write a professional email reply addressing the main points from the original email.',
      { 
        context: `Original email:\n\n${emailContent}`,
        tone,
        sharedContext,
        format: 'plain-text',
        length: 'medium',
        expectedInputLanguages: ['en'],
        expectedContextLanguages: ['en'],
        outputLanguage: 'en'
      }
    );
    
    return result;
  } catch (error) {
    console.error('Reply generation failed:', error);
    throw error;
  }
}

/**
 * Example: Write content with specific style using Writer API
 * @param {string} taskDescription - What to write
 * @param {string} context - Background information
 * @param {Object} options - Writing options
 * @returns {Promise<string>} Generated content
 */
export async function writeContent(taskDescription, context, options = {}) {
  try {
    const result = await write(
      taskDescription,
      {
        context,
        tone: options.tone || 'neutral',
        format: options.format || 'plain-text',
        length: options.length || 'medium',
        sharedContext: options.sharedContext,
        expectedInputLanguages: options.expectedInputLanguages || ['en'],
        expectedContextLanguages: options.expectedContextLanguages || ['en'],
        outputLanguage: options.outputLanguage || 'en'
      }
    );
    
    return result;
  } catch (error) {
    console.error('Content writing failed:', error);
    throw error;
  }
}

/**
 * Reuse a writer for multiple tasks
 * This is more efficient when generating multiple pieces of content
 * @param {Array<{prompt: string, context: string}>} tasks - Array of writing tasks
 * @param {Object} options - Writer options
 * @returns {Promise<Array<string>>} Array of generated content
 */
export async function writeMultiple(tasks, options = {}) {
  let writer = null;
  
  try {
    writer = await createWriter(options);
    
    const results = [];
    for (const task of tasks) {
      const writeOptions = {};
      if (task.context) {
        writeOptions.context = task.context;
      }
      
      const result = await writer.write(task.prompt, writeOptions);
      results.push(result);
    }
    
    return results;
  } catch (error) {
    console.error('Multiple write failed:', error);
    throw error;
  } finally {
    if (writer) {
      writer.destroy();
      console.log('Writer destroyed');
    }
  }
}

