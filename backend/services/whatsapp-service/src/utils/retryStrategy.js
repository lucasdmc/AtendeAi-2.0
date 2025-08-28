class RetryStrategy {
    constructor(maxRetries = 3, baseDelay = 1000, maxDelay = 30000) {
        this.maxRetries = maxRetries;
        this.baseDelay = baseDelay;
        this.maxDelay = maxDelay;
    }

    async execute(operation, context = {}) {
        let lastError;
        
        for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error;
                
                if (attempt === this.maxRetries) {
                    break;
                }

                const delay = this.calculateDelay(attempt);
                await this.sleep(delay);
                
                console.log(`Retry attempt ${attempt + 1}/${this.maxRetries} for ${context.operation || 'unknown'}`);
            }
        }
        
        throw new Error(`Operation failed after ${this.maxRetries} retries: ${lastError.message}`);
    }

    calculateDelay(attempt) {
        const delay = this.baseDelay * Math.pow(2, attempt);
        return Math.min(delay, this.maxDelay);
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = RetryStrategy;
